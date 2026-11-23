namespace Telo.Ride.Application;

/// <summary>One field's failure: the field as the client names it, and the message for it.</summary>
public sealed record FieldError(string Field, string Message);

/// <summary>A request refused by its validators before its handler ran (code <c>validation_failed</c>).</summary>
public sealed class RequestValidationException(IReadOnlyList<FieldError> errors)
    : Exception("The request failed validation.")
{
    public IReadOnlyList<FieldError> Errors { get; } = errors;
}
