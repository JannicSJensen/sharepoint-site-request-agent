import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { RequestStore } from "../adapters/requestStore.js";
import { evaluateGovernance, validateExternalDomains } from "../core/governance.js";
import { createProvisioningPlan } from "../core/provisioningPlan.js";
import { createSiteRequestSchema, type SiteRequestRecord } from "../types/request.js";

export const mcpTools = [
  {
    name: "create_sharepoint_site_request",
    description: "Create a governed SharePoint site request. This records and plans only; it does not provision a live site.",
    inputSchema: createSiteRequestSchema
  },
  {
    name: "get_sharepoint_site_request_status",
    description: "Get request status and governance outcome.",
    inputSchema: z.object({ id: z.string().uuid() })
  },
  {
    name: "list_pending_sharepoint_site_requests",
    description: "List requests waiting for admin approval.",
    inputSchema: z.object({})
  },
  {
    name: "approve_sharepoint_site_request",
    description: "Approve a request and mark it ready for provisioning.",
    inputSchema: z.object({ id: z.string().uuid(), approverEmail: z.string().email(), reason: z.string().optional() })
  },
  {
    name: "reject_sharepoint_site_request",
    description: "Reject a request.",
    inputSchema: z.object({ id: z.string().uuid(), approverEmail: z.string().email(), reason: z.string().min(1) })
  },
  {
    name: "validate_external_domain_policy",
    description: "Validate external domains against the example allowlist policy.",
    inputSchema: z.object({ domains: z.array(z.string().min(3)) })
  }
];

export async function callTool(store: RequestStore, name: string, args: unknown) {
  switch (name) {
    case "create_sharepoint_site_request": {
      const input = createSiteRequestSchema.parse(args);
      const now = new Date().toISOString();
      const record: SiteRequestRecord = {
        ...input,
        id: uuidv4(),
        status: "pending_approval",
        governance: evaluateGovernance(input),
        createdAt: now,
        updatedAt: now,
        approvals: []
      };
      record.provisioningPlan = createProvisioningPlan(record);
      return store.create(record);
    }
    case "get_sharepoint_site_request_status": {
      const input = z.object({ id: z.string().uuid() }).parse(args);
      const record = await store.get(input.id);
      if (!record) {
        throw new Error(`Request '${input.id}' was not found.`);
      }

      return record;
    }
    case "list_pending_sharepoint_site_requests":
      return store.list("pending_approval");
    case "approve_sharepoint_site_request": {
      const input = z.object({ id: z.string().uuid(), approverEmail: z.string().email(), reason: z.string().optional() }).parse(args);
      const record = await requireRecord(store, input.id);
      record.approvals.push({
        approverEmail: input.approverEmail,
        decision: "approved",
        reason: input.reason,
        decidedAt: new Date().toISOString()
      });
      record.status = "ready_for_provisioning";
      record.updatedAt = new Date().toISOString();
      return store.update(record);
    }
    case "reject_sharepoint_site_request": {
      const input = z.object({ id: z.string().uuid(), approverEmail: z.string().email(), reason: z.string().min(1) }).parse(args);
      const record = await requireRecord(store, input.id);
      record.approvals.push({
        approverEmail: input.approverEmail,
        decision: "rejected",
        reason: input.reason,
        decidedAt: new Date().toISOString()
      });
      record.status = "rejected";
      record.updatedAt = new Date().toISOString();
      return store.update(record);
    }
    case "validate_external_domain_policy": {
      const input = z.object({ domains: z.array(z.string().min(3)) }).parse(args);
      return validateExternalDomains(input.domains);
    }
    default:
      throw new Error(`Unknown MCP tool '${name}'.`);
  }
}

async function requireRecord(store: RequestStore, id: string) {
  const record = await store.get(id);
  if (!record) {
    throw new Error(`Request '${id}' was not found.`);
  }

  return record;
}
