using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRidersAndSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedAttempts",
                table: "SignInCodes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UsedAt",
                table: "SignInCodes",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Riders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    DisplayName = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Riders", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RiderSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    KeyHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    LastUsedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EndedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiderSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiderSessions_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Riders_Email",
                table: "Riders",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiderSessions_KeyHash",
                table: "RiderSessions",
                column: "KeyHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RiderSessions_RiderId",
                table: "RiderSessions",
                column: "RiderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RiderSessions");

            migrationBuilder.DropTable(
                name: "Riders");

            migrationBuilder.DropColumn(
                name: "FailedAttempts",
                table: "SignInCodes");

            migrationBuilder.DropColumn(
                name: "UsedAt",
                table: "SignInCodes");
        }
    }
}
