# 0031. Sign-in codes are emailed over SMTP with MailKit

- **Status:** Accepted
- **Date:** 2026-11-21
- **Follows:** [0025](0025-thin-dotnet-backend.md)

## Context

Signing in with an email code (L2-001 to L2-003) needs the backend to deliver one short email. The
design *sign in with an email code* left the provider, the sender address and the message as
`<TO SUPPLY>`. No provider has been chosen, and none is to be provisioned from this repository.
.NET's own `System.Net.Mail.SmtpClient` is marked by Microsoft as not recommended for new
development, and points to MailKit.

## Decision

The backend sends email over SMTP with MailKit, behind the `IEmailSender` port in
`Telo.Ride.Application`. The adapter, `SmtpEmailSender`, reads `Email:From` and
`Email:Smtp:Host`, `Port`, `Username` and `Password` (docs/deployment.md), so any provider with an
SMTP relay (Azure Communication Services Email, SendGrid, Amazon SES, a company relay) can be used
without a code change. The message is plain text: the code in the subject and the body, how long it
works, and what to do if it was not asked for.

In Development the settings point at a local catcher on `localhost:1025` (Mailpit or smtp4dev),
so a developer reads the code there. Tests replace `IEmailSender` with a fake mailbox and never
send.

## Consequences

- No vendor SDK, and the provider can change through settings.
- A send that fails throws, and the rider is told the code could not be sent (L2-001 AC5); the
  code is already saved, so the 30-second gap still applies to the next request.
- Each send opens one SMTP connection. That is enough for sign-in's volume (at most 5 codes an hour
  per address); a queue can come later if delivery becomes slow.
- The code and the address are never logged (L2-132): the adapter writes nothing to the log.
