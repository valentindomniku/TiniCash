# Spusti kasu RUCNE (pres ikonu):
#  1) nastartuje Node server (pokud jeste nebezi),
#  2) otevre Chrome v kiosk modu na DRUHEM monitoru (kdyz neni, tak na primarnim).
Add-Type -AssemblyName System.Windows.Forms

$root = Split-Path $PSScriptRoot -Parent   # server.js je o slozku vyse (koren projektu)

function Test-Server {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $c.Connect('127.0.0.1', 3000)
    $c.Close()
    return $true
  } catch {
    return $false
  }
}

# 1) SERVER: pokud na portu 3000 nic nebezi, spust "node server.js" skryte
if (-not (Test-Server)) {
  $node = (Get-Command node -ErrorAction SilentlyContinue).Source
  if (-not $node) {
    $node = @(
      "$env:ProgramFiles\nodejs\node.exe",
      "${env:ProgramFiles(x86)}\nodejs\node.exe",
      "$env:LocalAppData\Programs\nodejs\node.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
  }
  if ($node) {
    Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden
    # pockej az server nabehne (max ~20 s)
    for ($i = 0; $i -lt 40; $i++) {
      Start-Sleep -Milliseconds 500
      if (Test-Server) { break }
    }
  }
}

# 2) CHROME kiosk
$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { exit 1 }

# druhy monitor = prvni nepriarni; jinak primarni
$screens = [System.Windows.Forms.Screen]::AllScreens
$mon = $screens | Where-Object { -not $_.Primary } | Select-Object -First 1
if (-not $mon) { $mon = $screens[0] }
$x = $mon.Bounds.X
$y = $mon.Bounds.Y

# vlastni profil, aby kiosk nekolidoval s beznym Chrome a otevrel se jako samostatne okno
$kioskProfile = Join-Path $env:LocalAppData 'TiniCashKiosk'

Start-Process -FilePath $chrome -ArgumentList @(
  '--kiosk',
  '--no-first-run',
  '--disable-session-crashed-bubble',
  "--user-data-dir=$kioskProfile",
  "--window-position=$x,$y",
  'http://127.0.0.1:3000'
)
