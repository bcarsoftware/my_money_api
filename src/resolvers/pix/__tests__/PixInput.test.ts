import "reflect-metadata";

import { PixEnum } from "@/enums/PixEnum";
import {
  CreatePixInput,
  ListPixInput,
  UpdatePixInput,
} from "@/resolvers/pix/PixInput";
import { validate } from "class-validator";

describe("Pix Inputs Validation", () => {
  // --------------------------------------------
  // CreatePixInput
  // --------------------------------------------
  describe("CreatePixInput", () => {
    it("deve validar com dados corretos", async () => {
      const input = new CreatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "Pix para emergências";
      input.description = "Conta de luz";
      input.typeKey = PixEnum.CPF;
      input.key = "12345678909";

      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar quando bankId não é UUID", async () => {
      const input = new CreatePixInput();
      input.bankId = "invalid-uuid" as unknown as string;
      input.tag = "tag";
      input.typeKey = PixEnum.CPF;
      input.key = "12345678909";

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("bankId");
      expect(errors[0]!.constraints).toHaveProperty("isUuid");
    });

    it("deve falhar quando tag excede 64 caracteres", async () => {
      const input = new CreatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "a".repeat(65);
      input.typeKey = PixEnum.CPF;
      input.key = "12345678909";

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("tag");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve falhar quando description excede 256 caracteres", async () => {
      const input = new CreatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "tag";
      input.description = "a".repeat(257);
      input.typeKey = PixEnum.CPF;
      input.key = "12345678909";

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("description");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve aceitar description null ou undefined (opcional)", async () => {
      // Teste com null
      const inputNull = new CreatePixInput();
      inputNull.bankId = "550e8400-e29b-41d4-a716-446655440000";
      inputNull.tag = "tag";
      inputNull.description = null;
      inputNull.typeKey = PixEnum.CPF;
      inputNull.key = "12345678909";

      let errors = await validate(inputNull);
      expect(errors).toHaveLength(0);

      // Teste com undefined
      const inputUndefined = new CreatePixInput();
      inputUndefined.bankId = "550e8400-e29b-41d4-a716-446655440000";
      inputUndefined.tag = "tag";
      inputUndefined.typeKey = PixEnum.CPF;
      inputUndefined.key = "12345678909";

      errors = await validate(inputUndefined);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar quando typeKey não é um valor válido do enum", async () => {
      const input = new CreatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "tag";
      input.typeKey = "INVALID_TYPE" as unknown as PixEnum;
      input.key = "12345678909";

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("typeKey");
      expect(errors[0]!.constraints).toHaveProperty("isEnum");
    });

    it("deve falhar quando key excede 512 caracteres", async () => {
      const input = new CreatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "tag";
      input.typeKey = PixEnum.CPF;
      input.key = "a".repeat(513);

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("key");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve aceitar todos os valores do enum PixEnum", async () => {
      for (const tipo of Object.values(PixEnum)) {
        const input = new CreatePixInput();
        input.bankId = "550e8400-e29b-41d4-a716-446655440000";
        input.tag = "tag";
        input.typeKey = tipo;
        input.key = "12345678909";

        const errors = await validate(input);
        expect(errors).toHaveLength(0);
      }
    });
  });

  // --------------------------------------------
  // ListPixInput
  // --------------------------------------------
  describe("ListPixInput", () => {
    it("deve validar com todos os campos opcionais omitidos", async () => {
      const input = new ListPixInput();
      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });

    it("deve validar com valores corretos", async () => {
      const input = new ListPixInput();
      input.limit = 10;
      input.offset = 0;
      input.tag = "pix";
      input.typeKey = PixEnum.CPF;

      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar quando limit não é inteiro", async () => {
      const input = new ListPixInput();
      input.limit = 10.5 as unknown as number;

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("limit");
      expect(errors[0]!.constraints).toHaveProperty("isInt");
    });

    it("deve falhar quando offset não é inteiro", async () => {
      const input = new ListPixInput();
      input.offset = 1.5 as unknown as number;

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("offset");
      expect(errors[0]!.constraints).toHaveProperty("isInt");
    });

    it("deve falhar quando tag excede 64 caracteres", async () => {
      const input = new ListPixInput();
      input.tag = "a".repeat(65);

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("tag");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve falhar quando typeKey não é um valor válido do enum", async () => {
      const input = new ListPixInput();
      input.typeKey = "INVALID" as unknown as PixEnum;

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("typeKey");
      expect(errors[0]!.constraints).toHaveProperty("isEnum");
    });

    it("deve aceitar tag null", async () => {
      const input = new ListPixInput();
      input.tag = null;

      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });
  });

  // --------------------------------------------
  // UpdatePixInput
  // --------------------------------------------
  describe("UpdatePixInput", () => {
    it("deve validar com todos os campos opcionais omitidos", async () => {
      const input = new UpdatePixInput();
      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });

    it("deve validar com valores corretos", async () => {
      const input = new UpdatePixInput();
      input.bankId = "550e8400-e29b-41d4-a716-446655440000";
      input.tag = "tag atualizada";
      input.description = "Nova descrição";
      input.typeKey = PixEnum.EMAIL;
      input.key = "email@example.com";

      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar quando bankId não é UUID", async () => {
      const input = new UpdatePixInput();
      input.bankId = "invalid-uuid" as unknown as string;

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("bankId");
      expect(errors[0]!.constraints).toHaveProperty("isUuid");
    });

    it("deve falhar quando tag excede 64 caracteres", async () => {
      const input = new UpdatePixInput();
      input.tag = "a".repeat(65);

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("tag");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve falhar quando description excede 256 caracteres", async () => {
      const input = new UpdatePixInput();
      input.description = "a".repeat(257);

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("description");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve aceitar description null ou undefined", async () => {
      // null
      const inputNull = new UpdatePixInput();
      inputNull.description = null;
      let errors = await validate(inputNull);
      expect(errors).toHaveLength(0);

      // undefined
      const inputUndefined = new UpdatePixInput();
      // não setar description
      errors = await validate(inputUndefined);
      expect(errors).toHaveLength(0);
    });

    it("deve falhar quando typeKey não é um valor válido do enum", async () => {
      const input = new UpdatePixInput();
      input.typeKey = "INVALID" as unknown as PixEnum;

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("typeKey");
      expect(errors[0]!.constraints).toHaveProperty("isEnum");
    });

    it("deve falhar quando key excede 512 caracteres", async () => {
      const input = new UpdatePixInput();
      input.key = "a".repeat(513);

      const errors = await validate(input);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]!.property).toBe("key");
      expect(errors[0]!.constraints).toHaveProperty("maxLength");
    });

    it("deve aceitar valores parciais (apenas um campo)", async () => {
      const input = new UpdatePixInput();
      input.tag = "só tag";

      const errors = await validate(input);
      expect(errors).toHaveLength(0);
    });
  });
});
