using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using MyApiProject.Models;
using MyApiProject.Enums;using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyApiProject.Data
{
    public class ApplicationDbContext: IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<AdminUser> AdminUsers { get; set; }
        public DbSet<SubManagerUser> SubManagerUsers { get; set; }
        public DbSet<RegularUser> RegularUsers { get; set; }
        public DbSet<CityAdminUser> CityAdminUsers { get; set; }
        public DbSet<BusinessUser> BusinessUsers { get; set; }
        public DbSet<Business> Businesses { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure TPT inheritance
            builder.Entity<AdminUser>().ToTable("AdminUsers");
            builder.Entity<SubManagerUser>().ToTable("SubManagerUsers");
            builder.Entity<RegularUser>().ToTable("RegularUsers");
            builder.Entity<CityAdminUser>().ToTable("CityAdminUsers");
            builder.Entity<BusinessUser>().ToTable("BusinessUsers");

            // Configure relationships
            builder.Entity<Business>()
                .HasOne(b => b.Owner)
                .WithMany() // Owner can have multiple businesses
                .HasForeignKey(b => b.OwnerId);

            builder.Entity<Business>()
                .HasOne(b => b.SubManager)
                .WithOne(s => s.Business)
                .HasForeignKey<Business>(b => b.SubManagerId);

            builder.Entity<BusinessUser>()
                .HasOne(bu => bu.Business)
                .WithOne()
                .HasForeignKey<BusinessUser>(bu => bu.BusinessId);
        }
    }

}

namespace MyApiProject.Models
{
    public class ApplicationUser : IdentityUser
    {
        public string? UserFullName { get; set; }
        public string? Username { get; set; }
        public string? Location {get; set;}
        public string? Address { get; set; }
        public string? AccountType { get; set; }
        public string? UserEmail {get; set;} 
        public string? UserPhoneNumber {get; set;}
        public byte[]? ProfilePicture { get; set; } // For storing photo as binary data
        // Alternatively, use: public string? ProfilePictureUrl { get; set; } // For storing photo URL or file path
    }

    // Role-specific user models
    public class AdminUser : ApplicationUser
    {
        
        public string? DepartmentName { get; set; }
        public DateTime? AdminSince { get; set; }
    }

    public class SubManagerUser : ApplicationUser
    {
        public int? BusinessId { get; set; }
        public Business? Business { get; set; }
    }

    public class RegularUser : ApplicationUser
    {
        public DateTime? MemberSince { get; set; }
        public bool? IsActive { get; set; }
    }

    public class CityAdminUser : ApplicationUser
    {
        public string? CityName { get; set; }
        public string? CityPosition { get; set; }
    }

    public class BusinessUser : ApplicationUser
    {
        public int? BusinessId { get; set; }
        public Business? Business { get; set; }
        public ICollection<SubManagerUser>? SubManagers { get; set; }
    }

    // Separate Business model
    public class Business
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? LicenseNumber { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? OwnerId { get; set; } // Reference to ApplicationUser Id
        public ApplicationUser? Owner { get; set; }
        public string? SubManagerId { get; set; } // Reference to SubManagerUser Id
        public SubManagerUser? SubManager { get; set; }
        public byte[]? BusinessProfilePicture { get; set; }
        public string? Status { get; set; } = "Pending"; // Pending, Approved, Denied
    }
}
