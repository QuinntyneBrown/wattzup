using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application.Classes;

namespace Telo.Ride.Api.Classes;

/// <summary>
/// The class catalogue, read-only and public (ADR 0028): the rider browses and starts a solo class before signing in,
/// and the catalogue holds nothing personal. Each action sends one MediatR request.
/// </summary>
[ApiController]
[AllowAnonymous]
[Route("api/classes")]
public sealed class ClassesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public Task<ClassCatalogueDto> List(CancellationToken cancellationToken) =>
        sender.Send(new GetClassesQuery(), cancellationToken);

    [HttpGet("{id}")]
    public Task<ClassDto> Get(string id, CancellationToken cancellationToken) =>
        sender.Send(new GetClassQuery(id), cancellationToken);
}
