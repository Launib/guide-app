using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using MyApiProject.Models;

namespace MyApiProject.Data
{
    public class ApplicationDbContext: IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // Add DbSet<T> for your domain models here
    }

}

namespace MyApiProject.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Username { get; set; }

        // Address
        public string? Street { get; set; }
        public string? Apt { get; set; }
        public string? ZipCode { get; set; }
        public string? State { get; set; }
        public string? City { get; set; }

        // Account type or role key; you can use enum string keys like "RegularUser","Admin",...
        public string? AccountType { get; set; }
        public string? DepartmentName { get; set; }
        public string? BusinessName { get; set; }
        public string? BusinessLicense { get; set; }
        public string? BusinessCity { get; set; }
        public string? BusinessState { get; set; }
        public string? BusinessZip { get; set; }
        public string? GovernmentId { get; set; }
        public string? CityName { get; set; }
        public string? UserCity { get; set; }
        public string? UserStreet { get; set; }
        public string? UserZip { get; set; }
        public string? UserState { get; set; }
        public string? UserApt { get; set; }
    }
}
