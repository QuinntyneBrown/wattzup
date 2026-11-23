using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMapProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BestSeconds",
                table: "Rides",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsNewBest",
                table: "Rides",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PreviousBestSeconds",
                table: "Rides",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StarsEarned",
                table: "Rides",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StarsHeld",
                table: "Rides",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "MapProgress",
                columns: table => new
                {
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MapId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Stars = table.Column<int>(type: "int", nullable: false),
                    BestSeconds = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapProgress", x => new { x.RiderId, x.MapId });
                    table.ForeignKey(
                        name: "FK_MapProgress_Riders_RiderId",
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
                name: "MapProgress");

            migrationBuilder.DropColumn(
                name: "BestSeconds",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "IsNewBest",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "PreviousBestSeconds",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "StarsEarned",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "StarsHeld",
                table: "Rides");
        }
    }
}
