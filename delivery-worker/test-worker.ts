// Simple test to check BullMQ connection
import { Worker } from "bullmq";

console.log("🧪 Testing BullMQ connection...");

const redisConnection = {
  host: "localhost",
  port: 6379,
};

console.log("📡 Creating worker...");

try {
  const worker = new Worker(
    "test-queue",
    async (job) => {
      console.log("Processing job:", job.id);
    },
    {
      connection: redisConnection,
    }
  );

  worker.on("ready", () => {
    console.log("✅ Worker ready!");
  });

  worker.on("error", (err) => {
    console.error("❌ Worker error:", err);
  });

  console.log("🎯 Worker created, waiting for events...");
} catch (error) {
  console.error("💥 Failed to create worker:", error);
}
