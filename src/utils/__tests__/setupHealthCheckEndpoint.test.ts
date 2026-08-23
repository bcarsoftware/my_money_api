import { AppDataSource } from "@/data-source";
import { setupHealthCheckEndpoint } from "@/utils/setupHealthCheckEndpoint";
import { Express, Request, Response } from "express";

// Mock do AppDataSource para isolar completamente o banco de dados
jest.mock("@/data-source", () => ({
  AppDataSource: {
    query: jest.fn(),
  },
}));

describe("setupHealthCheckEndpoint", () => {
  let mockApp: {
    get: jest.Mock;
  };
  let mockReq: Partial<Request>;
  let mockRes: {
    status: jest.Mock;
    json: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockApp = {
      get: jest.fn(),
    };

    mockReq = {};

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("deve registrar a rota GET /api/health na aplicação Express", () => {
    setupHealthCheckEndpoint(mockApp as unknown as Express);

    expect(mockApp.get).toHaveBeenCalledTimes(1);
    expect(mockApp.get).toHaveBeenCalledWith(
      "/api/health",
      expect.any(Function)
    );
  });

  describe("Handler GET /api/health", () => {
    // Helper para extrair e executar o handler registrado em app.get
    const getRouteHandler = () => {
      setupHealthCheckEndpoint(mockApp as unknown as Express);
      return mockApp.get.mock.calls[0][1] as (
        req: Request,
        res: Response
      ) => Promise<void>;
    };

    it("deve retornar 200 e status healthy quando a conexão com o banco for bem-sucedida", async () => {
      (AppDataSource.query as jest.Mock).mockResolvedValueOnce([
        { "?column?": 1 },
      ]);

      const handler = getRouteHandler();
      await handler(mockReq as Request, mockRes as unknown as Response);

      expect(AppDataSource.query).toHaveBeenCalledTimes(1);
      expect(AppDataSource.query).toHaveBeenCalledWith("SELECT 1");

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "healthy",
          database: "connected",
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        })
      );

      // Validação de formato ISO do timestamp
      const responsePayload = mockRes.json.mock.calls[0][0];
      expect(new Date(responsePayload.timestamp).toISOString()).toBe(
        responsePayload.timestamp
      );
    });

    it("deve retornar 500 e status unhealthy quando o banco de dados lançar um erro", async () => {
      (AppDataSource.query as jest.Mock).mockRejectedValueOnce(
        new Error("Connection refused - Database unavailable")
      );

      const handler = getRouteHandler();
      await handler(mockReq as Request, mockRes as unknown as Response);

      expect(AppDataSource.query).toHaveBeenCalledTimes(1);
      expect(AppDataSource.query).toHaveBeenCalledWith("SELECT 1");

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "unhealthy",
          database: "disconnected",
          uptime: expect.any(Number),
          timestamp: expect.any(String),
        })
      );
    });
  });
});
