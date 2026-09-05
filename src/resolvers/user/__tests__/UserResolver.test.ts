import "reflect-metadata";
import { UserResolver } from "@/resolvers/user/UserResolver";
import { User } from "@/entities/User";
import { generateAccessToken } from "@/auth/generateAccessToken";
import { comparePassword, hashPassword } from "@/utils/passwordUtil";
import { loggedContext } from "@/utils/loggedContext";
import { toUserDto } from "@/resolvers/user/dto/toUserDto";
import { MyContext } from "@/context/MyContext";
import {
  CreateUserInput,
  UpdateUserInput,
  UserLoginInput,
} from "@/resolvers/user/UserInputs";
import { GenderEnum } from "@/enums/GenderEnum";
import { cookieOptions } from "@/constants/cookies";

jest.mock("@/entities/User");
jest.mock("@/auth/generateAccessToken");
jest.mock("@/utils/passwordUtil");
jest.mock("@/utils/loggedContext");
jest.mock("@/resolvers/user/dto/toUserDto");

describe("UserResolver Test Suite", () => {
  let resolver: UserResolver;
  let mockContext: MyContext;
  let mockUser: User;
  let mockEntityManager: {
    findOne: jest.Mock;
    save: jest.Mock;
    softRemove: jest.Mock;
  };

  const originalEnv = process.env;
  const mockToken = "mocked.jwt.access.token";
  const mockUserDto = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Abel Carvalho",
    dateBorn: "1995-05-15T00:00:00.000Z",
    gender: GenderEnum.MALE,
    email: "abel@example.com",
    username: "abelcarvalho",
    salary: "5000.00",
    phone: "+5574999999999",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});

    process.env = { ...originalEnv, MAX_AGE: "3600000" };

    resolver = new UserResolver();

    mockContext = {
      req: {} as any,
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
      } as any,
    };

    mockUser = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "Abel Carvalho",
      dateBorn: new Date("1995-05-15T00:00:00.000Z"),
      gender: GenderEnum.MALE,
      email: "abel@example.com",
      username: "abelcarvalho",
      password: "hashed_db_password",
      salary: "5000.00",
      phone: "+5574999999999",
      save: jest.fn().mockResolvedValue(true),
    } as unknown as User;

    mockEntityManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      softRemove: jest.fn(),
    };

    (loggedContext as jest.Mock).mockImplementation((_ctx, callback) =>
      callback(mockEntityManager)
    );

    (toUserDto as jest.Mock).mockReturnValue(mockUserDto);
    (generateAccessToken as jest.Mock).mockResolvedValue(mockToken);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("loginUser", () => {
    const loginInput: UserLoginInput = {
      username: "abelcarvalho",
      password: "CorrectPassword#2026",
    };

    it("deve autenticar o usuário, setar o cookie e retornar UserDto", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockReturnValue(true);

      const result = await resolver.loginUser(loginInput, mockContext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: [
          { username: loginInput.username },
          { email: loginInput.username },
        ],
      });
      expect(comparePassword).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(generateAccessToken).toHaveBeenCalledWith({
        userId: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      });
      expect(mockContext.res.cookie).toHaveBeenCalledWith(
        "accessToken",
        mockToken,
        {
          ...cookieOptions,
          maxAge: 3600000,
        }
      );
      expect(toUserDto).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserDto);
    });

    it("deve lançar erro genérico se o usuário não for encontrado", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(resolver.loginUser(loginInput, mockContext)).rejects.toThrow(
        "Failed to login user."
      );

      expect(mockContext.res.cookie).not.toHaveBeenCalled();
    });

    it("deve lançar erro genérico se a senha estiver incorreta", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockReturnValue(false);

      await expect(resolver.loginUser(loginInput, mockContext)).rejects.toThrow(
        "Failed to login user."
      );

      expect(mockContext.res.cookie).not.toHaveBeenCalled();
    });
  });

  describe("forgotPassowrd", () => {
    const input: UserLoginInput = {
      username: "abelcarvalho",
      password: "NewPassword#2026",
    };

    it("deve redefinir a senha do usuário com sucesso", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue("new_hashed_password");

      const result = await resolver.forgotPassowrd(input);

      expect(User.findOne).toHaveBeenCalledWith({
        where: [{ username: input.username }, { email: input.username }],
      });
      expect(hashPassword).toHaveBeenCalledWith(input.password);
      expect(mockUser.password).toBe("new_hashed_password");
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ message: "Password reset successfully." });
    });

    it("deve lançar erro se o usuário não existir", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(resolver.forgotPassowrd(input)).rejects.toThrow(
        "Failed to reset password."
      );
    });
  });

  describe("createUser", () => {
    const createInput: CreateUserInput = {
      name: "Abel Carvalho",
      dateBorn: "1995-05-15T00:00:00.000Z",
      gender: GenderEnum.MALE,
      email: "abel@example.com",
      username: "abelcarvalho",
      password: "SecretPassword#2026",
      salary: "5000.00",
      phone: "+5574999999999",
    };

    it("deve criar um novo usuário e retornar UserDto", async () => {
      (hashPassword as jest.Mock).mockResolvedValue("hashed_password");
      (User.create as jest.Mock).mockReturnValue({
        save: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await resolver.createUser(createInput);

      expect(hashPassword).toHaveBeenCalledWith("SecretPassword#2026");
      expect(User.create).toHaveBeenCalledWith({
        ...createInput,
        dateBorn: new Date(createInput.dateBorn),
        password: "hashed_password",
      });
      expect(toUserDto).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserDto);
    });

    it("deve lançar erro se a senha for omitida ou vazia", async () => {
      const inputWithoutPassword = { ...createInput, password: "" };

      await expect(resolver.createUser(inputWithoutPassword)).rejects.toThrow(
        "Password is required."
      );

      expect(User.create).not.toHaveBeenCalled();
    });

    it("deve lançar erro genérico se o save falhar", async () => {
      (hashPassword as jest.Mock).mockResolvedValue("hashed_password");
      (User.create as jest.Mock).mockReturnValue({
        save: jest.fn().mockRejectedValue(new Error("DB Error")),
      });

      await expect(resolver.createUser(createInput)).rejects.toThrow(
        "Failed to create user."
      );
    });
  });

  describe("updateUser", () => {
    const updateInput: UpdateUserInput = {
      name: "Abel Atualizado",
      dateBorn: "1996-01-01T00:00:00.000Z",
      gender: GenderEnum.MALE,
      email: "novo_email@example.com",
      username: "abel_novo",
      salary: "6000.00",
      phone: "+5574888888888",
    };

    it("deve atualizar os dados do usuário, renovar cookie de sessão e retornar UserDto", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockEntityManager.save.mockResolvedValue(mockUser);

      const result = await resolver.updateUser(
        mockContext,
        mockUser.id,
        updateInput
      );

      expect(loggedContext).toHaveBeenCalledWith(
        mockContext,
        expect.any(Function)
      );
      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: mockUser.id },
      });
      expect(mockUser.name).toBe("Abel Atualizado");
      expect(mockUser.email).toBe("novo_email@example.com");
      expect(mockUser.username).toBe("abel_novo");
      expect(mockUser.salary).toBe("6000.00");
      expect(mockUser.phone).toBe("+5574888888888");
      expect(mockEntityManager.save).toHaveBeenCalledWith(mockUser);

      expect(mockContext.res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        cookieOptions
      );
      expect(mockContext.res.cookie).toHaveBeenCalledWith(
        "accessToken",
        mockToken,
        {
          ...cookieOptions,
          maxAge: 3600000,
        }
      );
      expect(result).toEqual(mockUserDto);
    });

    it("deve lançar erro se o usuário a ser atualizado não for encontrado", async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        resolver.updateUser(mockContext, "invalid-id", updateInput)
      ).rejects.toThrow(Error);
    });
  });

  describe("changePassword", () => {
    it("deve alterar a senha com sucesso dentro do contexto logado", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockEntityManager.save.mockResolvedValue(mockUser);
      (hashPassword as jest.Mock).mockResolvedValue("new_hashed_password");

      const result = await resolver.changePassword(
        mockContext,
        mockUser.id,
        "NewSecret#2026"
      );

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: mockUser.id },
      });
      expect(hashPassword).toHaveBeenCalledWith("NewSecret#2026");
      expect(mockUser.password).toBe("new_hashed_password");
      expect(mockEntityManager.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ message: "Password changed successfully." });
    });

    it("deve lançar erro se o usuário não for encontrado", async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        resolver.changePassword(mockContext, "invalid-id", "NewSecret#2026")
      ).rejects.toThrow(Error);
    });
  });

  describe("logoutUser", () => {
    it("deve limpar o cookie de acesso e retornar mensagem de sucesso", async () => {
      const result = await resolver.logoutUser(mockContext);

      expect(mockContext.res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        cookieOptions
      );
      expect(result).toEqual({ message: "User logged out successfully." });
    });

    it("deve lançar erro se clearCookie falhar", async () => {
      mockContext.res.clearCookie = jest.fn().mockImplementation(() => {
        throw new Error("Cookie clear failed");
      });

      await expect(resolver.logoutUser(mockContext)).rejects.toThrow(
        "Failed to logout user."
      );
    });
  });

  describe("deleteUser", () => {
    it("deve realizar o soft delete do usuário e limpar o cookie", async () => {
      mockEntityManager.findOne.mockResolvedValue(mockUser);
      mockEntityManager.softRemove.mockResolvedValue(mockUser);

      const result = await resolver.deleteUser(mockContext, mockUser.id);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: mockUser.id },
      });
      expect(mockEntityManager.softRemove).toHaveBeenCalledWith(mockUser);
      expect(mockContext.res.clearCookie).toHaveBeenCalledWith(
        "accessToken",
        cookieOptions
      );
      expect(result).toEqual({ message: "User deleted successfully." });
    });

    it("deve lançar erro se o usuário a ser deletado não for encontrado", async () => {
      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(
        resolver.deleteUser(mockContext, "invalid-id")
      ).rejects.toThrow(Error);

      expect(mockEntityManager.softRemove).not.toHaveBeenCalled();
    });
  });
});
