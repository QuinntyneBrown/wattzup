using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace Telo.Ride.Application;

public static class DependencyInjection
{
    /// <summary>
    /// MediatR with every handler in this assembly, its validators, and <see cref="ValidationBehavior{TRequest, TResponse}"/>
    /// around every handler: one request per controller action or hub method (L2-147 AC2).
    /// </summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(configuration =>
        {
            configuration.RegisterServicesFromAssemblyContaining<IAppDbContext>();
            configuration.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssemblyContaining<IAppDbContext>();
        return services;
    }
}
