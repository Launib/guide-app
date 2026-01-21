using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using MyApiProject.Data;
using MyApiProject.Models;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BusinessController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public BusinessController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    [HttpGet("pending")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetPendingBusinesses()
    {
        try
        {
            var businesses = await _context.Businesses
                .Where(b => b.Status == "Pending")
                .Include(b => b.Owner)
                .ToListAsync();
            
            Console.WriteLine($"Found {businesses.Count} pending businesses");
            return Ok(businesses);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching pending businesses: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpGet("my-businesses")]
    public async Task<IActionResult> GetMyBusinesses()
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            var businesses = await _context.Businesses
                .Where(b => b.OwnerId == userId)
                .ToListAsync();
            
            Console.WriteLine($"Found {businesses.Count} businesses for user {userId}");
            return Ok(businesses);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching user businesses: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateBusiness([FromBody] BusinessDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Creating business for user {userId}");
            Console.WriteLine($"Business data: {System.Text.Json.JsonSerializer.Serialize(dto)}");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Business name is required");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User not found: {userId}");
                return Unauthorized("User not found");
            }

            var business = new Business
            {
                Name = dto.Name,
                PhoneNumber = dto.PhoneNumber,
                LicenseNumber = dto.LicenseNumber,
                Address = dto.Address,
                OwnerId = userId,
                Status = "Pending"
            };

            _context.Businesses.Add(business);
            await _context.SaveChangesAsync();

            Console.WriteLine($"Business created successfully with ID: {business.Id}");

            // If user is a BusinessUser, link the business to them
            if (user is BusinessUser businessUser && businessUser.BusinessId == null)
            {
                businessUser.BusinessId = business.Id;
                await _userManager.UpdateAsync(businessUser);
                Console.WriteLine($"Linked business {business.Id} to BusinessUser {userId}");
            }

            return Ok(new
            {
                id = business.Id,
                name = business.Name,
                phoneNumber = business.PhoneNumber,
                licenseNumber = business.LicenseNumber,
                address = business.Address,
                status = business.Status,
                message = "Business created successfully and pending approval"
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating business: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBusiness(int id, [FromBody] BusinessDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Updating business {id} for user {userId}");

            var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
            if (business == null)
            {
                Console.WriteLine($"Business not found or user not authorized: {id}");
                return NotFound("Business not found or you don't have permission to update it");
            }

            business.Name = dto.Name ?? business.Name;
            business.PhoneNumber = dto.PhoneNumber;
            business.LicenseNumber = dto.LicenseNumber;
            business.Address = dto.Address;

            await _context.SaveChangesAsync();
            Console.WriteLine($"Business {id} updated successfully");

            return Ok(business);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error updating business: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBusiness(int id)
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Deleting business {id} for user {userId}");

            var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
            if (business == null)
            {
                Console.WriteLine($"Business not found or user not authorized: {id}");
                return NotFound("Business not found or you don't have permission to delete it");
            }

            _context.Businesses.Remove(business);
            await _context.SaveChangesAsync();
            Console.WriteLine($"Business {id} deleted successfully");

            return Ok(new { message = "Business deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting business: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPatch("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ApproveBusiness(int id)
    {
        try
        {
            Console.WriteLine($"Approving business {id}");

            var business = await _context.Businesses.FindAsync(id);
            if (business == null)
            {
                Console.WriteLine($"Business not found: {id}");
                return NotFound("Business not found");
            }

            business.Status = "Approved";
            await _context.SaveChangesAsync();
            Console.WriteLine($"Business {id} approved successfully");

            return Ok(new { message = "Business approved successfully", business });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error approving business: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPatch("{id}/deny")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DenyBusiness(int id)
    {
        try
        {
            Console.WriteLine($"Denying business {id}");

            var business = await _context.Businesses.FindAsync(id);
            if (business == null)
            {
                Console.WriteLine($"Business not found: {id}");
                return NotFound("Business not found");
            }

            business.Status = "Denied";
            await _context.SaveChangesAsync();
            Console.WriteLine($"Business {id} denied successfully");

            return Ok(new { message = "Business denied", business });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error denying business: {ex.Message}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}

public record BusinessDto(string? Name, string? PhoneNumber, string? LicenseNumber, string? Address);