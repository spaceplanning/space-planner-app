param(
  [string]$OutputDir = "dist/installer"
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$distDir = Join-Path $projectRoot $OutputDir
$zipPath = Join-Path $distDir 'SpacePlanning_App_Installer.zip'
$installerPath = Join-Path $distDir 'install.ps1'
$packageRoot = Join-Path $distDir 'package-content'
$publicSource = Join-Path $projectRoot 'dist/public'
$serverSource = Join-Path $projectRoot 'dist/index.js'

if (-not (Test-Path (Join-Path $publicSource 'index.html'))) {
  throw "Built client files were not found at $publicSource. Run pnpm run build first."
}

if (-not (Test-Path $serverSource)) {
  throw "Built server file was not found at $serverSource. Run pnpm run build first."
}

$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
  throw 'node.exe was not found on the build machine. Install Node.js on this machine before creating the installer.'
}

New-Item -ItemType Directory -Force -Path $distDir | Out-Null
if (Test-Path $packageRoot) { Remove-Item $packageRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $packageRoot | Out-Null

Copy-Item -Path $publicSource -Destination (Join-Path $packageRoot 'public') -Recurse -Force
Copy-Item -Path $serverSource -Destination (Join-Path $packageRoot 'index.js') -Force
Copy-Item -Path $nodeCommand.Source -Destination (Join-Path $packageRoot 'node.exe') -Force

@'
@echo off
setlocal
cd /d "%~dp0"
if not exist "%~dp0node.exe" (
  echo Bundled node.exe was not found.
  pause
  exit /b 1
)
if not exist "%~dp0index.js" (
  echo Space Planner Studio server file was not found.
  pause
  exit /b 1
)
set NODE_ENV=production
"%~dp0node.exe" "%~dp0index.js"
'@ | Set-Content -Path (Join-Path $packageRoot 'start-app.cmd') -Encoding ASCII

@'
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:NODE_ENV = 'production'
$node = Join-Path $PSScriptRoot 'node.exe'
$server = Join-Path $PSScriptRoot 'index.js'

if (-not (Test-Path $node)) {
  throw "Bundled node.exe was not found at $node"
}

if (-not (Test-Path $server)) {
  throw "Space Planner Studio server file was not found at $server"
}

& $node $server
'@ | Set-Content -Path (Join-Path $packageRoot 'start-app.ps1') -Encoding UTF8

@'
Space Planner Studio

This folder contains a dependency-free Windows runtime build.

Start the app with start-app.cmd or start-app.ps1. The launcher uses the bundled node.exe and does not require Node.js, npm, pnpm, or a build step on this computer.

The downloadable installer starts in local/offline mode by default. Plans and custom furniture are stored in this Windows user's browser storage for the local app URL.
'@ | Set-Content -Path (Join-Path $packageRoot 'README-INSTALLED.txt') -Encoding UTF8

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -Force

@'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'

$archive = Join-Path $PSScriptRoot 'SpacePlanning_App_Installer.zip'
$defaultInstallPath = Join-Path $HOME 'SpacePlanning_App'

if (-not (Test-Path $archive)) {
  throw "Installer archive not found at $archive"
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'SpacePlanning_App Installer'
$form.Size = New-Object System.Drawing.Size(700, 520)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false

$intro = New-Object System.Windows.Forms.Label
$intro.Text = 'Choose an installation folder and accept the standard hold-harmless acknowledgment before installing.'
$intro.AutoSize = $false
$intro.Width = 640
$intro.Height = 40
$intro.Location = New-Object System.Drawing.Point(18, 18)
$intro.Font = New-Object System.Drawing.Font('Segoe UI', 10)
$form.Controls.Add($intro)

$pathLabel = New-Object System.Windows.Forms.Label
$pathLabel.Text = 'Install location:'
$pathLabel.Location = New-Object System.Drawing.Point(18, 70)
$pathLabel.AutoSize = $true
$form.Controls.Add($pathLabel)

$pathBox = New-Object System.Windows.Forms.TextBox
$pathBox.Location = New-Object System.Drawing.Point(18, 96)
$pathBox.Size = New-Object System.Drawing.Size(520, 24)
$pathBox.Text = $defaultInstallPath
$form.Controls.Add($pathBox)

$browseBtn = New-Object System.Windows.Forms.Button
$browseBtn.Text = 'Browse...'
$browseBtn.Location = New-Object System.Drawing.Point(548, 94)
$browseBtn.Size = New-Object System.Drawing.Size(110, 30)
$browseBtn.Add_Click({
  $browser = New-Object System.Windows.Forms.FolderBrowserDialog
  $browser.Description = 'Select the folder where SpacePlanning_App should be installed.'
  $browser.SelectedPath = $pathBox.Text
  if ($browser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    $pathBox.Text = $browser.SelectedPath
  }
})
$form.Controls.Add($browseBtn)

$agreementLabel = New-Object System.Windows.Forms.Label
$agreementLabel.Text = 'Hold harmless agreement:'
$agreementLabel.Location = New-Object System.Drawing.Point(18, 140)
$agreementLabel.AutoSize = $true
$form.Controls.Add($agreementLabel)

$agreementText = @"
By installing this software, you acknowledge that it is provided as-is for evaluation and operational use. You agree that the provider is not liable for data loss, interruption, incompatibility, third-party service issues, or any incidental, consequential, or special damages arising from use of the application. You assume all responsibility for reviewing the installed files, security settings, and any downstream deployment decisions. This acknowledgment does not replace professional legal review where required by your organization.
"@

$agreementBox = New-Object System.Windows.Forms.TextBox
$agreementBox.Multiline = $true
$agreementBox.ReadOnly = $true
$agreementBox.ScrollBars = 'Vertical'
$agreementBox.Location = New-Object System.Drawing.Point(18, 166)
$agreementBox.Size = New-Object System.Drawing.Size(640, 180)
$agreementBox.Text = $agreementText
$form.Controls.Add($agreementBox)

$agreeBox = New-Object System.Windows.Forms.CheckBox
$agreeBox.Text = 'I have read and agree to the hold harmless terms above.'
$agreeBox.Location = New-Object System.Drawing.Point(18, 356)
$agreeBox.AutoSize = $true
$form.Controls.Add($agreeBox)

$osStatus = New-Object System.Windows.Forms.Label
$osStatus.Text = 'Checking operating system...'
$osStatus.Location = New-Object System.Drawing.Point(18, 438)
$osStatus.AutoSize = $true
$osStatus.ForeColor = [System.Drawing.Color]::DarkSlateBlue
$form.Controls.Add($osStatus)

$installBtn = New-Object System.Windows.Forms.Button
$installBtn.Text = 'Install'
$installBtn.Location = New-Object System.Drawing.Point(420, 392)
$installBtn.Size = New-Object System.Drawing.Size(110, 35)
$installBtn.Add_Click({
  $target = $pathBox.Text.Trim()

  if ([string]::IsNullOrWhiteSpace($target)) {
    [System.Windows.Forms.MessageBox]::Show('Please choose an installation folder.', 'Installation folder required', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    return
  }

  if (-not $agreeBox.Checked) {
    [System.Windows.Forms.MessageBox]::Show('You must accept the hold harmless agreement to continue.', 'Agreement required', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Warning)
    return
  }

  try {
    $os = Get-CimInstance Win32_OperatingSystem
    $caption = $os.Caption
    $version = $os.Version
    $arch = $os.OSArchitecture
    $osStatus.Text = "Detected: $caption ($version, $arch)"

    if ($caption -notmatch 'Windows') {
      throw 'This installer is designed for Windows hosts only.'
    }

    if ([Version]$version -lt [Version]'10.0') {
      throw 'This application requires Windows 10 or newer.'
    }

    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Expand-Archive -Path $archive -DestinationPath $target -Force

    $startCmd = Join-Path $target 'start-app.cmd'
    $startPs1 = Join-Path $target 'start-app.ps1'
    $nodePath = Join-Path $target 'node.exe'
    $serverPath = Join-Path $target 'index.js'
    $indexHtml = Join-Path $target 'public/index.html'

    if (-not (Test-Path $startCmd) -or -not (Test-Path $startPs1) -or -not (Test-Path $nodePath) -or -not (Test-Path $serverPath) -or -not (Test-Path $indexHtml)) {
      throw 'The installed application files are incomplete.'
    }

    Start-Process -FilePath 'powershell.exe' -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startPs1 -WorkingDirectory $target -WindowStyle Hidden

    [System.Windows.Forms.MessageBox]::Show("Installation complete. The app was installed to $target and started. Use start-app.cmd in that folder to restart it later.", 'Installation complete', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
    $form.Close()
  }
  catch {
    [System.Windows.Forms.MessageBox]::Show("Installation failed: $($_.Exception.Message)", 'Installation error', [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
  }
})
$form.Controls.Add($installBtn)

$cancelBtn = New-Object System.Windows.Forms.Button
$cancelBtn.Text = 'Cancel'
$cancelBtn.Location = New-Object System.Drawing.Point(548, 392)
$cancelBtn.Size = New-Object System.Drawing.Size(110, 35)
$cancelBtn.Add_Click({ $form.Close() })
$form.Controls.Add($cancelBtn)

$form.ShowDialog() | Out-Null
'@ | Set-Content -Path $installerPath -Encoding UTF8

Write-Host "Created installer archive: $zipPath"
Write-Host "Created installer launcher: $installerPath"
