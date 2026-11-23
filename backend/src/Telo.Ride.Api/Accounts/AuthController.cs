using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Api.Authentication;
using Telo.Ride.Application.Accounts;

namespace Telo.Ride.Api.Accounts;

/// <summary>What the sign-in screen sends: the email address as typed.</summary>
public sealed record SendCodeRequest(string? Email);

/// <summary>What the code screen sends: the email the code went to and the six digits.</summary>
public sealed record ConfirmCodeRequest(string? Email, string? Code);

/// <summary>
/// Sign-in with an email code. Anonymous on purpose: a visitor asks for a code before they have a session. Each action
/// sends one MediatR request; the answer is the same whether or not the address has an account (L2-001 AC4).
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("code")]
    public async Task<IActionResult> SendCode(SendCodeRequest request, CancellationToken cancellationToken)
    {
        await sender.Send(new SendSignInCodeCommand(request.Email, HttpContext.Connection.RemoteIpAddress?.ToString()), cancellationToken);
        return Accepted();
    }

    /// <summary>Confirms the code and signs the rider in with a session cookie (L2-002 AC2, L2-004).</summary>
    [HttpPost("code/confirm")]
    public async Task<ConfirmedRider> ConfirmCode(ConfirmCodeRequest request, CancellationToken cancellationToken)
    {
        var rider = await sender.Send(new ConfirmSignInCodeCommand(request.Email, request.Code), cancellationToken);
        await HttpContext.SignInAsync(
            RiderSessionTicketStore.Principal(rider.RiderId), new AuthenticationProperties { IsPersistent = true });
        return rider;
    }

    /// <summary>
    /// Signs this device out (L2-006 AC1): cookie authentication hands the cookie's key to the session store, which ends
    /// the session at once, and clears the cookie. Without a session there is nothing to end, and it still answers 204.
    /// </summary>
    [HttpPost("sign-out")]
    public async Task<IActionResult> SignOutOfThisDevice()
    {
        await HttpContext.SignOutAsync();
        return NoContent();
    }
}
