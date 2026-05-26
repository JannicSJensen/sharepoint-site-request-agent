Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root "sharepoint-site-request-agent-package.zip"

if (Test-Path $output) {
    Remove-Item $output
}

Compress-Archive -Path `
    (Join-Path $root "src"), `
    (Join-Path $root "config"), `
    (Join-Path $root "power-automate"), `
    (Join-Path $root "scripts"), `
    (Join-Path $root "README.md"), `
    (Join-Path $root "package.json"), `
    (Join-Path $root "tsconfig.json"), `
    (Join-Path $root ".env.example") `
    -DestinationPath $output

Write-Host "Created $output"
