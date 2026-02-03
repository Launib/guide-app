using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MyApiProject.Data;
using MyApiProject.Models;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

//The app admin controller will handle administrative tasks for the application.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AppAdminController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public AppAdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _context.Users
                .Select(u => new
                {
                    id = u.Id,
                    userName = u.UserName,
                    email = u.Email,
                    userEmail = u.UserEmail,
                    userFullName = u.UserFullName,
                    userPhoneNumber = u.UserPhoneNumber,
                    location = u.Location,
                    address = u.Address,
                    accountType = u.AccountType
                })
                .ToListAsync();

            // Get roles for each user
            var usersWithRoles = new List<object>();
            foreach (var user in users)
            {
                var appUser = await _userManager.FindByIdAsync(user.id);
                var roles = appUser != null ? await _userManager.GetRolesAsync(appUser) : new List<string>();

                usersWithRoles.Add(new
                {
                    id = user.id,
                    userName = user.userName,
                    email = user.email ?? user.userEmail,
                    userEmail = user.userEmail,
                    userFullName = user.userFullName,
                    userPhoneNumber = user.userPhoneNumber,
                    location = user.location,
                    address = user.address,
                    accountType = user.accountType,
                    roles = roles
                });
            }

            Console.WriteLine($"Found {usersWithRoles.Count} users");
            return Ok(usersWithRoles);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching users: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpDelete("users/{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User not found: {userId}");
                return NotFound("User not found");
            }

            // Prevent deleting yourself (the currently logged-in user)
            var currentUserId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == currentUserId)
            {
                Console.WriteLine($"Cannot delete yourself: {userId}");
                return BadRequest("Cannot delete your own account");
            }

            Console.WriteLine($"Starting cascading deletion for user {userId}");

            // Step 1: Find and delete all businesses owned by this user
            var ownedBusinesses = await _context.Businesses
                .Where(b => b.OwnerId == userId)
                .ToListAsync();

            if (ownedBusinesses.Any())
            {
                Console.WriteLine($"Found {ownedBusinesses.Count} businesses owned by user {userId}");

                // For each business, find and delete the associated BusinessUser account
                foreach (var business in ownedBusinesses)
                {
                    // Find BusinessUser associated with this business
                    var businessUser = await _context.BusinessUsers
                        .FirstOrDefaultAsync(bu => bu.BusinessId == business.Id);

                    if (businessUser != null)
                    {
                        Console.WriteLine($"Deleting BusinessUser account {businessUser.Id} linked to business {business.Id}");
                        var deleteResult = await _userManager.DeleteAsync(businessUser);
                        if (!deleteResult.Succeeded)
                        {
                            Console.WriteLine($"Warning: Failed to delete BusinessUser {businessUser.Id}: {string.Join(", ", deleteResult.Errors.Select(e => e.Description))}");
                        }
                    }

                    // Clear SubManager reference if exists
                    if (business.SubManagerId != null)
                    {
                        Console.WriteLine($"Clearing SubManager reference from business {business.Id}");
                        business.SubManagerId = null;
                    }
                }

                // Delete all owned businesses
                _context.Businesses.RemoveRange(ownedBusinesses);
                Console.WriteLine($"Deleted {ownedBusinesses.Count} businesses");
            }

            // Step 2: If this is a BusinessUser, clear the business reference
            if (user is BusinessUser businessUserToDelete && businessUserToDelete.BusinessId.HasValue)
            {
                Console.WriteLine($"User is a BusinessUser linked to business {businessUserToDelete.BusinessId}");
                var linkedBusiness = await _context.Businesses.FindAsync(businessUserToDelete.BusinessId.Value);
                if (linkedBusiness != null)
                {
                    // Clear the HasAccount flag and username since the BusinessUser is being deleted
                    linkedBusiness.HasAccount = false;
                    linkedBusiness.BusinessUsername = null;
                    Console.WriteLine($"Cleared BusinessUser account info from business {linkedBusiness.Id}");
                }
            }

            // Step 3: If this is a SubManagerUser, clear references from businesses
            if (user is SubManagerUser)
            {
                var managedBusinesses = await _context.Businesses
                    .Where(b => b.SubManagerId == userId)
                    .ToListAsync();

                foreach (var business in managedBusinesses)
                {
                    business.SubManagerId = null;
                    Console.WriteLine($"Cleared SubManager reference from business {business.Id}");
                }
            }

            // Save all business changes before deleting the user
            await _context.SaveChangesAsync();
            Console.WriteLine("Saved all business-related changes");

            // Step 4: Delete the user account
            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                Console.WriteLine($"User {userId} and all related data deleted successfully");
                return Ok(new { message = "User and all related data deleted successfully" });
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                Console.WriteLine($"Error deleting user: {errors}");
                return BadRequest($"Failed to delete user: {errors}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting user: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
