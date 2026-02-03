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
        try
        {
            if (string.IsNullOrWhiteSpace(dto.UserEmail) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest("Email and password are required.");

            // Check for duplicate email
            if (await _userManager.FindByEmailAsync(dto.UserEmail) != null)
                return Conflict("Email already in use.");

            // Check for duplicate username
            var username = string.IsNullOrWhiteSpace(dto.Username) ? dto.UserEmail : dto.Username;
            if (await _userManager.FindByNameAsync(username) != null)
                return Conflict("Username already in use.");

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
        user.Email = dto.UserEmail; // Important: Set both Email and UserEmail
        user.UserName = user.Username; // Important: Set UserName for Identity
        user.UserFullName = dto.UserFullName;
        user.Location = dto.Location;
        user.Address = dto.Address; // Ensure Address is saved
        user.UserPhoneNumber = dto.UserPhoneNumber;
        user.ProfilePicture = dto.ProfilePicture;
        user.AccountType = dto.AccountType;

        Console.WriteLine($"Creating user with email: {dto.UserEmail}, username: {user.Username}, location: {dto.Location}, accountType: {dto.AccountType}");

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
        {
            Console.WriteLine($"User creation failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            return BadRequest(result.Errors);
        }

        Console.WriteLine("User created successfully, assigning role...");

        // Assign role
        var role = string.IsNullOrWhiteSpace(dto.AccountType) ? "RegularUser" : dto.AccountType;
        Console.WriteLine($"Assigning role: {role}");
        var roleResult = await _userManager.AddToRoleAsync(user, role);
        if (!roleResult.Succeeded)
        {
            Console.WriteLine($"Role assignment failed: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
            return BadRequest($"Role assignment failed: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
        }
        Console.WriteLine("Role assigned successfully");

        // If Business account type, create a business
        Business? createdBusiness = null;
        if (dto.AccountType == "Business" && !string.IsNullOrEmpty(dto.BusinessName))
        {
            var business = new Business
            {
                Name = dto.BusinessName,
                PhoneNumber = dto.BusinessPhoneNumber,
                LicenseNumber = dto.BusinessLicense,
                Address = dto.BusinessAddress,
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
            expires: DateTime.UtcNow.AddDays(7),
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
        catch (Exception ex)
        {
            Console.WriteLine($"Registration error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return BadRequest($"Registration failed: {ex.Message}");
        }
    }

    [HttpPost("token")]
    [AllowAnonymous]
    public async Task<IActionResult> Token([FromBody] LoginDto dto)
    {
        Console.WriteLine($"Login attempt with identifier: {dto.Email}");

        // Try to find user by username first, then by email for backwards compatibility
        var user = await _userManager.FindByNameAsync(dto.Email);

        if (user == null)
        {
            Console.WriteLine($"User not found by username '{dto.Email}', trying email lookup");
            user = await _userManager.FindByEmailAsync(dto.Email);
        }
        else
        {
            Console.WriteLine($"User found by username: {user.Id}, UserName: {user.UserName}");
        }

        if (user == null)
        {
            Console.WriteLine($"User not found by username or email: {dto.Email}");
            return Unauthorized();
        }

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
            expires: DateTime.UtcNow.AddDays(7),
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
            { "roles", roles },
            { "username", user.Username ?? "" },
            { "userEmail", user.UserEmail ?? "" },
            { "fullName", user.UserFullName ?? "" },
            { "location", user.Location ?? "" },
            { "address", user.Address ?? "" },
            { "accountType", user.AccountType ?? "" },
            { "phoneNumber", user.UserPhoneNumber ?? "" }
        };

        if (user.ProfilePicture != null && user.ProfilePicture.Length > 0)
            response["profilePicture"] = Convert.ToBase64String(user.ProfilePicture);

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
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) 
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Fetching user data for ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) 
            {
                Console.WriteLine($"User not found for ID: {userId}");
                return Unauthorized("User not found");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var response = await GetUserResponse(user, roles);

            Console.WriteLine($"Returning user data: {System.Text.Json.JsonSerializer.Serialize(response)}");

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Me endpoint: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPatch("me")]
    [Authorize]
    public async Task<IActionResult> UpdateUser([FromBody] UpdateUserDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) 
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Updating user ID: {userId}");
            Console.WriteLine($"Update data: {System.Text.Json.JsonSerializer.Serialize(dto)}");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) 
            {
                Console.WriteLine($"User not found for ID: {userId}");
                return Unauthorized("User not found");
            }

            // Update fields - allow empty strings to clear fields
            if (dto.Username != null)
            {
                user.Username = dto.Username;
                user.UserName = dto.Username;
            }
            
            if (dto.UserEmail != null)
            {
                user.UserEmail = dto.UserEmail;
                user.Email = dto.UserEmail;
            }
            
            if (dto.UserFullName != null) 
                user.UserFullName = dto.UserFullName;
            
            if (dto.Location != null) 
                user.Location = dto.Location;
            
            if (dto.Address != null) 
                user.Address = dto.Address;
            
            if (dto.UserPhoneNumber != null) 
                user.UserPhoneNumber = dto.UserPhoneNumber;
            
            if (!string.IsNullOrEmpty(dto.ProfilePictureBase64))
            {
                try
                {
                    user.ProfilePicture = Convert.FromBase64String(dto.ProfilePictureBase64);
                    Console.WriteLine($"Profile picture updated, size: {user.ProfilePicture.Length} bytes");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error converting profile picture: {ex.Message}");
                    return BadRequest("Invalid profile picture format");
                }
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                Console.WriteLine($"Update failed: {string.Join(", ", updateResult.Errors.Select(e => e.Description))}");
                return BadRequest(updateResult.Errors);
            }

            Console.WriteLine("User updated successfully");

            var roles = await _userManager.GetRolesAsync(user);
            var response = await GetUserResponse(user, roles);

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in UpdateUser endpoint: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Changing password for user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User not found for ID: {userId}");
                return Unauthorized("User not found");
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (!result.Succeeded)
            {
                Console.WriteLine($"Password change failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return BadRequest(result.Errors.Select(e => e.Description));
            }

            Console.WriteLine("Password changed successfully");
            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in ChangePassword endpoint: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteAccount()
    {
        try
        {
            var userId = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                Console.WriteLine("No user ID found in token");
                return Unauthorized("Invalid token");
            }

            Console.WriteLine($"Deleting account for user ID: {userId}");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                Console.WriteLine($"User not found for ID: {userId}");
                return Unauthorized("User not found");
            }

            // If user is a business owner, delete their businesses
            if (user is BusinessUser businessUser)
            {
                var businesses = await _context.Businesses.Where(b => b.OwnerId == userId).ToListAsync();
                _context.Businesses.RemoveRange(businesses);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Deleted {businesses.Count} businesses for user {userId}");
            }

            // Delete the user
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                Console.WriteLine($"Account deletion failed: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                return BadRequest(result.Errors);
            }

            Console.WriteLine("Account deleted successfully");
            return Ok(new { message = "Account deleted successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DeleteAccount endpoint: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("business-login")]
    [AllowAnonymous]
    public async Task<IActionResult> BusinessLogin([FromBody] BusinessLoginDto dto)
    {
        try
        {
            Console.WriteLine($"Business login attempt for username: {dto.Username}");

            // Debug: Check what users exist in the database
            var allUsers = await _context.Users.Select(u => new { u.UserName, u.NormalizedUserName, u.Id }).ToListAsync();
            Console.WriteLine($"All users in database: {string.Join(", ", allUsers.Select(u => $"{u.UserName} (Normalized: {u.NormalizedUserName}, ID: {u.Id})"))}");

            // Find BusinessUser by username
            var businessUser = await _userManager.FindByNameAsync(dto.Username);
            if (businessUser == null)
            {
                Console.WriteLine($"BusinessUser not found with username: {dto.Username}");
                Console.WriteLine($"Normalized search term would be: {dto.Username.ToUpperInvariant()}");
                return Unauthorized("Invalid credentials");
            }

            // Check if this is actually a BusinessUser
            if (businessUser is not BusinessUser)
            {
                Console.WriteLine($"User {dto.Username} is not a BusinessUser");
                return Unauthorized("Invalid credentials");
            }

            // Verify password using UserManager
            var passwordValid = await _userManager.CheckPasswordAsync(businessUser, dto.Password);
            if (!passwordValid)
            {
                Console.WriteLine($"Invalid password for business username: {dto.Username}");
                return Unauthorized("Invalid credentials");
            }

            Console.WriteLine($"Password verified for BusinessUser {businessUser.Id}");

            // Get the associated business to verify it's approved
            var business = await _context.Businesses
                .FirstOrDefaultAsync(b => b.BusinessUsername == dto.Username);

            if (business != null && business.Status != "Approved")
            {
                Console.WriteLine($"Business {business.Id} is not approved. Status: {business.Status}");
                return Unauthorized("Business is not approved");
            }

            // Generate token and return
            var roles = await _userManager.GetRolesAsync(businessUser);
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, businessUser.Id),
                new Claim(ClaimTypes.Name, businessUser.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Email, businessUser.Email ?? string.Empty)
            };
            claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? ""));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );

            var written = new JwtSecurityTokenHandler().WriteToken(token);
            var userResponse = await GetUserResponse(businessUser, roles);

            Console.WriteLine($"Business login successful for {dto.Username}, returning token");

            return Ok(new
            {
                token = written,
                user = userResponse
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in BusinessLogin endpoint: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
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
    string? Address,
    string? BusinessPhoneNumber,
    string? AccountType,
    string? DepartmentName,
    string? BusinessName,
    string? BusinessLicense,
    string? BusinessAddress,
    string? BusinessCity,
    string? BusinessState,
    string? BusinessZip,
    string? GovernmentId,
    string? CityName
);

public record UpdateUserDto(
    string? Username,
    string? UserEmail,
    string? UserFullName,
    string? Location,
    string? Address,
    string? UserPhoneNumber,
    string? ProfilePictureBase64
);

public record CreateBusinessRequestDto(
    string Name,
    string? PhoneNumber,
    string? LicenseNumber,
    string? Address
);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);

public record BusinessLoginDto(string Username, string Password);