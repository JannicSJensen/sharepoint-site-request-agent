param(
    [Parameter(Mandatory = $true)]
    [string]$Owner,

    [string]$Repo = "sharepoint-site-request-agent"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI 'gh' is not installed. Install it or create the repository manually, then run: git remote add origin https://github.com/$Owner/$Repo.git"
}

gh repo create "$Owner/$Repo" --private --source . --remote origin --push
