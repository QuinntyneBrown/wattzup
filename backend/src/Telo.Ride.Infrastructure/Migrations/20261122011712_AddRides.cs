using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Rides",
                columns: table => new
                {
                    RiderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Kind = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false),
                    MapId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    Mode = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: true),
                    Pack = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: true),
                    Place = table.Column<int>(type: "int", nullable: true),
                    FieldSize = table.Column<int>(type: "int", nullable: true),
                    ClassId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    ElapsedSeconds = table.Column<int>(type: "int", nullable: false),
                    DistanceMeters = table.Column<double>(type: "float", nullable: false),
                    OutputKj = table.Column<double>(type: "float", nullable: false),
                    MaxPowerWatts = table.Column<int>(type: "int", nullable: false),
                    MaxSpeedKmh = table.Column<double>(type: "float", nullable: false),
                    FinishedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    TimeZoneId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    RecordedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Rides", x => new { x.RiderId, x.Id });
                    table.ForeignKey(
                        name: "FK_Rides_Riders_RiderId",
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
                name: "Rides");
        }
    }
}
