using System.Text;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Primitives;

namespace Telo.Ride.Api.Tests;

/// <summary>
/// A web root held in memory, standing in for the app's build in <c>wwwroot</c>, so hosting tests read
/// no file (AGENTS.md). Each entry maps a path such as <c>index.html</c> to its text.
/// </summary>
public sealed class InMemoryWebRoot(IReadOnlyDictionary<string, string> files) : IFileProvider
{
    public IFileInfo GetFileInfo(string subpath) =>
        files.TryGetValue(subpath.TrimStart('/'), out var text)
            ? new File(Path.GetFileName(subpath), Encoding.UTF8.GetBytes(text))
            : new NotFoundFileInfo(subpath);

    public IDirectoryContents GetDirectoryContents(string subpath) => NotFoundDirectoryContents.Singleton;

    public IChangeToken Watch(string filter) => NullChangeToken.Singleton;

    private sealed class File(string name, byte[] bytes) : IFileInfo
    {
        public bool Exists => true;

        public bool IsDirectory => false;

        public DateTimeOffset LastModified { get; } = new(2026, 11, 21, 7, 0, 0, TimeSpan.Zero);

        public long Length => bytes.Length;

        public string Name => name;

        public string? PhysicalPath => null;

        public Stream CreateReadStream() => new MemoryStream(bytes, writable: false);
    }
}
