using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CustomWorkouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomWorkouts",
                columns: table => new
                {
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Settings = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    SavedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomWorkouts", x => x.RiderId);
                    table.ForeignKey(
                        name: "FK_CustomWorkouts_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomWorkouts");
        }
    }
}
