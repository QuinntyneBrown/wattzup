# Validate input and encode output

## Overview

Telo Ride takes text and numbers from three untrusted places: riders (display names, feedback
messages, ride submissions), the bike (its Bluetooth device name and notifications), and the
browser itself (error strings). Any of them may be malformed by accident or crafted on purpose.
This feature makes sure such input never reaches the database unchecked, never runs as code when
it is shown, and that errors never expose the backend's internals.

- **validation rule** — constraint on one field of a request or hub message: type, length, range
  or allowed values
- **ProblemDetails** — standard JSON error body (RFC 9457) that the API returns for every refused
  request, extended here with a `code` the Ride app branches on
- **untrusted text** — any string that came from a rider, a bike or Bluetooth, such as a display
  name, a feedback message, a device name or an error message
- **parameterised query** — database query whose input values travel as parameters, never joined
  into the query text

Validation sits in one place on the backend, the MediatR pipeline, so every controller action and
every hub method gets it, in line with the rule that a controller or hub method checks nothing
itself and sends one MediatR request. Encoding sits in one place on the frontend: Angular's text
bindings.

## Description

### Telo Ride API (backend)

- **Request validators** (`Telo.Ride.Application`) — one FluentValidation `AbstractValidator<T>`
  per command or query that carries input, each rule naming its field as the client sends it:
  - `SubmitRideCommandValidator` — the ride's facts (slice 10.1).
  - **`InputRules`** — the shapes the others share: a catalogue id (`hiit-cardio-30`,
    `vice-city`) is 1 to 64 lowercase letters, digits and hyphens; a session id is a catalogue id,
    `@` and its start (`hiit-cardio-30@20261122T0700Z`, `vice-city@20261122T070000Z`), at most 96
    characters; power is 0 to 2,000 W (`RidePlausibilityRule.MaxPowerWatts`); output and distance
    are finite and not negative.
  - `GetClassQueryValidator`, `GetClassSessionsQueryValidator`, `GetRaceQueueQueryValidator`,
    `MarkUnlockSeenCommandValidator`, `FindRaceCommandValidator` — the catalogue id.
  - `JoinClassSessionCommandValidator`, `JoinRaceCommandValidator`, `SetReadyCommandValidator`,
    `LeaveRaceCommandValidator` — the class id and the session id they carry.
  - `ReportProgressCommandValidator`, `ReportRaceProgressCommandValidator` — the session id, power,
    and output or distance.
  - The email, the sign-in code, the display name and the custom workout keep their domain rules
    and codes (`invalid_email`, `code_mismatch`, `display_name_invalid`, `plan_invalid`), which
    their screens already branch on. Feedback's validator arrives with slice 26.2.
- **`ValidationBehavior<TRequest, TResponse>`** — MediatR pipeline behaviour that runs every
  validator registered for the request before its handler. Any failure throws
  `RequestValidationException` holding the `FieldError` list; the handler does not run.
- **A body of the wrong type** — model binding's own refusal (a number sent as text, malformed
  JSON) is answered by `ApiBehaviorOptions.InvalidModelStateResponseFactory` in the same shape:
  400, code `validation_failed`, and `errors` keyed by the field as the client sends it
  (`elapsedSeconds`, not `$.elapsedSeconds`), with the framework's message replaced by "This field
  has the wrong type." so no .NET type name reaches the client.
- **`ProblemDetailsExceptionHandler`** (`Telo.Ride.Api`) — `IExceptionHandler` registered with
  `AddProblemDetails`. It maps `RequestValidationException` to 400 with `errors` keyed by field
  and `code` `validation_failed`, and maps domain refusals to their status and `code`. Any other
  exception becomes 500 with `code` `unexpected` and a `traceId`. Outside the Development
  environment, the developer exception page is off, and no response carries a stack trace, query
  text, table name or .NET type name.
- **`ValidationHubFilter`** — `IHubFilter` on `RideHub`. Hub methods send MediatR requests, so
  they pass through the same `ValidationBehavior`; the filter turns `RequestValidationException`
  into a `HubException` whose message is `validation_failed: ` and the fields it names, comma
  separated (`validation_failed: powerWatts`). SignalR already drops every other exception's
  detail: the client hears only that the call failed.
