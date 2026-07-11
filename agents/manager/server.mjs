import { createServer } from "node:http";
import { runManagerAgent } from "./manager-agent.mjs";
import { loadManagerStore } from "./manager-storage.mjs";

const PORT = Number(process.env.PORT ?? 4317);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload, null, 2));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      sendJson(response, 204, {});
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true, service: "aims-manager-agent" });
      return;
    }

    if (request.method === "GET" && request.url === "/runs") {
      const store = await loadManagerStore();
      sendJson(response, 200, { runs: store.runs });
      return;
    }

    if (request.method === "GET" && request.url === "/tasks") {
      const store = await loadManagerStore();
      sendJson(response, 200, { tasks: store.tasks });
      return;
    }

    if (request.method === "POST" && request.url === "/run") {
      const body = JSON.parse((await readBody(request)) || "{}");
      const result = await runManagerAgent({
        request: body.request ?? "Create an internal task draft.",
        dryRun: body.dryRun ?? true,
        model: body.model,
      });
      sendJson(response, 200, result);
      return;
    }

    sendJson(response, 404, { error: "Use GET /health, GET /runs, GET /tasks, or POST /run." });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`AiMS Manager Agent service running at http://127.0.0.1:${PORT}`);
});
