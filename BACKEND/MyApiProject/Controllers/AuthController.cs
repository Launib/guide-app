using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MyApiProject.Models;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _config;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration config)
    {
        _userManager = userManager;
        _config = config;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Email and password are required.");

        if (await _userManager.FindByEmailAsync(dto.Email) != null)
            return Conflict("Email already in use.");

        var user = new ApplicationUser
        {
            UserName = string.IsNullOrWhiteSpace(dto.UserName) ? dto.Email : dto.UserName,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Street = dto.Street,
            Apt = dto.Apt,
            ZipCode = dto.ZipCode,
            State = dto.State,
            City = dto.City,
            AccountType = dto.AccountType,
            DepartmentName = dto.DepartmentName,
            BusinessName = dto.BusinessName,
            BusinessLicense = dto.BusinessLicense,
            BusinessCity = dto.BusinessCity,
            BusinessState = dto.BusinessState,
            BusinessZip = dto.BusinessZip,
            GovernmentId = dto.GovernmentId,
            CityName = dto.CityName,
            UserCity = dto.UserCity,
            UserStreet = dto.UserStreet,
            UserZip = dto.UserZip,
            UserState = dto.UserState,
            UserApt = dto.UserApt
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        // assign a role if provided, otherwise default to RegularUser
        var role = string.IsNullOrWhiteSpace(dto.AccountType) ? "RegularUser" : dto.AccountType;
        await _userManager.AddToRoleAsync(user, role);

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

        return Ok(new
        {
            token = written,
            user = new
            {
                id = user.Id,
                email = user.Email,
                userName = user.UserName,
                firstName = user.FirstName,
                lastName = user.LastName,
                roles = roles
            }
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
        // var expireMinutes = int.TryParse(_config["Jwt:ExpireMinutes"], out var m) ? m : 60;

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            // expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: creds
        );

        // return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), expires = token.ValidTo });
        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
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
        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            userName = user.UserName,
            firstName = user.FirstName,
            lastName = user.LastName,
            street = user.Street,
            apt = user.Apt,
            zipCode = user.ZipCode,
            state = user.State,
            city = user.City,
            accountType = user.AccountType,
            departmentName = user.DepartmentName,
            businessName = user.BusinessName,
            businessLicense = user.BusinessLicense,
            businessCity = user.BusinessCity,
            businessState = user.BusinessState,
            businessZip = user.BusinessZip,
            governmentId = user.GovernmentId,
            cityName = user.CityName,
            userCity = user.UserCity,
            userStreet = user.UserStreet,
            userZip = user.UserZip,
            userState = user.UserState,
            userApt = user.UserApt,
            roles = roles
        });
    }
}

public record LoginDto(string Email, string Password);

public record RegisterDto(
    string Email,
    string Password,
    string? UserName,
    string? FirstName,
    string? LastName,
    string? Street,
    string? Apt,
    string? ZipCode,
    string? State,
    string? City,
    string? AccountType,
    string? DepartmentName,
    string? BusinessName,
    string? BusinessLicense,
    string? BusinessCity,
    string? BusinessState,
    string? BusinessZip,
    string? GovernmentId,
    string? CityName,
    string? UserCity,
    string? UserStreet,
    string? UserZip,
    string? UserState,
    string? UserApt
);