import http from "node:http";

// Development tunnel target: never proxy the dashboard, auth routes or token issuance.
const port = Number(process.env.BLOB_CALLBACK_RELAY_PORT || 4198);
const target = "http://127.0.0.1:3002/api/products/images/upload?mode=presigned";
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  if (request.method === "GET" && url.pathname === "/_blob-callback-health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end('{"service":"blob-callback-relay"}');
    return;
  }
  if (request.method !== "POST" || url.pathname !== "/api/products/images/upload" || url.search !== "?mode=presigned") {
    response.writeHead(404); response.end(); return;
  }
  const signature = request.headers["x-vercel-signature"];
  if (typeof signature !== "string" || !signature || signature.length > 8192) {
    response.writeHead(403); response.end(); return;
  }
  try {
    const chunks = []; let size = 0;
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 65536) { response.writeHead(413); response.end(); return; }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const event = JSON.parse(body.toString("utf8"));
    if (event?.type !== "blob.upload-completed" || !event.payload || typeof event.payload !== "object") {
      response.writeHead(403); response.end(); return;
    }
    // The application SDK verifies the callback cryptographically before persistence.
    const upstream = await fetch(target, {
      method: "POST", body,
      headers: { "content-type": "application/json", "x-vercel-signature": signature },
      signal: AbortSignal.timeout(30000), redirect: "error",
    });
    response.writeHead(upstream.status, { "content-type": "application/json" });
    response.end(await upstream.text());
  } catch {
    if (!response.headersSent) response.writeHead(400);
    response.end('{"error":"Invalid callback request"}');
  }
});
server.listen(port, "127.0.0.1", () => console.log(`Blob callback relay ready on loopback port ${port}; administration and token issuance are not proxied.`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
