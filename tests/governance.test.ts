import { describe, expect, it } from "vitest";
import { evaluateGovernance, validateExternalDomains } from "../src/core/governance.js";
import type { CreateSiteRequest } from "../src/types/request.js";

const baseRequest: CreateSiteRequest = {
  requesterEmail: "requester@microsoft.com",
  requesterDisplayName: "Requester",
  businessOwnerEmail: "owner@microsoft.com",
  businessOwnerDisplayName: "Owner",
  siteName: "Project Mercury",
  purpose: "project",
  audience: "internal-only",
  usageDescription: "A project workspace for internal collaboration and document management.",
  classification: "general",
  lifecycle: "temporary-project",
  externalDomains: [],
  requestedUrlSlug: "project-mercury",
  template: "project-workspace"
};

describe("governance evaluation", () => {
  it("allows a standard internal project request", () => {
    const result = evaluateGovernance(baseRequest);

    expect(result.allowed).toBe(true);
    expect(result.severity).toBe("low");
    expect(result.requiredApprovals).toContain("SharePoint Service Owner");
  });

  it("escalates unapproved external domains", () => {
    const result = evaluateGovernance({
      ...baseRequest,
      audience: "external-users-required",
      externalDomains: ["supplier.example"]
    });

    expect(result.severity).toBe("high");
    expect(result.requiredApprovals).toContain("Security Review");
    expect(result.reasons[0]).toContain("supplier.example");
  });

  it("validates external domains against the allowlist", () => {
    const result = validateExternalDomains(["microsoft.com", "contoso.com"]);

    expect(result).toEqual([
      { domain: "microsoft.com", allowed: true, action: "allow" },
      { domain: "contoso.com", allowed: false, action: "requires-security-review" }
    ]);
  });
});
