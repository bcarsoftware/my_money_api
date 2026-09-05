import {
  CreateMoneyInput,
  ListMoneyInput,
  UpdateMoneyInput,
} from "@/resolvers/money/MoneyInputs";
import { validate, ValidationError } from "class-validator";
import "reflect-metadata";

async function validateInput<T extends object>(
  Ctor: new () => T,
  plain: Partial<T>
): Promise<ValidationError[]> {
  const instance = Object.assign(new Ctor(), plain);
  return validate(instance);
}

function constraintsFor(errors: ValidationError[], property: string): string[] {
  const error = errors.find((e) => e.property === property);
  return error?.constraints ? Object.keys(error.constraints) : [];
}

describe("CreateMoneyInput", () => {
  // userId NÃO faz parte do CreateMoneyInput – é injetado pelo contexto
  const validPayload = {
    tag: "aluguel",
    balance: "100.00",
  };

  describe("caminho feliz", () => {
    it("não retorna erros com os campos obrigatórios válidos", async () => {
      const errors = await validateInput(CreateMoneyInput, validPayload);
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos, incluindo os opcionais", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        objective: "1,000.00",
        description: "Reserva para o aluguel",
      });
      expect(errors).toHaveLength(0);
    });
  });

  // ====== userId removido – não existe em CreateMoneyInput ======

  describe("tag", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("[comportamento a confirmar] aceita string vazia — não há MinLength/IsNotEmpty, só MaxLength", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        tag: "",
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita quando ausente (campo obrigatório) — MaxLength também falha em undefined", async () => {
      const { tag: _tag, ...rest } = validPayload;
      const errors = await validateInput(CreateMoneyInput, rest);
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });
  });

  describe("balance", () => {
    it("rejeita balance negativo", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        balance: "-100.00",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it.each(["100.00", "0.00", "1,234.56", "-50.00", "100"])(
      "aceita formato de moeda válido: %s",
      async (value) => {
        const errors = await validateInput(CreateMoneyInput, {
          ...validPayload,
          balance: value,
        });
        expect(constraintsFor(errors, "balance")).toHaveLength(0);
      }
    );

    it.each(["não é um número", "", "100.5", "100.000"])(
      "rejeita formato de moeda inválido: %s",
      async (value) => {
        const errors = await validateInput(CreateMoneyInput, {
          ...validPayload,
          balance: value,
        });
        expect(constraintsFor(errors, "balance")).toContain("isCurrency");
      }
    );

    it("[comportamento a confirmar] rejeita formato brasileiro de moeda (ponto como milhar, vírgula como decimal)", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        balance: "1.234,56",
      });
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });

    it("rejeita quando ausente (campo obrigatório)", async () => {
      const { balance: _balance, ...rest } = validPayload;
      const errors = await validateInput(CreateMoneyInput, rest);
      expect(constraintsFor(errors, "balance")).toContain("isCurrency");
    });
  });

  describe("objective (opcional)", () => {
    it("é opcional - rejeita objective negativo", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        objective: "-100.00",
      });
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("é opcional — ausência não gera erro", async () => {
      const errors = await validateInput(CreateMoneyInput, validPayload);
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        objective: null,
      });
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });

    it("rejeita formato de moeda inválido quando informado", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        objective: "inválido",
      });
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });
  });

  describe("description (opcional)", () => {
    it("aceita exatamente 256 caracteres (limite)", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        description: "a".repeat(256),
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });

    it("rejeita 257 caracteres (acima do limite)", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        description: "a".repeat(257),
      });
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        ...validPayload,
        description: null,
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros independentes de campos diferentes", async () => {
      const errors = await validateInput(CreateMoneyInput, {
        tag: "a".repeat(65),
        balance: "não é moeda",
        objective: "também inválido",
      });

      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["balance", "objective", "tag"].sort());
    });
  });
});

