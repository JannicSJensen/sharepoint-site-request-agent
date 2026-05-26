Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI is required for the tenant smoke test."
}

$tenantId = $env:TENANT_ID
if ([string]::IsNullOrWhiteSpace($tenantId)) {
    throw "TENANT_ID environment variable is required."
}

$tokenJson = az account get-access-token --tenant $tenantId --resource-type ms-graph --output json | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($tokenJson.accessToken)) {
    throw "Could not acquire a Microsoft Graph access token."
}

$headers = @{
    Authorization = "Bearer $($tokenJson.accessToken)"
}

$organization = Invoke-RestMethod -Method Get -Uri "https://graph.microsoft.com/v1.0/organization" -Headers $headers
$actualTenantId = $organization.value[0].id

if ($actualTenantId -ne $tenantId) {
    throw "Authenticated tenant '$actualTenantId' did not match expected tenant '$tenantId'."
}

Write-Host "Tenant Graph connectivity OK for tenant $actualTenantId"

if (-not [string]::IsNullOrWhiteSpace($env:EXPECTED_TEST_USER_UPN)) {
    $encodedUpn = [System.Uri]::EscapeDataString($env:EXPECTED_TEST_USER_UPN)
    $user = Invoke-RestMethod -Method Get -Uri "https://graph.microsoft.com/v1.0/users/$encodedUpn?`$select=id,userPrincipalName" -Headers $headers
    Write-Host "Test user lookup OK for $($user.userPrincipalName)"
}

if (-not [string]::IsNullOrWhiteSpace($env:DEPLOYED_SITE_ID) -and -not [string]::IsNullOrWhiteSpace($env:DEPLOYED_LIST_ID)) {
    $siteId = [System.Uri]::EscapeDataString($env:DEPLOYED_SITE_ID)
    $listId = [System.Uri]::EscapeDataString($env:DEPLOYED_LIST_ID)
    $list = Invoke-RestMethod -Method Get -Uri "https://graph.microsoft.com/v1.0/sites/$siteId/lists/$listId?`$select=id,displayName,webUrl" -Headers $headers
    Write-Host "SharePoint request list lookup OK for '$($list.displayName)'"
}
