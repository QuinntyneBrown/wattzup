using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace Telo.Ride.Api.Errors;

/// <summary>
/// Model binding's own refusal, a body of the wrong type or not JSON at all, in the API's shape (L2-129 AC1, AC4): 400,
/// code <c>validation_failed</c> and <c>errors</c> keyed by the field as the app sends it (<c>elapsedSeconds</c>, not
/// <c>$.elapsedSeconds</c>). The framework's messages name .NET types, so each field gets a message of its own.
/// </summary>
internal static class InvalidBodyResponse
{
    public static IMvcBuilder AnswerInvalidBodies(this IMvcBuilder mvc) =>
        mvc.ConfigureApiBehaviorOptions(options => options.InvalidModelStateResponseFactory = context =>
        {
            var parameters = context.ActionDescriptor.Parameters.Select(parameter => parameter.Name).ToHashSet();
            var fields = context.ModelState.Where(entry => entry.Value?.Errors.Count > 0).Select(entry => entry.Key).ToList();
            // The bound parameter itself ("request") fails only because a field in it did; name the field instead.
            var named = fields.Where(key => !parameters.Contains(key)).ToList();
            var errors = new ModelStateDictionary();
            foreach (var field in (named.Count > 0 ? named : fields).Select(Field).Distinct())
            {
                errors.AddModelError(field, field == Body ? "The body is not valid JSON." : "This field has the wrong type.");
            }

            // The factory gives it the type, trace id and counting every other refusal has.
            var problem = context.HttpContext.RequestServices.GetRequiredService<ProblemDetailsFactory>().CreateValidationProblemDetails(
                context.HttpContext, errors, StatusCodes.Status400BadRequest, "Check what you entered.");
            problem.Extensions["code"] = "validation_failed";
            return new BadRequestObjectResult(problem) { ContentTypes = { "application/problem+json" } };
        });

    private const string Body = "body";

    /// <summary>A JSON path as the app names the field: <c>$.elapsedSeconds</c> → <c>elapsedSeconds</c>; the body → <c>body</c>.</summary>
    private static string Field(string key)
    {
        var field = key.StartsWith("$.", StringComparison.Ordinal) ? key[2..] : key.TrimStart('$');
        return field.Length == 0 ? Body : field;
    }
}
