import { z } from "zod";

export const sitePurposeSchema = z.enum(["project", "department", "community", "external-collaboration", "other"]);
export const audienceSchema = z.enum(["internal-only", "external-users-required"]);
export const classificationSchema = z.enum(["public", "general", "confidential", "highly-confidential"]);
export const lifecycleSchema = z.enum(["temporary-project", "permanent-business-site"]);
export const requestStatusSchema = z.enum([
  "draft",
  "pending_governance_review",
  "pending_approval",
  "approved",
  "rejected",
  "ready_for_provisioning",
  "provisioning_planned",
  "completed",
  "failed"
]);

export const createSiteRequestSchema = z.object({
  requesterEmail: z.string().email(),
  requesterDisplayName: z.string().min(1),
  businessOwnerEmail: z.string().email(),
  businessOwnerDisplayName: z.string().min(1),
  siteName: z.string().min(3).max(80),
  purpose: sitePurposeSchema,
  audience: audienceSchema,
  usageDescription: z.string().min(10).max(2000),
  classification: classificationSchema,
  lifecycle: lifecycleSchema,
  externalDomains: z.array(z.string().min(3)).default([]),
  requestedUrlSlug: z.string().regex(/^[a-z0-9-]+$/).min(3).max(60),
  retentionLabel: z.string().optional(),
  template: z.enum(["team-site", "communication-site", "project-workspace", "extranet-workspace"]).default("team-site")
});

export type CreateSiteRequest = z.infer<typeof createSiteRequestSchema>;
export type RequestStatus = z.infer<typeof requestStatusSchema>;

export type GovernanceDecision = {
  allowed: boolean;
  severity: "low" | "medium" | "high";
  reasons: string[];
  requiredApprovals: string[];
  recommendedPurviewControls: string[];
};

export type SiteRequestRecord = CreateSiteRequest & {
  id: string;
  status: RequestStatus;
  governance: GovernanceDecision;
  createdAt: string;
  updatedAt: string;
  approvals: ApprovalDecision[];
  provisioningPlan?: ProvisioningPlan;
};

export type ApprovalDecision = {
  approverEmail: string;
  decision: "approved" | "rejected";
  reason?: string;
  decidedAt: string;
};

export type ProvisioningPlan = {
  mode: "contract-only";
  siteUrl: string;
  actions: string[];
  warnings: string[];
};
