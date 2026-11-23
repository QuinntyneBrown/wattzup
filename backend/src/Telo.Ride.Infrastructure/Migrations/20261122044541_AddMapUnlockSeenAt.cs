using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMapUnlockSeenAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "UnlockSeenAt",
                table: "MapProgress",
                type: "datetimeoffset",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnlockSeenAt",
                table: "MapProgress");
        }
    }
}
