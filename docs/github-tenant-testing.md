# GitHub tenant smoke testing

This repository includes two GitHub Actions workflows:

- `CI`: runs on push and pull request, builds the gateway, and runs unit tests.
- `Tenant smoke test`: manual workflow that performs read-only Microsoft Graph checks against a tenant.

## Why not username and password?

Do not put a user password in GitHub secrets. MFA-enabled users cannot be used reliably from unattended CI, and storing passwords in CI is not appropriate for this package.

Use a dedicated Entra application registration with GitHub workload identity federation instead.

## Required GitHub secret

| Secret | Purpose |
|---|---|
| `TEST_USER_UPN` | Optional. UPN of a demo user to verify read-only lookup. |

The tenant ID is supplied as a `workflow_dispatch` input and defaults to the demo tenant.

The configured demo tenant values are:

| Setting | Value |
|---|---|
| Tenant ID | `f24e5cef-e4a8-409f-b11b-51e4f40467c1` |
| OIDC client ID | `04e23119-3ed3-4bf8-bf5b-2f76071a2de5` |
| GitHub subject | `repo:JannicSJensen/sharepoint-site-request-agent:ref:refs/heads/main` |

## Entra app registration setup

1. Create an app registration in the demo tenant.
2. Add a federated credential for this GitHub repository:
   - Issuer: `https://token.actions.githubusercontent.com`
   - Subject: `repo:JannicSJensen/sharepoint-site-request-agent:ref:refs/heads/main`
   - Audience: `api://AzureADTokenExchange`
3. Grant Microsoft Graph application permissions needed for read-only smoke tests:
   - `Organization.Read.All`
   - `User.Read.All` if `TEST_USER_UPN` is configured
4. Grant admin consent in the demo tenant.
5. Update `.github/workflows/tenant-smoke-test.yml` with the app registration client ID.

## Running the smoke test

In GitHub:

1. Open **Actions**.
2. Select **Tenant smoke test**.
3. Choose **Run workflow**.
4. Keep the default tenant ID unless testing a different tenant.

The workflow validates the local package first, then uses Azure OIDC login and calls Microsoft Graph read-only endpoints.

## Extending the test

Keep the workflow read-only until the provisioning adapter is deliberately enabled. Good next test additions are:

- Verify Copilot Studio action schema generation.
- Verify request API contracts with sample payloads.
- Verify SharePoint hostname resolution.
- Verify Purview label lookup with least-privilege application permissions.
