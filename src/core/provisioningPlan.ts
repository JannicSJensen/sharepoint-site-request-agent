import type { SiteRequestRecord } from "../types/request.js";

export function createProvisioningPlan(record: SiteRequestRecord) {
  const siteUrl = `https://contoso.sharepoint.com/sites/${record.requestedUrlSlug}`;
  const actions = [
    `Reserve SharePoint URL slug '${record.requestedUrlSlug}'`,
    `Create ${record.template} named '${record.siteName}'`,
    `Assign business owner ${record.businessOwnerEmail} as site owner`,
    `Apply classification '${record.classification}'`,
    "Apply Purview audit, retention, and sensitivity controls",
    "Create requester-facing status update"
  ];

  if (record.audience === "external-users-required") {
    actions.push(`Configure external sharing review for domains: ${record.externalDomains.join(", ") || "none provided"}`);
  }

  return {
    mode: "contract-only" as const,
    siteUrl,
    actions,
    warnings: ["This package does not perform live provisioning. Implement a tenant-specific adapter before enabling execution."]
  };
}
