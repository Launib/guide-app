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

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded)
            {
                Console.WriteLine($"User {userId} deleted successfully");
                return Ok(new { message = "User deleted successfully" });
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
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
