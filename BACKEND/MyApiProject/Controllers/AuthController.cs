using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MyApiProject.Models;
using MyApiProject.Data;
using Microsoft.EntityFrameworkCore;
using System;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;
    private readonly ApplicationDbContext _context;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config, ApplicationDbContext context)
    {
        _userManager = userManager;
        _config = config;
        _context = context;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserEmail) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Email and password are required.");

        if (await _userManager.FindByEmailAsync(dto.UserEmail) != null)
            return Conflict("Email already in use.");

        ApplicationUser user;
        if (dto.AccountType == "Admin")
        {
            user = new AdminUser
            {
                DepartmentName = dto.DepartmentName
            };
        }
        else if (dto.AccountType == "SubManager")
        {
            user = new SubManagerUser
            {
                // BusinessId can be set later
            };
        }
        else if (dto.AccountType == "Business")
        {
            user = new BusinessUser
            {
            };
        }
        else if (dto.AccountType == "CityAdmin")
        {
            user = new CityAdminUser
            {
                CityName = dto.CityName
            };
        }
        else
        {
            user = new RegularUser
            {
            };
        }

        // Set common properties
        user.Username = string.IsNullOrWhiteSpace(dto.Username) ? dto.UserEmail : dto.Username;
        user.UserEmail = dto.UserEmail;
        user.UserFullName = dto.UserFullName;
        user.Location = dto.Location;
        user.UserPhoneNumber = dto.UserPhoneNumber;
        user.ProfilePicture = dto.ProfilePicture;
        user.AccountType = dto.AccountType;

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // Assign role
        var role = string.IsNullOrWhiteSpace(dto.AccountType) ? "RegularUser" : dto.AccountType;
        await _userManager.AddToRoleAsync(user, role);

        // If Business account type, create a business
        Business? createdBusiness = null;
        if (dto.AccountType == "Business" && !string.IsNullOrEmpty(dto.BusinessName))
        {
            var business = new Business
            {
                Name = dto.BusinessName,
                PhoneNumber = dto.BusinessPhoneNumber,
                LicenseNumber = dto.BusinessLicense,
                Address = $"{dto.BusinessCity}, {dto.BusinessState} {dto.BusinessZip}",
                OwnerId = user.Id
            };
            _context.Businesses.Add(business);
            await _context.SaveChangesAsync();
            if (user is BusinessUser businessUser)
            {
                businessUser.BusinessId = business.Id;
                await _userManager.UpdateAsync(user);
            }
            createdBusiness = business;
        }

        // Generate token
        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? ""));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            signingCredentials: creds
        );

        var written = new JwtSecurityTokenHandler().WriteToken(token);

        var userResponse = await GetUserResponse(user, roles);

        // Override or add specific fields if needed
        if (createdBusiness != null)
        {
            userResponse["business"] = new
            {
                id = createdBusiness.Id,
                name = createdBusiness.Name,
                PhoneNumber = createdBusiness.PhoneNumber,
                licenseNumber = createdBusiness.LicenseNumber,
                address = createdBusiness.Address,
                profilePicture = createdBusiness.BusinessProfilePicture
            };
        }

        return Ok(new
        {
            token = written,
            user = userResponse
        });
    }

    [HttpPost("token")]
    [AllowAnonymous]
    public async Task<IActionResult> Token([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null) return Unauthorized();

        if (!await _userManager.CheckPasswordAsync(user, dto.Password)) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty)
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? ""));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            signingCredentials: creds
        );

        var written = new JwtSecurityTokenHandler().WriteToken(token);

        // Get user response data
        var userResponse = await GetUserResponse(user, roles);

        return Ok(new
        {
            token = written,
            user = userResponse
        });
    }

    private async Task<Dictionary<string, object>> GetUserResponse(ApplicationUser user, IList<string> roles)
    {
        var response = new Dictionary<string, object>
        {
            { "id", user.Id },
            { "roles", roles }
        };
        
        if (!string.IsNullOrEmpty(user.Username)) response["username"] = user.Username;
        if (!string.IsNullOrEmpty(user.UserEmail)) response["userEmail"] = user.UserEmail;
        if (!string.IsNullOrEmpty(user.UserFullName)) response["fullName"] = user.UserFullName;
        if (!string.IsNullOrEmpty(user.Location)) response["location"] = user.Location;
        if (!string.IsNullOrEmpty(user.AccountType)) response["accountType"] = user.AccountType;
        if (!string.IsNullOrEmpty(user.UserPhoneNumber)) response["phoneNumber"] = user.UserPhoneNumber;
        if (user.ProfilePicture != null && user.ProfilePicture.Length > 0) response["profilePicture"] = Convert.ToBase64String(user.ProfilePicture);

        // Add role-specific data
        if (roles.Contains("Admin"))
        {
            var admin = await _context.AdminUsers.FindAsync(user.Id);
            if (admin != null && !string.IsNullOrEmpty(admin.DepartmentName))
                response["departmentName"] = admin.DepartmentName;
        }
        if (roles.Contains("CityAdmin"))
        {
            var cityAdmin = await _context.CityAdminUsers.FindAsync(user.Id);
            if (cityAdmin != null && !string.IsNullOrEmpty(cityAdmin.CityName))
                response["cityName"] = cityAdmin.CityName;
        }
        if (roles.Contains("Business"))
        {
            var businessUser = await _context.BusinessUsers.Include(bu => bu.Business).FirstOrDefaultAsync(bu => bu.Id == user.Id);
            if (businessUser?.Business != null)
            {
                response["business"] = new
                {
                    id = businessUser.Business.Id,
                    name = businessUser.Business.Name,
                    phoneNumber = businessUser.Business.PhoneNumber,
                    licenseNumber = businessUser.Business.LicenseNumber,
                    address = businessUser.Business.Address,
                    profilePicture = businessUser.Business.BusinessProfilePicture
                };
            }
        }
        if (roles.Contains("SubManager"))
        {
            var subManager = await _context.SubManagerUsers.Include(s => s.Business).FirstOrDefaultAsync(s => s.Id == user.Id);
            if (subManager?.Business != null)
            {
                response["business"] = new
                {
                    id = subManager.Business.Id,
                    name = subManager.Business.Name,
                    PhoneNumber = subManager.Business.PhoneNumber,
                    licenseNumber = subManager.Business.LicenseNumber,
                    address = subManager.Business.Address
                };
            }
        }

        return response;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);
        var response = await GetUserResponse(user, roles);

        return Ok(response);
    }
}

public record LoginDto(string Email, string Password);

public record RegisterDto(
    string UserEmail,
    string Password,
    string? Username,
    string? UserFullName,
    string? UserPhoneNumber,
    byte[]? ProfilePicture,
    string? Location,
    string? BusinessPhoneNumber,
    string? AccountType,
    string? DepartmentName,
    string? BusinessName,
    string? BusinessLicense,
    string? BusinessCity,
    string? BusinessState,
    string? BusinessZip,
    string? GovernmentId,
    string? CityName
);