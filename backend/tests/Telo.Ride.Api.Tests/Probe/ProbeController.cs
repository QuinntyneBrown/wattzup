using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Domain;

namespace Telo.Ride.Api.Tests.Probe;

/// <summary>
/// A test-only controller written as every Telo Ride controller is: no <c>[AllowAnonymous]</c>,
/// and each action sends one MediatR request and checks nothing itself (L2-147 AC2). It gives the
/// acceptance tests endpoints before any feature adds its own: one that answers, one whose input
/// is validated, one a domain rule refuses and one that fails unexpectedly.
/// </summary>
[ApiController]
[Route("probe")]
public sealed class ProbeController(ISender sender) : ControllerBase
{
    [HttpGet("echo")]
    public Task<string> Echo([FromQuery] string text, CancellationToken cancellationToken) =>
        sender.Send(new EchoQuery(text), cancellationToken);

    [HttpPost("echo")]
    public Task<string> Echo(EchoCommand command, CancellationToken cancellationToken) =>
        sender.Send(command, cancellationToken);

    [HttpGet("refuse")]
    public Task<string> Refuse(CancellationToken cancellationToken) => sender.Send(new RefusedQuery(), cancellationToken);

    [HttpGet("fail")]
    public Task<string> Fail(CancellationToken cancellationToken) => sender.Send(new FailingQuery(), cancellationToken);
}

public sealed record EchoQuery(string Text) : IRequest<string>;

public sealed class EchoQueryHandler : IRequestHandler<EchoQuery, string>
{
    public Task<string> Handle(EchoQuery request, CancellationToken cancellationToken) => Task.FromResult(request.Text);
}

public sealed record EchoCommand(string PowerWatts) : IRequest<string>;

public sealed class EchoCommandValidator : AbstractValidator<EchoCommand>
{
    public EchoCommandValidator() => RuleFor(command => command.PowerWatts).NotEmpty().MaximumLength(4);
}

public sealed class EchoCommandHandler : IRequestHandler<EchoCommand, string>
{
    public Task<string> Handle(EchoCommand request, CancellationToken cancellationToken) => Task.FromResult(request.PowerWatts);
}

public sealed record RefusedQuery : IRequest<string>;

public sealed class RefusedQueryHandler : IRequestHandler<RefusedQuery, string>
{
    public Task<string> Handle(RefusedQuery request, CancellationToken cancellationToken) =>
        throw new DomainRuleException("session_full", RuleKind.Conflict, "The session has no seat left.");
}

public sealed record FailingQuery : IRequest<string>;

public sealed class FailingQueryHandler : IRequestHandler<FailingQuery, string>
{
    public const string Secret = "rider@example.com in table Riders";

    public Task<string> Handle(FailingQuery request, CancellationToken cancellationToken) =>
        throw new InvalidOperationException(Secret);
}
