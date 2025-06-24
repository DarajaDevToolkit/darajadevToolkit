// Simple test webhook receiver
import { serve } from "bun";

const server = serve({
  port: 3002,
  fetch(req) {
    const url = new URL(req.url);
    
    // Handle webhook deliveries
    if (url.pathname === "/webhooks/mpesa" && req.method === "POST") {
      return handleWebhook(req);
    }
    
    // Health check
    if (url.pathname === "/health") {
      return new Response("OK", { status: 200 });
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

async function handleWebhook(req: Request) {
  try {
    const payload = await req.json();
    const headers = Object.fromEntries(req.headers.entries());
    
    console.log("🎉 Webhook received successfully!");
    console.log("📋 Headers:", {
      "x-webhook-event": headers["x-webhook-event"],
      "x-webhook-id": headers["x-webhook-id"], 
      "x-webhook-timestamp": headers["x-webhook-timestamp"],
      "user-agent": headers["user-agent"],
    });
    console.log("📦 Payload:", JSON.stringify(payload, null, 2));
    
    return new Response(JSON.stringify({ 
      status: "success", 
      message: "Webhook received",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return new Response(JSON.stringify({ 
      status: "error", 
      message: "Failed to process webhook" 
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

console.log("🎯 Test webhook receiver running on http://localhost:3002");
console.log("📍 Webhook endpoint: http://localhost:3002/webhooks/mpesa");
console.log("🏥 Health check: http://localhost:3002/health");
