import { validate } from "class-validator";
import { isCpf, IsCpf, IS_CPF } from "@/utils/verifiers/decorators/IsCpf";

class UserDto {
  @IsCpf({ message: "CPF informado é inválido" })
  cpf!: string;
}

class DefaultMessageDto {
  @IsCpf()
  cpf!: string;
}

describe("Class Validator - Custom Decorator @IsCpf & isCpf helper", () => {
  describe("Função auxiliar isCpf", () => {
    it("deve retornar true para CPF matematicamente válido", () => {
      expect(isCpf("11144477735")).toBe(true);
      expect(isCpf("12345678909")).toBe(true);
    });

    it("deve retornar false para valores não-string", () => {
      expect(isCpf(null)).toBe(false);
      expect(isCpf(undefined)).toBe(false);
      expect(isCpf(12345678909)).toBe(false);
      expect(isCpf({})).toBe(false);
    });

    it("deve retornar false para CPFs inválidos ou sequências repetidas", () => {
      expect(isCpf("00000000000")).toBe(false);
      expect(isCpf("12345678919")).toBe(false);
    });
  });

  describe("Decorator @IsCpf em DTO", () => {
    it("deve passar na validação quando o CPF no DTO for válido", async () => {
      const dto = new UserDto();
      dto.cpf = "11144477735";

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it("deve falhar na validação com a mensagem customizada quando o CPF for inválido", async () => {
      const dto = new UserDto();
      dto.cpf = "11111111111";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty(IS_CPF);
      expect(errors[0]?.constraints?.[IS_CPF]).toBe("CPF informado é inválido");
    });

    it("deve usar a mensagem padrão quando validationOptions não for fornecido", async () => {
      const dto = new DefaultMessageDto();
      dto.cpf = "12345678919";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints?.[IS_CPF]).toBe("cpf must be a valid CPF");
    });

    it("deve falhar quando o campo for undefined ou null", async () => {
      const dto = new UserDto();
      dto.cpf = undefined as unknown as string;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty(IS_CPF);
    });
  });
});
