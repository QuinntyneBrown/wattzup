namespace Telo.Ride.Api.Tests;

/// <summary>
/// Collects events as they arrive (a hub message, a finished span) and lets a test await one with
/// a timeout. On timeout it fails naming every event that did arrive. No test sleeps (AGENTS.md).
/// </summary>
public sealed class EventProbe<T>(Func<T, string> describe)
{
    private readonly List<T> arrived = [];
    private readonly Lock gate = new();
    private TaskCompletionSource signal = new(TaskCreationOptions.RunContinuationsAsynchronously);

    /// <summary>Records one event; call it from the event's own thread.</summary>
    public void Record(T item)
    {
        lock (gate)
        {
            arrived.Add(item);
            signal.TrySetResult();
            signal = new(TaskCreationOptions.RunContinuationsAsynchronously);
        }
    }

    /// <summary>The first event matching <paramref name="match"/>, arrived or arriving within <paramref name="timeout"/>.</summary>
    public async Task<T> Await(Func<T, bool> match, TimeSpan timeout)
    {
        using var deadline = new CancellationTokenSource(timeout);
        while (true)
        {
            Task next;
            lock (gate)
            {
                foreach (var item in arrived)
                {
                    if (match(item))
                    {
                        return item;
                    }
                }

                next = signal.Task;
            }

            try
            {
                await next.WaitAsync(deadline.Token);
            }
            catch (OperationCanceledException)
            {
                string seen;
                lock (gate)
                {
                    seen = string.Join(", ", arrived.Select(describe));
                }

                throw new TimeoutException($"No matching event within {timeout}; events that arrived: [{seen}]");
            }
        }
    }
}
