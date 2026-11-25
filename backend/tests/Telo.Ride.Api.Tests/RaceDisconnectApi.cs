using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Telo.Ride.Application.Races;

namespace Telo.Ride.Api.Tests;

/// <summary>A sign-in host that records when the server has handled a rider disconnect.</summary>
public abstract class RaceDisconnectApi : SignInApi
{
    /// <summary>The riders whose lost connection the server has handled, so a test moves the clock only after.</summary>
    public EventProbe<Guid> ConnectionsLost { get; } = new(rider => rider.ToString());

    protected override void ConfigureServices(IServiceCollection services)
    {
        base.ConfigureServices(services);
        services.AddSingleton<IPipelineBehavior<RaceConnectionLostCommand, Unit>>(new ConnectionLostProbe(ConnectionsLost));
    }

    /// <summary>Records each lost connection once its handler has run.</summary>
    private sealed class ConnectionLostProbe(EventProbe<Guid> probe) : IPipelineBehavior<RaceConnectionLostCommand, Unit>
    {
        public async Task<Unit> Handle(RaceConnectionLostCommand request, RequestHandlerDelegate<Unit> next, CancellationToken cancellationToken)
        {
            var handled = await next(cancellationToken);
            probe.Record(request.RiderId);
            return handled;
        }
    }
}
