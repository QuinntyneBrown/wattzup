using MediatR;

namespace Telo.Ride.Application.Live;

/// <summary>The service's time, from which the app measures its clock offset (L2-121 AC3).</summary>
public sealed record GetServerTimeQuery : IRequest<long>;

/// <summary>Answers with the service's time in Unix milliseconds, read through <see cref="TimeProvider"/>.</summary>
public sealed class GetServerTimeQueryHandler(TimeProvider time) : IRequestHandler<GetServerTimeQuery, long>
{
    public Task<long> Handle(GetServerTimeQuery request, CancellationToken cancellationToken) =>
        Task.FromResult(time.GetUtcNow().ToUnixTimeMilliseconds());
}
