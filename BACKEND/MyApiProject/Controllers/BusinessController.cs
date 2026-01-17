using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    public BusinessController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("myBusiness")]
    public async Task<IActionResult> GetMyBusinesses()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var businesses = await _context.Businesses.Where(b => b.OwnerId == userId).ToListAsync();
        return Ok(businesses);
    }

    [HttpPost]
    public async Task<IActionResult> CreateBusiness([FromBody] BusinessDto dto)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var business = new Business
        {
            Name = dto.Name,
            PhoneNumber = dto.PhoneNumber,
            LicenseNumber = dto.LicenseNumber,
            Address = dto.Address,
            OwnerId = userId
        };
        _context.Businesses.Add(business);
        await _context.SaveChangesAsync();
        return Ok(business);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBusiness(int id, [FromBody] BusinessDto dto)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
        if (business == null) return NotFound();

        business.Name = dto.Name;
        business.PhoneNumber = dto.PhoneNumber;
        business.LicenseNumber = dto.LicenseNumber;
        business.Address = dto.Address;
        await _context.SaveChangesAsync();
        return Ok(business);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteBusiness(int id)
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var business = await _context.Businesses.FirstOrDefaultAsync(b => b.Id == id && b.OwnerId == userId);
        if (business == null) return NotFound();

        _context.Businesses.Remove(business);
        await _context.SaveChangesAsync();
        return Ok();
    }
}

public record BusinessDto(string Name, string? PhoneNumber, string? LicenseNumber, string? Address);