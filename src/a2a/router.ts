import { Router } from "express";
import type { RequestStore } from "../adapters/requestStore.js";
import { callTool } from "../mcp/tools.js";

export function createA2aRouter(store: RequestStore) {
  const router = Router();

  router.post("/tasks", async (req, res) => {
    const task = req.body;

    try {
      const result = await dispatchTask(store, task);
      res.json({
        id: task.id ?? crypto.randomUUID(),
        status: {
          state: "completed"
        },
        artifacts: [
          {
            name: "result",
            parts: [{ kind: "text", text: JSON.stringify(result, null, 2) }]
          }
        ]
      });
    } catch (error) {
      res.status(400).json({
        id: task.id ?? crypto.randomUUID(),
        status: {
          state: "failed",
          message: error instanceof Error ? error.message : "A2A task failed."
        }
      });
    }
  });

  return router;
}

async function dispatchTask(store: RequestStore, task: { skill?: string; input?: unknown }) {
  switch (task.skill) {
    case "site-request.create":
      return callTool(store, "create_sharepoint_site_request", task.input);
    case "site-request.status":
      return callTool(store, "get_sharepoint_site_request_status", task.input);
    case "site-request.approve":
      return callTool(store, "approve_sharepoint_site_request", task.input);
    case "site-request.reject":
      return callTool(store, "reject_sharepoint_site_request", task.input);
    default:
      throw new Error(`Unsupported A2A skill '${task.skill}'.`);
  }
}
