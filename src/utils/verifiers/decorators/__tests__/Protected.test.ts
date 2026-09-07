import { TokenPayload, verifyAccessToken } from "@/auth/verifyAccessToken";
import { TOKEN_INVALID } from "@/constants/constants";
import { MyContext } from "@/context/MyContext";
import { accessCookieName } from "@/utils/cookiesUtil";
import {
  authMiddleware,
  Protected,
} from "@/utils/verifiers/decorators/Protected";
import { Request, Response } from "express";
import { ResolverData } from "type-graphql";

// Mocks
jest.mock("@/auth/verifyAccessToken");
jest.mock("@/utils/cookiesUtil");

const mockedVerifyAccessToken = jest.mocked(verifyAccessToken);
const mockedAccessCookieName = jest.mocked(accessCookieName);

describe("Protected Decorator & authMiddleware", () => {
  const mockCookieName = "accessToken";
  const mockToken = "valid.jwt.token";
  const mockClaims: TokenPayload = {
    userId: "550e8400-e29b-41d4-a716-446655440000",
    username: "abelcarvalho",
    email: "abel@example.com",
  };

  let mockContext: MyContext;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedAccessCookieName.mockReturnValue(mockCookieName);

    mockContext = {
      req: {} as Request,
      res: {} as Response,
    } as MyContext;

    mockNext = jest.fn().mockResolvedValue("resolver_result");
  });

  describe("authMiddleware", () => {
    describe("quando o token está disponível", () => {
      it("deve usar o token de context.accessToken (prioridade máxima) e ignorar cookies", async () => {
        // Arrange
        mockContext.accessToken = mockToken;
        // Atribui um request com cookie diferente para garantir que não será lido
        mockContext.req = {
          cookies: { [mockCookieName]: "outro_token" },
        } as unknown as Request;

        mockedVerifyAccessToken.mockResolvedValue(mockClaims);

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act
        const result = await authMiddleware(resolverData, mockNext);

        // Assert
        expect(mockedVerifyAccessToken).toHaveBeenCalledWith(mockToken);
        expect(mockedAccessCookieName).not.toHaveBeenCalled();
        expect(mockContext.userId).toBe(mockClaims.userId);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(result).toBe("resolver_result");
      });

      it("deve extrair o token do cookie quando context.accessToken for undefined", async () => {
        // Arrange
        mockContext.req = {
          cookies: { [mockCookieName]: mockToken },
        } as unknown as Request;

        mockedVerifyAccessToken.mockResolvedValue(mockClaims);

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act
        const result = await authMiddleware(resolverData, mockNext);

        // Assert
        expect(mockedAccessCookieName).toHaveBeenCalledTimes(1);
        expect(mockedVerifyAccessToken).toHaveBeenCalledWith(mockToken);
        expect(mockContext.userId).toBe(mockClaims.userId);
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(result).toBe("resolver_result");
      });

      it("deve extrair o token do cookie mesmo quando o nome do cookie é dinâmico", async () => {
        // Arrange
        const dynamicName = "custom_cookie_name";
        mockedAccessCookieName.mockReturnValue(dynamicName);

        mockContext.req = {
          cookies: { [dynamicName]: mockToken },
        } as unknown as Request;

        mockedVerifyAccessToken.mockResolvedValue(mockClaims);

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act
        await authMiddleware(resolverData, mockNext);

        // Assert
        expect(mockedAccessCookieName).toHaveBeenCalled();
        expect(mockedVerifyAccessToken).toHaveBeenCalledWith(mockToken);
      });
    });

    describe("quando o token não está disponível", () => {
      it("deve lançar erro TOKEN_INVALID se não houver token em context.accessToken nem em cookies", async () => {
        // Arrange
        mockContext.req = { cookies: {} } as unknown as Request;

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act & Assert
        await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
          TOKEN_INVALID
        );

        expect(mockedVerifyAccessToken).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("deve lançar erro TOKEN_INVALID se req.cookies for undefined e não houver accessToken", async () => {
        // Arrange
        mockContext.req = {} as Request; // Sem cookies

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act & Assert
        await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
          TOKEN_INVALID
        );

        expect(mockedVerifyAccessToken).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });

      it("deve lançar erro TOKEN_INVALID se o cookie existir mas estiver vazio", async () => {
        // Arrange
        mockContext.req = {
          cookies: { [mockCookieName]: "" },
        } as unknown as Request;

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act & Assert
        await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
          TOKEN_INVALID
        );

        expect(mockedVerifyAccessToken).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe("quando o token é inválido ou a verificação falha", () => {
      it("deve lançar TOKEN_INVALID se verifyAccessToken retornar null", async () => {
        // Arrange
        mockContext.accessToken = mockToken;
        // Forçamos o retorno null (que o código trata como inválido)
        // Usamos unknown como ponte seguro, sem any
        mockedVerifyAccessToken.mockResolvedValue(
          null as unknown as TokenPayload
        );

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act & Assert
        await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
          TOKEN_INVALID
        );

        expect(mockNext).not.toHaveBeenCalled();
      });

      it("deve propagar a exceção lançada por verifyAccessToken", async () => {
        // Arrange
        mockContext.accessToken = "invalid.token";
        const jwtError = new Error("jwt malformed");
        mockedVerifyAccessToken.mockRejectedValue(jwtError);

        const resolverData = {
          context: mockContext,
        } as unknown as ResolverData<MyContext>;

        // Act & Assert
        await expect(authMiddleware(resolverData, mockNext)).rejects.toThrow(
          jwtError
        );

        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  describe("Protected decorator", () => {
    it("deve invocar UseMiddleware passando o authMiddleware", () => {
      // Usamos spy para verificar a chamada sem mockar todo o módulo
      const useMiddlewareSpy = jest.spyOn(
        require("type-graphql"),
        "UseMiddleware"
      );

      Protected();

      expect(useMiddlewareSpy).toHaveBeenCalledTimes(1);
      expect(useMiddlewareSpy).toHaveBeenCalledWith(authMiddleware);
    });
  });
});
