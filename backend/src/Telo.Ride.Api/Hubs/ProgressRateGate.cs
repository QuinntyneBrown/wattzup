namespace Telo.Ride.Api.Hubs;

/// <summary>What the gate says to one progress message: handle it, drop it, or disconnect the client.</summary>
internal enum GateDecision
{
    Admit,
    Drop,
    Disconnect,
}

/// <summary>
/// One hub connection's progress messages, class and race alike (L2-130 AC2). Two are admitted in each second, counted
/// from the first message of the second; the third and later are dropped. A client that has been over the limit for
/// 10 seconds, with no second at or under it in between, is disconnected.
/// </summary>
internal sealed class ProgressRateGate(TimeProvider time)
{
    public const int PerSecond = 2;

    private static readonly TimeSpan Second = TimeSpan.FromSeconds(1);
    private static readonly TimeSpan Patience = TimeSpan.FromSeconds(10);

    private DateTimeOffset? secondStart;
    private int count;
    private bool secondOver;
    private DateTimeOffset? overSince;

    public GateDecision Admit()
    {
        var now = time.GetUtcNow();
        if (secondStart is not { } start || now - start >= Second)
        {
            // A second at or under the limit, or a whole second without messages, ends a stretch over it.
            if (!secondOver || secondStart is not { } last || now - last >= 2 * Second) overSince = null;
            secondStart = now;
            count = 0;
            secondOver = false;
        }

        count++;
        if (count <= PerSecond) return GateDecision.Admit;

        secondOver = true;
        overSince ??= now;
        return now - overSince >= Patience ? GateDecision.Disconnect : GateDecision.Drop;
    }
}
