import express from "express";
import { createA2aRouter } from "./a2a/router.js";
import { createApiRouter } from "./api/router.js";
import { FileRequestStore } from "./adapters/fileRequestStore.js";
import { createMcpRouter } from "./mcp/router.js";

export function createServer() {
  const app = express();
  const store = new FileRequestStore(process.env.REQUEST_STORE_PATH ?? ".data/requests.json");

  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "sharepoint-site-request-agent",
      provisioningMode: "contract-only"
    });
  });

  app.use("/api", createApiRouter(store));
  app.use("/mcp", createMcpRouter(store));
  app.use("/a2a", createA2aRouter(store));

  app.get("/.well-known/agent-card.json", (_req, res) => {
    res.json({
      name: "sharepoint-site-request-agent",
      description: "Governed SharePoint site request, approval, and provisioning coordination agent.",
      url: `${process.env.PUBLIC_BASE_URL ?? "http://localhost:3978"}/a2a/tasks`,
      version: "0.1.0",
      capabilities: {
        streaming: false,
        pushNotifications: false
      },
      skills: [
        {
          id: "site-request.create",
          name: "Create SharePoint site request",
          description: "Captures site purpose, audience, data classification, external domains, and owner details."
        },
        {
          id: "site-request.status",
          name: "Track SharePoint site request",
          description: "Returns current status, governance decision, approval state, and next action."
        },
        {
          id: "site-request.approve",
          name: "Approve SharePoint site request",
          description: "Records an administrator approval decision."
        },
        {
          id: "site-request.reject",
          name: "Reject SharePoint site request",
          description: "Records an administrator rejection decision with a reason."
        }
      ]
    });
  });

  return app;
}
