# Vytvori zastupce "Kasa" POUZE na plose (zadny autostart).
# Zastupce nastartuje server (pokud nebezi) a otevre Chrome kiosk na 2. monitoru.
$ErrorActionPreference = 'Stop'

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$ps = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$kiosk = Join-Path $PSScriptRoot 'kiosk.ps1'
$root = Split-Path $PSScriptRoot -Parent   # koren projektu (o slozku vyse)
$icon = Join-Path $root 'logos\logo.ico'   # vlastni ikona kasy
$ws = New-Object -ComObject WScript.Shell

$startup = [Environment]::GetFolderPath('Startup')
$desktop = [Environment]::GetFolderPath('Desktop')

# ODSTRANIT vsechny autostart zastupce - kasa uz se NEMA spoustet sama
foreach ($old in @('Kasa.lnk', 'TiniCash Kiosk.lnk', 'TiniCash Kasa.lnk')) {
  $p = Join-Path $startup $old
  if (Test-Path $p) { Remove-Item $p -Force; Write-Host "  odstranen autostart: $p" }
}
# uklid starsich nazvu na plose
foreach ($old in @('TiniCash Kiosk.lnk', 'TiniCash Kasa.lnk')) {
  $p = Join-Path $desktop $old
  if (Test-Path $p) { Remove-Item $p -Force }
}

# vytvorit zastupce JEN na plose
$path = Join-Path $desktop 'Kasa.lnk'
$lnk = $ws.CreateShortcut($path)
$lnk.TargetPath = $ps
$lnk.Arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$kiosk`""
$lnk.WorkingDirectory = $root
if (Test-Path $icon) { $lnk.IconLocation = "$icon,0" }
elseif ($chrome) { $lnk.IconLocation = "$chrome,0" }
$lnk.Description = "TiniCash kasa (kiosk, 2. monitor)"
$lnk.Save()

Write-Host "Zastupce 'Kasa' vytvoren na plose: $path" -ForegroundColor Green
Write-Host "Autostart je vypnuty - kasa se spusti jen pres tuto ikonu." -ForegroundColor Yellow
