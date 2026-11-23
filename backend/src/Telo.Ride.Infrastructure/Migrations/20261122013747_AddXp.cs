using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddXp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "OnTargetShare",
                table: "Rides",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "TotalXp",
                table: "Rides",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "XpLines",
                table: "Rides",
                type: "nvarchar(max)",
                nullable: false,
                // Rides recorded before XP have no lines: an empty JSON array, which reads back as none.
                defaultValue: "[]");

            migrationBuilder.AddColumn<int>(
                name: "TotalXp",
                table: "Riders",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnTargetShare",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "TotalXp",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "XpLines",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "TotalXp",
                table: "Riders");
        }
    }
}
