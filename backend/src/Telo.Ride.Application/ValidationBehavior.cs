using FluentValidation;
using MediatR;

namespace Telo.Ride.Application;

/// <summary>
/// Runs every validator registered for a request before its handler; any failure throws
/// <see cref="RequestValidationException"/> and the handler does not run.
/// </summary>
public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var errors = new List<FieldError>();
        foreach (var validator in validators)
        {
            var result = await validator.ValidateAsync(request, cancellationToken);
            errors.AddRange(result.Errors.Select(failure => new FieldError(ClientName(failure.PropertyName), failure.ErrorMessage)));
        }

        return errors.Count == 0 ? await next(cancellationToken) : throw new RequestValidationException(errors);
    }

    // The client sends camelCase JSON, so a field is named as it sent it, at every level: PowerWatts → powerWatts,
    // Diagnostics.PacketLog → diagnostics.packetLog, Context[0].Value → context[0].value.
    private static string ClientName(string property) => string.Join('.', property.Split('.').Select(Camel));

    private static string Camel(string segment) =>
        segment.Length == 0 ? segment : string.Concat(char.ToLowerInvariant(segment[0]).ToString(), segment.AsSpan(1));
}
