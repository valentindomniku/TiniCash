param(
  [Parameter(Mandatory=$true)][string]$Target,   # jmeno tiskarny NEBO port (napr. USB001)
  [Parameter(Mandatory=$true)][string]$Data       # raw bajty v base64
)
$ErrorActionPreference = 'Stop'

# najdi tiskarnu podle jmena; kdyz neni, zkus podle portu (USB001 / USB001:)
$p = Get-Printer | Where-Object { $_.Name -eq $Target } | Select-Object -First 1
if (-not $p) {
  $p = Get-Printer | Where-Object { $_.PortName -eq $Target -or $_.PortName -eq ($Target + ':') } | Select-Object -First 1
}
if (-not $p) { throw "Tiskarna '$Target' nenalezena (ani jako jmeno, ani jako port)." }

$cs = @'
using System;
using System.Runtime.InteropServices;
public static class RawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
  public struct DOCINFO {
    [MarshalAs(UnmanagedType.LPWStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPWStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPWStr)] public string pDataType;
  }
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool OpenPrinter(string src, out IntPtr h, IntPtr def);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool ClosePrinter(IntPtr h);
  [DllImport("winspool.drv", CharSet=CharSet.Unicode, SetLastError=true)] static extern bool StartDocPrinter(IntPtr h, int level, ref DOCINFO di);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool EndDocPrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool StartPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool EndPagePrinter(IntPtr h);
  [DllImport("winspool.drv", SetLastError=true)] static extern bool WritePrinter(IntPtr h, byte[] buf, int count, out int written);
  public static void Send(string printer, byte[] bytes) {
    IntPtr h;
    if (!OpenPrinter(printer, out h, IntPtr.Zero)) throw new Exception("OpenPrinter selhal: " + Marshal.GetLastWin32Error());
    try {
      DOCINFO di = new DOCINFO(); di.pDocName = "TiniCash"; di.pDataType = "RAW";
      if (!StartDocPrinter(h, 1, ref di)) throw new Exception("StartDocPrinter selhal: " + Marshal.GetLastWin32Error());
      StartPagePrinter(h);
      int written; WritePrinter(h, bytes, bytes.Length, out written);
      EndPagePrinter(h); EndDocPrinter(h);
    } finally { ClosePrinter(h); }
  }
}
'@
Add-Type -TypeDefinition $cs -Language CSharp
[RawPrinter]::Send($p.Name, [Convert]::FromBase64String($Data))
