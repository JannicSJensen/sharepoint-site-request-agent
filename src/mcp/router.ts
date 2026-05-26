import { Router } from "express";
import type { RequestStore } from "../adapters/requestStore.js";
import { callTool, mcpTools } from "./tools.js";

export function createMcpRouter(store: RequestStore) {
  const router = Router();

  router.post("/", async (req, res) => {
    const { id, method, params } = req.body ?? {};

    try {
      if (method === "tools/list") {
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: mcpTools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              inputSchema: zodToJsonSchemaPlaceholder(tool.inputSchema._def)
            }))
          }
        });
        return;
      }

      if (method === "tools/call") {
        const result = await callTool(store, params?.name, params?.arguments ?? {});
        res.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
          }
        });
        return;
      }

      res.status(404).json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method '${method}'.` } });
    } catch (error) {
      res.status(400).json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32602,
          message: error instanceof Error ? error.message : "MCP request failed."
        }
      });
    }
  });

  return router;
}

function zodToJsonSchemaPlaceholder(_definition: unknown) {
  return {
    type: "object",
    additionalProperties: true,
    description: "See TypeScript source schema for the authoritative contract."
  };
}
