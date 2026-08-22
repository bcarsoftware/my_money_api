import { Express } from "express";
import { AppDataSource } from "@/data-source";

export function setupHealthCheckEndpoint(app: Express) {
  app.get("/api/health", async (_req, res) => {
    const health: Record<string, unknown> = {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "unknown",
    };

    try {
      await AppDataSource.query("SELECT 1");
      health.database = "connected";
    } catch {
      health.status = "unhealthy";
      health.database = "disconnected";
    }

    res.status(health.status === "healthy" ? 200 : 500).json(health);
  });
}
