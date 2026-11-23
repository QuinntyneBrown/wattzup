using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SessionId",
                table: "Rides",
                type: "nvarchar(96)",
                maxLength: 96,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SessionResults",
                columns: table => new
                {
                    SessionId = table.Column<string>(type: "nvarchar(96)", maxLength: 96, nullable: false),
                    MapId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    EndedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionResults", x => x.SessionId);
                });

            migrationBuilder.CreateTable(
                name: "SessionResultEntries",
                columns: table => new
                {
                    Seat = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<string>(type: "nvarchar(96)", nullable: false),
                    Place = table.Column<int>(type: "int", nullable: false),
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    TimeSeconds = table.Column<int>(type: "int", nullable: true),
                    OutputKj = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(16)", maxLength: 16, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionResultEntries", x => new { x.SessionId, x.Seat });
                    table.ForeignKey(
                        name: "FK_SessionResultEntries_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_SessionResultEntries_SessionResults_SessionId",
                        column: x => x.SessionId,
                        principalTable: "SessionResults",
                        principalColumn: "SessionId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionResultEntries_RiderId",
                table: "SessionResultEntries",
                column: "RiderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessionResultEntries");

            migrationBuilder.DropTable(
                name: "SessionResults");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "Rides");
        }
    }
}
