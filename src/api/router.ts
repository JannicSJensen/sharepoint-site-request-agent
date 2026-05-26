import { type NextFunction, type Request, type Response, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import type { RequestStore } from "../adapters/requestStore.js";
import { evaluateGovernance } from "../core/governance.js";
import { createProvisioningPlan } from "../core/provisioningPlan.js";
import { createSiteRequestSchema, requestStatusSchema, type SiteRequestRecord } from "../types/request.js";

export function createApiRouter(store: RequestStore) {
  const router = Router();

  router.post("/requests", async (req, res, next) => {
    try {
      const input = createSiteRequestSchema.parse(req.body);
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
      res.status(201).json(await store.create(record));
    } catch (error) {
      next(error);
    }
  });

  router.get("/requests", async (req, res, next) => {
    try {
      const status = req.query.status ? requestStatusSchema.parse(req.query.status) : undefined;
      res.json(await store.list(status));
    } catch (error) {
      next(error);
    }
  });

  router.get("/requests/:id", async (req, res, next) => {
    try {
      const record = await store.get(req.params.id);
      if (!record) {
        res.status(404).json({ error: "not_found", message: `Request '${req.params.id}' was not found.` });
        return;
      }

      res.json(record);
    } catch (error) {
      next(error);
    }
  });

  router.post("/requests/:id/approve", async (req, res, next) => {
    try {
      const record = await requireRequest(store, req.params.id);
      const now = new Date().toISOString();
      record.approvals.push({
        approverEmail: String(req.body.approverEmail),
        decision: "approved",
        reason: req.body.reason ? String(req.body.reason) : undefined,
        decidedAt: now
      });
      record.status = "ready_for_provisioning";
      record.updatedAt = now;
      res.json(await store.update(record));
    } catch (error) {
      next(error);
    }
  });

  router.post("/requests/:id/reject", async (req, res, next) => {
    try {
      const record = await requireRequest(store, req.params.id);
      const now = new Date().toISOString();
      record.approvals.push({
        approverEmail: String(req.body.approverEmail),
        decision: "rejected",
        reason: req.body.reason ? String(req.body.reason) : "Rejected by administrator",
        decidedAt: now
      });
      record.status = "rejected";
      record.updatedAt = now;
      res.json(await store.update(record));
    } catch (error) {
      next(error);
    }
  });

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({
      error: "invalid_request",
      message: error instanceof Error ? error.message : "Request could not be processed."
    });
  });

  return router;
}

async function requireRequest(store: RequestStore, id: string) {
  const record = await store.get(id);
  if (!record) {
    throw new Error(`Request '${id}' was not found.`);
  }

  return record;
}
