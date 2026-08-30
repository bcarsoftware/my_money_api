import { IS_CNPJ, isCnpj, IsCnpj } from "@/utils/verifiers/decorators/IsCnpj";
import { validate } from "class-validator";

class UserDto {
  @IsCnpj({ message: "CNPJ informado é inválido" })
  cnpj!: string;
}

class DefaultMessageDto {
  @IsCnpj()
  cnpj!: string;
}

describe("Class Validator - Custom Decorator @IsCnpj & isCnpj helper", () => {
  describe("Função auxiliar isCnpj", () => {
    it("deve retornar true para CNPJ matematicamente válido", () => {
      expect(isCnpj("11144477735108")).toBe(true);
      expect(isCnpj("12345678000195")).toBe(true);
      expect(isCnpj("AEDD4S8V000192")).toBe(true);
      expect(isCnpj("CJ2JRCKT000105")).toBe(true);
    });

    it("deve retornar false para valores não-string", () => {
      expect(isCnpj(null)).toBe(false);
      expect(isCnpj(undefined)).toBe(false);
      expect(isCnpj(12345678909)).toBe(false);
      expect(isCnpj({})).toBe(false);
    });

    it("deve retornar false para CNPJs com dígito verificador incorreto ou formato inválido", () => {
      expect(isCnpj("12345678000100")).toBe(false); // dígitos corretos seriam 95
      expect(isCnpj("KM62G9G6000100")).toBe(false); // dígitos corretos seriam 86
      expect(isCnpj("72.C38.Z0W/0001-90")).toBe(false); // pontuação não é aceita
    });

    it("rejeita '00000000000000' — bug corrigido em cnpjVerify (blocklist de sequência repetida)", () => {
      expect(isCnpj("00000000000000")).toBe(false);
    });
  });

  describe("Decorator @IsCnpj em DTO", () => {
    it("deve passar na validação quando o CNPJ no DTO for válido", async () => {
      const dto = new UserDto();
      dto.cnpj = "11144477735108";

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it("deve falhar na validação com a mensagem customizada quando o CNPJ for inválido", async () => {
      const dto = new UserDto();
      dto.cnpj = "KM62G9G6000100";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty(IS_CNPJ);
      expect(errors[0]?.constraints?.[IS_CNPJ]).toBe(
        "CNPJ informado é inválido"
      );
    });

    it("deve usar a mensagem padrão quando validationOptions não for fornecido", async () => {
      const dto = new DefaultMessageDto();
      dto.cnpj = "12345678000100"; // inválido — dígitos corretos seriam 95

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints?.[IS_CNPJ]).toBe(
        "cnpj must be a valid CNPJ"
      );
    });

    it("deve falhar quando o campo for undefined ou null", async () => {
      const dto = new UserDto();
      dto.cnpj = undefined as unknown as string;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0]?.constraints).toHaveProperty(IS_CNPJ);
    });
  });
});
