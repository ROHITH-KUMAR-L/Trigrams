[CmdletBinding()]
param(
    [switch]$SkipTrain,
    [switch]$SkipFrontendInstall
)

$ErrorActionPreference = "Stop"

# ------------------ ENV DETECTION ------------------
$repoRoot = Split-Path -Path $MyInvocation.MyCommand.Path -Parent
$IsWindows = $PSVersionTable.OS -like '*Windows*'

# ------------------ HELPERS ------------------
function Get-MakeCommand {
    foreach ($candidate in @('make', 'mingw32-make', 'nmake')) {
        if (Get-Command $candidate -ErrorAction SilentlyContinue) {
            return $candidate
        }
    }
    throw "No make-compatible build tool found in PATH. Install make or mingw32-make."
}

function Resolve-Executable {
    param(
        [Parameter(Mandatory)] [string]$Directory,
        [Parameter(Mandatory)] [string[]]$Names
    )

    foreach ($name in $Names) {
        $candidate = Join-Path $Directory $name
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
        if ($IsWindows -and (Test-Path "$candidate.exe")) {
            return (Resolve-Path "$candidate.exe").Path
        }
    }
    return $null
}

function Invoke-Step {
    param(
        [string]$Description,
        [scriptblock]$Action
    )

    Write-Host "==> $Description" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        throw "Step failed: $Description"
    }
}

# ------------------ BUILD TOOLS ------------------
$make = Get-MakeCommand

# ------------------ BUILD & TRAIN LLM ------------------
$llmDir = Join-Path $repoRoot 'trigram_llm'
$llmExeNames = if ($IsWindows) { @('trigram_llm.exe', 'trigram_llm') } else { @('trigram_llm') }

Push-Location $llmDir
try {
    $llmExePath = Resolve-Executable $llmDir $llmExeNames
    if (-not $llmExePath) {
        Invoke-Step 'Building trigram_llm' { & $make }
        $llmExePath = Resolve-Executable $llmDir $llmExeNames
        if (-not $llmExePath) {
            throw 'trigram_llm executable not found after build.'
        }
    }

    if (-not $SkipTrain) {
        $modelPath = Join-Path $llmDir 'output/model.bin'
        if (-not (Test-Path $modelPath)) {
            New-Item -ItemType Directory -Force -Path (Split-Path $modelPath) | Out-Null
            Invoke-Step 'Training trigram language model' { & $llmExePath --train }
        }
        else {
            Write-Host 'Model already exists. Skipping training.' -ForegroundColor Yellow
        }
    }
}
finally {
    Pop-Location
}

# ------------------ BUILD API SERVER ------------------
$apiDir = Join-Path $repoRoot 'trigram_api'
$apiExeNames = if ($IsWindows) { @('trigram_api.exe', 'trigram_api') } else { @('trigram_api') }

Push-Location $apiDir
try {
    # Check for libmicrohttpd on Linux
    if (-not $IsWindows) {
        if (-not (Get-Command 'pkg-config' -ErrorAction SilentlyContinue) -or `
            -not (pkg-config --exists libmicrohttpd 2>$null)) {
            Write-Host "Warning: libmicrohttpd-dev might be missing. If build fails, run: sudo apt install libmicrohttpd-dev" -ForegroundColor Yellow
        }
    }

    $apiExePath = Resolve-Executable $apiDir $apiExeNames
    if (-not $apiExePath) {
        Invoke-Step 'Building trigram_api' { & $make }
        $apiExePath = Resolve-Executable $apiDir $apiExeNames
        if (-not $apiExePath) {
            throw 'trigram_api executable not found after build.'
        }
    }
}
finally {
    Pop-Location
}

# ------------------ FRONTEND PREP ------------------
$frontendDir = Join-Path $repoRoot 'trigram_frontend_api'

if (-not $SkipFrontendInstall) {
    if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
        Invoke-Step 'Installing frontend dependencies' {
            $npm = if ($IsWindows) { 'npm.cmd' } else { 'npm' }
            & $npm install --prefix $frontendDir
        }
    }
}

# ------------------ START SERVICES ------------------
Write-Host 'Starting services...' -ForegroundColor Green

if ($IsWindows) {
    # Launch in separate PowerShell windows
    $backendProcess = Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', "cd '$apiDir'; & '$apiExePath'" -PassThru
    $frontendProcess = Start-Process powershell.exe -ArgumentList '-NoExit', '-Command', "cd '$frontendDir'; npm run dev" -PassThru
    
    Write-Host "`nAll services launched successfully (Windows):" -ForegroundColor Green
    Write-Host ("  Backend  (PID {0}) → http://localhost:8080" -f $backendProcess.Id)
    Write-Host ("  Frontend (PID {0}) → http://localhost:3000" -f $frontendProcess.Id)
}
else {
    # On Linux/WSL, we'll run them in the background and redirect output to logs
    # Alternatively, users could use tmux/screen, but for this script we'll use backgrounding.
    Write-Host "Running on Linux/WSL. Services will run in background." -ForegroundColor Yellow
    
    $backendLog = Join-Path $apiDir "backend.log"
    $frontendLog = Join-Path $frontendDir "frontend.log"
    
    # Start Backend
    Write-Host "Starting Backend (Logging to $backendLog)..."
    Start-Process -FilePath "nohup" -ArgumentList "'$apiExePath' > '$backendLog' 2>&1 &" -WorkingDirectory $apiDir
    
    # Start Frontend
    Write-Host "Starting Frontend (Logging to $frontendLog)..."
    Start-Process -FilePath "nohup" -ArgumentList "npm run dev > '$frontendLog' 2>&1 &" -WorkingDirectory $frontendDir
    
    Write-Host "`nServices started in background." -ForegroundColor Green
    Write-Host "  Backend  → http://localhost:8080 (Log: $backendLog)"
    Write-Host "  Frontend → http://localhost:3000 (Log: $frontendLog)"
    Write-Host "`nTo stop them, use: pkill trigram_api; pkill node"
}
