using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application.Classes;

namespace Telo.Ride.Api.Classes;

/// <summary>
/// The classes' group sessions (L2-083, L2-122). Unlike the catalogue they need a signed-in rider, since a session
/// lists the riders seated in it. Each action sends one MediatR request.
/// </summary>
[ApiController]
[Route("api/classes")]
public sealed class ClassSessionsController(ISender sender) : ControllerBase
{
    [HttpGet("sessions")]
    public Task<IReadOnlyList<NextGroupSessionDto>> Next(CancellationToken cancellationToken) =>
        sender.Send(new GetNextGroupSessionsQuery(), cancellationToken);

    [HttpGet("{id}/sessions")]
    public Task<IReadOnlyList<ClassSessionDto>> ForClass(string id, CancellationToken cancellationToken) =>
        sender.Send(new GetClassSessionsQuery(id), cancellationToken);
}
