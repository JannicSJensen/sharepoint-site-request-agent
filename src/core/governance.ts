import type { CreateSiteRequest, GovernanceDecision } from "../types/request.js";

const allowedExternalDomains = new Set(["microsoft.com", "microsoft.onmicrosoft.com"]);

export function evaluateGovernance(request: CreateSiteRequest): GovernanceDecision {
  const reasons: string[] = [];
  const requiredApprovals = new Set<string>(["SharePoint Service Owner"]);
  const recommendedPurviewControls = new Set<string>(["Audit request and approval history"]);
  let severity: GovernanceDecision["severity"] = "low";

  if (request.audience === "external-users-required") {
    requiredApprovals.add("Information Protection Owner");
    recommendedPurviewControls.add("Apply external sharing policy");
    recommendedPurviewControls.add("Validate domain allowlist");
    severity = "medium";
  }

  if (request.classification === "confidential" || request.classification === "highly-confidential") {
    requiredApprovals.add("Data Owner");
    recommendedPurviewControls.add(`Apply ${request.classification} sensitivity label`);
    recommendedPurviewControls.add("Apply retention policy based on site purpose");
    severity = request.classification === "highly-confidential" ? "high" : severity;
  }

  const blockedDomains = request.externalDomains.filter((domain) => !allowedExternalDomains.has(domain.toLowerCase()));
  if (blockedDomains.length > 0) {
    reasons.push(`External domains require review: ${blockedDomains.join(", ")}`);
    requiredApprovals.add("Security Review");
    severity = "high";
  }

  if (request.lifecycle === "temporary-project") {
    recommendedPurviewControls.add("Set lifecycle review date");
  }

  if (request.purpose === "external-collaboration" && request.audience !== "external-users-required") {
    reasons.push("External collaboration purpose requires external audience selection.");
  }

  return {
    allowed: reasons.length === 0 || severity !== "high",
    severity,
    reasons,
    requiredApprovals: Array.from(requiredApprovals),
    recommendedPurviewControls: Array.from(recommendedPurviewControls)
  };
}

export function validateExternalDomains(domains: string[]) {
  return domains.map((domain) => ({
    domain,
    allowed: allowedExternalDomains.has(domain.toLowerCase()),
    action: allowedExternalDomains.has(domain.toLowerCase()) ? "allow" : "requires-security-review"
  }));
}
