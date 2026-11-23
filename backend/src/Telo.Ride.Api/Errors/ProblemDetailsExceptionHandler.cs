using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Telo.Ride.Application;
using Telo.Ride.Domain;

namespace Telo.Ride.Api.Errors;

/// <summary>
/// Turns every exception into ProblemDetails with a <c>code</c> (L2-147 AC3): invalid input is 400
/// <c>validation_failed</c> with <c>errors</c> by field, a domain rule its own status and code (429 with Retry-After in whole seconds), and
/// anything else 500 <c>unexpected</c> with a trace id and nothing of the exception.
/// </summary>
/// <remarks>
/// On .NET 10 an exception a handler handles is not logged by the framework, so this logs the
/// unexpected ones itself, with the route template only; refusals are expected and not logged.
/// </remarks>
internal sealed partial class ProblemDetailsExceptionHandler(IProblemDetailsService problemDetails, ILogger<ProblemDetailsExceptionHandler> logger)
    : IExceptionHandler
{
    [LoggerMessage(Level = LogLevel.Error, Message = "Unexpected failure on {Route}")]
    private partial void LogUnexpected(Exception exception, string? route);

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problem = exception switch
        {
            RequestValidationException invalid => Invalid(invalid),
            DomainRuleException refused => Problem(Status(refused.Kind), "This can't be done right now.", refused.Code),
            _ => Problem(StatusCodes.Status500InternalServerError, "Something went wrong.", "unexpected"),
        };
        if (problem.Status == StatusCodes.Status500InternalServerError)
        {
            LogUnexpected(exception, (httpContext.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText);
        }

        httpContext.Response.StatusCode = problem.Status!.Value;
        if (exception is DomainRuleException { RetryAfter: { } retryAfter })
        {
            httpContext.Response.Headers.RetryAfter = ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(System.Globalization.CultureInfo.InvariantCulture);
        }

        return await problemDetails.TryWriteAsync(new() { HttpContext = httpContext, ProblemDetails = problem, Exception = exception });
    }

    private static ValidationProblemDetails Invalid(RequestValidationException invalid)
    {
        var errors = invalid.Errors.GroupBy(error => error.Field).ToDictionary(group => group.Key, group => group.Select(error => error.Message).ToArray());
        return new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Check what you entered.",
            Extensions = { ["code"] = "validation_failed" },
        };
    }

    private static ProblemDetails Problem(int status, string title, string code) =>
        new() { Status = status, Title = title, Extensions = { ["code"] = code } };

    private static int Status(RuleKind kind) => kind switch
    {
        RuleKind.NotFound => StatusCodes.Status404NotFound,
        RuleKind.Conflict => StatusCodes.Status409Conflict,
        RuleKind.Forbidden => StatusCodes.Status403Forbidden,
        RuleKind.TooManyRequests => StatusCodes.Status429TooManyRequests,
        RuleKind.Unprocessable => StatusCodes.Status422UnprocessableEntity,
        _ => StatusCodes.Status400BadRequest,
    };
}
