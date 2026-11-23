using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSignInCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SignInCodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(320)", maxLength: 320, nullable: false),
                    CodeHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    NetworkHash = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    IssuedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    SupersededAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SignInCodes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SignInCodes_Email_IssuedAt",
                table: "SignInCodes",
                columns: new[] { "Email", "IssuedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SignInCodes_NetworkHash_IssuedAt",
                table: "SignInCodes",
                columns: new[] { "NetworkHash", "IssuedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SignInCodes");
        }
    }
}
