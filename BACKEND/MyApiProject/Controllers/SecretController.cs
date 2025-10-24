using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class SecretController : ControllerBase
{
    [HttpGet("admin-data")]
    [Authorize(Roles = "Admin")]
    public IActionResult AdminData() => Ok("only admins see this");

    [HttpGet("business-or-submanager")]
    [Authorize(Roles = "Business,SubManager")] // change roles to match your seeded names if different
    public IActionResult BusinessOrSubManager() => Ok("business and sub-managers see this");
}