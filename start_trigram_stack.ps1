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
$llmExeNames = @('trigram_llm')

Push-Location $llmDir
try {
    $llmExePath = Resolve-Executable $llmDir $llmExeNames
    if (-not $llmExePath) {
        Invoke-Step 'Building trigram_llm' { & $make }
        $llmExePath = Resolve-Executable $llmDir $llmExeNames
        if (-not $llmExePath) {
            throw 'trigram_llm executable not found.'
        }
    }

    if (-not $SkipTrain) {
        $modelPath = Join-Path $llmDir 'output\model.bin'
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
$apiExeNames = @('trigram_api')

Push-Location $apiDir
try {
    $apiExePath = Resolve-Executable $apiDir $apiExeNames
    if (-not $apiExePath) {
        Invoke-Step 'Building trigram_api' { & $make }
        $apiExePath = Resolve-Executable $apiDir $apiExeNames
        if (-not $apiExePath) {
            throw 'trigram_api executable not found.'
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
            npm install --prefix $frontendDir
        }
    }
}

# ------------------ START BACKEND ------------------
Write-Host 'Starting backend server...' -ForegroundColor Green

$backendCommand = {
    Set-Location -LiteralPath $using:apiDir
    & $using:apiExePath
}

$backendProcess = Start-Process `
    -FilePath powershell.exe `
    -ArgumentList '-NoExit', '-Command', $backendCommand `
    -PassThru

# ------------------ START FRONTEND ------------------
Write-Host 'Starting frontend dev server...' -ForegroundColor Green

$frontendCommand = {
    Set-Location -LiteralPath $using:frontendDir
    npm run dev
}

$frontendProcess = Start-Process `
    -FilePath powershell.exe `
    -ArgumentList '-NoExit', '-Command', $frontendCommand `
    -PassThru

# ------------------ SUMMARY ------------------
Write-Host "`nAll services launched successfully:" -ForegroundColor Green
Write-Host ("  Backend  (PID {0}) → http://localhost:8080" -f $backendProcess.Id)
Write-Host ("  Frontend (PID {0}) → http://localhost:3000" -f $frontendProcess.Id)
Write-Host "`nUse Ctrl+C in each window to stop services."
