namespace Wattzup.Api;

/// <summary>Settings bound from the <c>Wattzup</c> section (appsettings, WATTZUP__*, command line). The README documents each.</summary>
public sealed class WattzupOptions
{
    public const string SectionName = "Wattzup";

    /// <summary>Where Kestrel listens. Loopback only by default (L2-034).</summary>
    public string Urls { get; set; } = "http://127.0.0.1:8787";

    /// <summary><c>bike</c> or <c>treadmill</c>: the machine to connect to at start-up (L2-062). Default <c>bike</c>.</summary>
    public string? Machine { get; set; }

    /// <summary><see cref="Machine"/> as the state's machine; anything but <c>treadmill</c> is the bike.</summary>
    public Wattzup.Core.State.Machine ParsedMachine =>
        string.Equals(Machine?.Trim(), "treadmill", StringComparison.OrdinalIgnoreCase) ? Wattzup.Core.State.Machine.Treadmill : Wattzup.Core.State.Machine.Bike;
}

/// <summary><c>Wattzup:Ble</c> (L2-001 to L2-004).</summary>
public sealed class ConnectivityOptions
{
    public const string SectionName = "Wattzup:Ble";

    /// <summary><c>Simulated</c>, <c>CoreBluetooth</c>, <c>BlueZ</c> or <c>WinRT</c>; empty picks by operating system.</summary>
    public string? Transport { get; set; }

    public TimeSpan ScanTimeout { get; set; } = TimeSpan.FromSeconds(20);

    public TimeSpan InitCommandSpacing { get; set; } = TimeSpan.FromMilliseconds(300);

    public TimeSpan KeepaliveInterval { get; set; } = TimeSpan.FromSeconds(1);

    public TimeSpan ErrorBackoff { get; set; } = TimeSpan.FromSeconds(3);
}

/// <summary><c>Wattzup:Bike</c>.</summary>
public sealed class BikeOptions
{
    public const string SectionName = "Wattzup:Bike";

    /// <summary>Shown as <c>device_label</c> once a device is selected; empty uses the advertised name.</summary>
    public string? DisplayName { get; set; }
}

/// <summary><c>Wattzup:Treadmill</c>.</summary>
public sealed class TreadmillOptions
{
    public const string SectionName = "Wattzup:Treadmill";

    public const string DefaultDisplayName = "Echelon Stride";

    /// <summary>Shown as <c>device_label</c> once the treadmill is selected; empty uses the advertised name.</summary>
    public string? DisplayName { get; set; } = DefaultDisplayName;

    /// <summary>Turns treadmill support on; off by default until the Stride answers over Bluetooth (L2-075, ADR 0011).</summary>
    public bool Enabled { get; set; }
}

/// <summary>The class catalogue file (L2-077, ADR 0014): <c>Wattzup:Classes:Path</c>, relative to the content root.</summary>
public sealed class ClassesOptions
{
    public const string SectionName = "Wattzup:Classes";

    public string Path { get; set; } = "classes.json";
}
