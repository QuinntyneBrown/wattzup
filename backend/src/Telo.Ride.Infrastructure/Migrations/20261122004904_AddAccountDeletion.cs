using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Telo.Ride.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountDeletion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Riders_Email",
                table: "Riders");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Riders",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(320)",
                oldMaxLength: 320);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DeletionRequestedAt",
                table: "Riders",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Riders_Email",
                table: "Riders",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Riders_Email",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "DeletionRequestedAt",
                table: "Riders");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Riders",
                type: "nvarchar(320)",
                maxLength: 320,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(320)",
                oldMaxLength: 320,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Riders_Email",
                table: "Riders",
                column: "Email",
                unique: true);
        }
    }
}
