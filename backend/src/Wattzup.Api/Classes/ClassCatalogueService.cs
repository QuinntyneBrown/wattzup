using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Primitives;
using Wattzup.Core.Classes;

namespace Wattzup.Api.Classes;

/// <summary>
/// Loads the class catalogue file named by <see cref="ClassesOptions"/> into the <see cref="ClassCatalogueStore"/>
/// and reloads it after each save (L2-077). A missing or unusable file leaves the current catalogue in place (empty at
/// start-up) and the backend runs as usual. A save is read again <see cref="Debounce"/> after the last change, so an
/// editor that saves in several writes is read once, within the 2 s of criterion 7.
/// </summary>
public sealed partial class ClassCatalogueService(
    ClassCatalogueStore store,
    IOptions<ClassesOptions> options,
    IHostEnvironment environment,
    TimeProvider time,
    ILogger<ClassCatalogueService> logger) : IHostedService, IDisposable
{
    public static readonly TimeSpan Debounce = TimeSpan.FromMilliseconds(500);

    private readonly Lock _gate = new();
    private PhysicalFileProvider? _provider;
    private IDisposable? _watch;
    private ITimer? _debounce;

    /// <summary>The catalogue file's full path: the setting, resolved against the content root when relative.</summary>
    public string FilePath { get; } = Path.GetFullPath(Path.Combine(environment.ContentRootPath, options.Value.Path));

    /// <summary>Raised when a change to the file has been noticed and its reload is scheduled.</summary>
    public event EventHandler? ChangeNoticed;

    public Task StartAsync(CancellationToken cancellationToken)
    {
        Load();
        Watch();
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        Dispose();
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        // Disposed outside the lock: disposing the watcher waits for its callback thread, which may be waiting for
        // the lock in OnChanged.
        IDisposable? watch, debounce, provider;
        lock (_gate)
        {
            (watch, debounce, provider) = (_watch, _debounce, _provider);
            (_watch, _debounce, _provider) = (null, null, null);
        }

        watch?.Dispose();
        debounce?.Dispose();
        provider?.Dispose();
    }

    /// <summary>Reads the file; replaces the catalogue on success and keeps the current one when the file is unusable.</summary>
    public void Load()
    {
        CatalogueLoadResult result;
        try
        {
            using var file = File.OpenRead(FilePath);
            result = ClassCatalogueReader.Read(file, file.Length);
        }
        catch (Exception e) when (e is IOException or UnauthorizedAccessException)
        {
            result = new CatalogueLoadResult(null, [], e is FileNotFoundException or DirectoryNotFoundException ? "the file is missing" : "the file cannot be read");
        }

        if (result.Catalogue is null)
        {
            LogFileError(FilePath, result.FileError ?? "unknown");
            return;
        }

        foreach (var problem in result.Problems)
        {
            LogEntryLeftOut(problem.Entry, problem.Field, problem.Message);
        }

        store.Replace(result.Catalogue);
        LogLoaded(result.Catalogue.Classes.Count, result.Catalogue.Shelves.Count, FilePath);
    }

    private void Watch()
    {
        var directory = Path.GetDirectoryName(FilePath);
        if (directory is null || !Directory.Exists(directory))
        {
            return;
        }

        var name = Path.GetFileName(FilePath);
        lock (_gate)
        {
            _provider = new PhysicalFileProvider(directory);
            var provider = _provider;
            _watch = ChangeToken.OnChange(() => provider.Watch(name), OnChanged);
        }
    }

    private void OnChanged()
    {
        lock (_gate)
        {
            if (_provider is null)
            {
                return;
            }

            _debounce ??= time.CreateTimer(_ => Load(), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
            _debounce.Change(Debounce, Timeout.InfiniteTimeSpan);
        }

        ChangeNoticed?.Invoke(this, EventArgs.Empty);
    }

    [LoggerMessage(Level = LogLevel.Error, Message = "Couldn't read the class catalogue {Path}: {Reason}")]
    private partial void LogFileError(string path, string reason);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Class catalogue: left out {Entry} ({Field}): {Reason}")]
    private partial void LogEntryLeftOut(string entry, string field, string reason);

    [LoggerMessage(Level = LogLevel.Information, Message = "Class catalogue: {Classes} classes on {Shelves} shelves from {Path}")]
    private partial void LogLoaded(int classes, int shelves, string path);
}
