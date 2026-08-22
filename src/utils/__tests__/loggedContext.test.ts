import { USER_NOT_FOUND } from "@/constants/constants";
import { MyContext } from "@/context/MyContext";
import { AppDataSource } from "@/data-source";
import { loggedContext } from "@/utils/loggedContext";
import { EntityManager } from "typeorm";

jest.mock("@/data-source", () => ({
  AppDataSource: {
    transaction: jest.fn(),
  },
}));

describe("loggedContext", () => {
  const validUUID = "a3bb108e-1234-491c-99d9-60a0a8b9f1d0";
  let mockEntityManager: {
    query: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockEntityManager = {
      query: jest.fn().mockResolvedValue(undefined),
    };

    (AppDataSource.transaction as jest.Mock).mockImplementation(
      async (callback: (em: EntityManager) => Promise<unknown>) => {
        return callback(mockEntityManager as unknown as EntityManager);
      }
    );
  });

  describe("Validação de Autenticação e UUID (Guards)", () => {
    it("deve lançar erro USER_NOT_FOUND se userId for undefined", async () => {
      const ctx = {} as MyContext;
      const mockCallback = jest.fn();

      await expect(loggedContext(ctx, mockCallback)).rejects.toThrow(
        USER_NOT_FOUND
      );
      expect(AppDataSource.transaction).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("deve lançar erro USER_NOT_FOUND se userId for uma string vazia", async () => {
      const ctx = { userId: "" } as MyContext;
      const mockCallback = jest.fn();

      await expect(loggedContext(ctx, mockCallback)).rejects.toThrow(
        USER_NOT_FOUND
      );
      expect(AppDataSource.transaction).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it("deve lançar erro USER_NOT_FOUND se userId não for um UUID válido", async () => {
      const ctx = { userId: "invalid-uuid-12345" } as MyContext;
      const mockCallback = jest.fn();

      await expect(loggedContext(ctx, mockCallback)).rejects.toThrow(
        USER_NOT_FOUND
      );
      expect(AppDataSource.transaction).not.toHaveBeenCalled();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe("Execução da Transação e Contexto", () => {
    it("deve abrir transação, definir a variável de sessão e retornar o resultado de fn", async () => {
      const ctx = { userId: validUUID } as MyContext;
      const expectedOutput = { id: 1, name: "Resource Created" };
      const mockCallback = jest.fn().mockResolvedValue(expectedOutput);

      const result = await loggedContext(ctx, mockCallback);

      expect(AppDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(mockEntityManager.query).toHaveBeenCalledWith(
        `SET LOCAL app.current_user_id = '${validUUID}'`
      );
      expect(mockCallback).toHaveBeenCalledWith(mockEntityManager);
      expect(result).toEqual(expectedOutput);
    });

    it("deve propagar o erro se a função de callback (fn) lançar uma exceção", async () => {
      const ctx = { userId: validUUID } as MyContext;
      const businessError = new Error("Business logic constraint violation");
      const mockCallback = jest.fn().mockRejectedValue(businessError);

      await expect(loggedContext(ctx, mockCallback)).rejects.toThrow(
        businessError
      );

      expect(mockEntityManager.query).toHaveBeenCalledWith(
        `SET LOCAL app.current_user_id = '${validUUID}'`
      );
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it("deve propagar erro se a query SET LOCAL falhar", async () => {
      const ctx = { userId: validUUID } as MyContext;
      const dbError = new Error("DB Connection Lost during SET LOCAL");
      mockEntityManager.query.mockRejectedValueOnce(dbError);

      const mockCallback = jest.fn();

      await expect(loggedContext(ctx, mockCallback)).rejects.toThrow(dbError);
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