- **`AppDbContext`** (`Telo.Ride.Infrastructure`) — every query is LINQ, which EF Core sends as
  parameters. Raw SQL, where any is needed, uses `FromSql` with interpolation, which also
  produces parameters; `FromSqlRaw` with joined strings is not used.

### Ride app (frontend)

- **Text bindings** — every component renders untrusted text with interpolation (`{{ }}`) or a
  text property binding, which sets `textContent`. No template binds `[innerHTML]`, and no code
  calls a `DomSanitizer.bypassSecurityTrust*` method. Device names, display names and error
  strings are data, rendered as text. ESLint forbids both ways round that: `no-restricted-syntax`
  rejects any `bypassSecurityTrust*` call in TypeScript and any `[innerHTML]` or `[outerHTML]`
  binding in a template.
- **`toApiError`** (`api` library) — maps an `HttpErrorResponse` carrying ProblemDetails into
  `ApiError` (`status`, `code`, `fieldErrors`). The SignalR client does not map a hub validation
  refusal yet: the app sends only values it computed, and no screen branches on one (see Open
  questions).
- **Screens** (`ride` application) — branch on `ApiError.code`. Field errors mark the matching
  field `aria-invalid="true"`; any other refusal shows a generic message. The ProblemDetails
  `title` is never shown as markup.

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a
level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-129` | `L1-021` | A request or hub message with a field that breaks its rule (type, length, range, allowed values) shall be refused with 400 and a ProblemDetails body that names the field and carries a `code`. Text from a rider, a bike or Bluetooth (names, messages, device names, errors) shall be shown as text, and nothing in it shall run. Every query shall use parameters and shall never join input into the query text. No error shall carry a stack trace, query or internal name. |

## Diagrams

### System context

Riders send names, messages and ride data; the bike sends its device name and notifications. Both
are untrusted input to Telo Ride.

![C4 system context for validating input and encoding output](diagrams/c4-context.png)

### Containers

The Ride app renders untrusted text as text and branches on error codes; the Telo Ride API
validates every request and hub message and reaches the database with parameterised queries only.

![C4 container view for validating input and encoding output](diagrams/c4-container.png)

### Components

Controllers and `RideHub` send requests through `ValidationBehavior`, which runs the validators
and hands refusals to `ProblemDetailsExceptionHandler` or `ValidationHubFilter`. In the Ride app,
`toApiError` gives screens a typed error, and templates render text through bindings only.

![C4 component view for validating input and encoding output](diagrams/c4-component.png)

### Class structure

`ValidationBehavior` runs every `AbstractValidator` for the request and throws
`RequestValidationException`, which owns its `FieldError` entries. The exception handler writes
`TeloProblemDetails`, which the frontend's `toApiError` reads into an `ApiError`.

![Class diagram for validating input and encoding output](diagrams/class-structure.png)

### Behaviour — refuse an invalid request or hub message

A field outside its rule stops the request in the pipeline before the handler runs. A REST
request returns 400 ProblemDetails naming the field; a hub message returns a `HubException` with
the same code (`L2-129` AC1).

![Sequence diagram for refusing an invalid request or hub message](diagrams/sequence-refuse-an-invalid-request.png)

### Behaviour — show untrusted text as text

A device name containing markup reaches the template as a string, and interpolation shows its
characters literally (`L2-129` AC2).

![Sequence diagram for showing untrusted text as text](diagrams/sequence-show-untrusted-text.png)

### Behaviour — hide internals in an unexpected error

Queries carry their values as parameters (`L2-129` AC3). An unexpected failure returns 500 with a
code and trace id only (`L2-129` AC4).

![Sequence diagram for hiding internals in an unexpected error](diagrams/sequence-hide-an-unexpected-error.png)

## Open questions

1. **Validation on the hub, seen by the app (open, slice 22.2).** `ValidationHubFilter` refuses a
   hub message with `validation_failed: <fields>`, but the SignalR client still reads any failed
   call as the call failing. No screen needs more: every hub message carries what the app itself
   computed. A screen that does would add the mapping to `toApiError`.
2. **Domain rules keep their codes (resolved, slice 22.2).** The email, sign-in code, display name
   and custom workout are refused with their own codes, not `validation_failed`, because their
   screens branch on those codes (L2-001, L2-002, L2-005, L2-100). Their bodies name no field; the
   code names it.
