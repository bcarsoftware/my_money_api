import { validate } from "class-validator";
import {
  isUsername,
  IsUsername,
  IS_USERNAME,
} from "@/utils/verifiers/decorators/IsUsername";

class UserDto {
  @IsUsername({ message: "Username informado é inválido" })
  username!: string;
}

class DefaultMessageDto {
  @IsUsername()
  username!: string;
}

describe("Class Validator - Custom Decorator @IsUsername & isUsername helper", () => {
  describe("Função auxiliar isUsername", () => {
    it.each([
      "abc",
      "abelcarvalho",
      "user_123",
      "dev-fullstack",
      "a" + "b".repeat(128),
    ])("deve retornar true para usernames válidos: %s", (validUser) => {
      expect(isUsername(validUser)).toBe(true);
    });

    it.each([
      "",
      "b",
      "1user",
      "_user",
      "-user",
      "User",
      "user name",
      "user@name",
      "a" + "b".repeat(129),
    ])(
      "deve retornar false para strings que não cumprem o padrão: %s",
      (invalidUser) => {
        expect(isUsername(invalidUser)).toBe(false);
      }
    );

    it("deve retornar false para valores não-string", () => {
      expect(isUsername(null)).toBe(false);
      expect(isUsername(undefined)).toBe(false);
      expect(isUsername(12345)).toBe(false);
      expect(isUsername({})).toBe(false);
    });
  });

  describe("Decorator @IsUsername em DTO", () => {
    it("deve passar na validação quando o username no DTO for válido", async () => {
      const dto = new UserDto();
      dto.username = "abelcarvalho";

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it("deve falhar na validação com a mensagem customizada quando o username for inválido", async () => {
      const dto = new UserDto();
      dto.username = "123invalid";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toBeDefined();
      expect(errors[0]?.constraints?.[IS_USERNAME]).toBe(
        "Username informado é inválido"
      );
    });

    it("deve usar a mensagem padrão quando validationOptions não for fornecido", async () => {
      const dto = new DefaultMessageDto();
      dto.username = "-invalid";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toBeDefined();
      expect(errors[0]?.constraints?.[IS_USERNAME]).toBe(
        "username must be a valid username. It should start with a lowercase letter, can contain lowercase letters, numbers, underscores, and hyphens, and must be between 2 and 128 characters long."
      );
    });

    it("deve falhar quando o campo for undefined ou null", async () => {
      const dto = new UserDto();
      dto.username = undefined as unknown as string;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toBeDefined();
      expect(errors[0]?.constraints?.[IS_USERNAME]).toBeDefined();
    });
  });
});
