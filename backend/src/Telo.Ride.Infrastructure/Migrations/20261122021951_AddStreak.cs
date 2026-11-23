using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStreak : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "LastRideDay",
                table: "Riders",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StreakDays",
                table: "Riders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TimeZoneId",
                table: "Riders",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastRideDay",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "StreakDays",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "TimeZoneId",
                table: "Riders");
        }
    }
}