describe("ListMoneyInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto totalmente vazio (todos os campos são opcionais)", async () => {
      const errors = await validateInput(ListMoneyInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos preenchidos corretamente", async () => {
      const errors = await validateInput(ListMoneyInput, {
        limit: 20,
        offset: 0,
        tag: "aluguel",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("limit", () => {
    it("rejeita valor não-inteiro (float)", async () => {
      const errors = await validateInput(ListMoneyInput, { limit: 10.5 });
      expect(constraintsFor(errors, "limit")).toContain("isInt");
    });

    it("rejeita valor negativo (há @Min(0))", async () => {
      const errors = await validateInput(ListMoneyInput, { limit: -5 });
      expect(constraintsFor(errors, "limit")).toContain("min");
    });

    it("aceita 0", async () => {
      const errors = await validateInput(ListMoneyInput, { limit: 0 });
      expect(constraintsFor(errors, "limit")).toHaveLength(0);
    });
  });

  describe("offset", () => {
    it("aceita undefined (ou omitido)", async () => {
      const errors = await validateInput(ListMoneyInput, { offset: undefined });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });

    it("rejeita valor não-inteiro (float)", async () => {
      const errors = await validateInput(ListMoneyInput, { offset: 1.1 });
      expect(constraintsFor(errors, "offset")).toContain("isInt");
    });

    it("rejeita valor negativo (há @Min(0))", async () => {
      const errors = await validateInput(ListMoneyInput, { offset: -1 });
      expect(constraintsFor(errors, "offset")).toContain("min");
    });

    it("aceita 0", async () => {
      const errors = await validateInput(ListMoneyInput, { offset: 0 });
      expect(constraintsFor(errors, "offset")).toHaveLength(0);
    });
  });

  describe("tag", () => {
    it("aceita exatamente 64 caracteres (limite)", async () => {
      const errors = await validateInput(ListMoneyInput, {
        tag: "a".repeat(64),
      });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });

    it("rejeita 65 caracteres (acima do limite)", async () => {
      const errors = await validateInput(ListMoneyInput, {
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(ListMoneyInput, { tag: null });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });
});

describe("UpdateMoneyInput", () => {
  describe("caminho feliz", () => {
    it("não retorna erros com objeto totalmente vazio (todos os campos são opcionais)", async () => {
      const errors = await validateInput(UpdateMoneyInput, {});
      expect(errors).toHaveLength(0);
    });

    it("não retorna erros com todos os campos preenchidos corretamente", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        tag: "novo-nome",
        objective: "500.00",
        description: "Atualizado",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("tag", () => {
    it("rejeita acima de 64 caracteres", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        tag: "a".repeat(65),
      });
      expect(constraintsFor(errors, "tag")).toContain("maxLength");
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(UpdateMoneyInput, { tag: null });
      expect(constraintsFor(errors, "tag")).toHaveLength(0);
    });
  });

  describe("objective", () => {
    it("rejeita objective negativo", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        objective: "-100.00",
      });
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("rejeita formato de moeda inválido quando informado", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        objective: "abc",
      });
      expect(constraintsFor(errors, "objective")).toContain("isCurrency");
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        objective: null,
      });
      expect(constraintsFor(errors, "objective")).toHaveLength(0);
    });
  });

  describe("description", () => {
    it("rejeita acima de 256 caracteres", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        description: "a".repeat(257),
      });
      expect(constraintsFor(errors, "description")).toContain("maxLength");
    });

    it("aceita null explicitamente", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        description: null,
      });
      expect(constraintsFor(errors, "description")).toHaveLength(0);
    });
  });

  describe("múltiplos erros simultâneos", () => {
    it("acumula erros independentes de campos diferentes sem interferência cruzada", async () => {
      const errors = await validateInput(UpdateMoneyInput, {
        tag: "a".repeat(65),
        objective: "inválido",
        description: "a".repeat(300),
      });

      const properties = errors.map((e) => e.property).sort();
      expect(properties).toEqual(["description", "objective", "tag"].sort());
    });
  });
});
