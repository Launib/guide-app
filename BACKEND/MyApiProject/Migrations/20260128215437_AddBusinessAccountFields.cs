using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyApiProject.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessAccountFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessPasswordHash",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BusinessUsername",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "HasAccount",
                table: "Businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessPasswordHash",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BusinessUsername",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "HasAccount",
                table: "Businesses");
        }
    }
}
