import { Money } from "@/entities/Money";
import { toMoneyDto } from "@/resolvers/money/dto/toMoneyDto";

// Ajuste o caminho do import acima se o arquivo tiver outro nome/local.

function makeMoney(overrides: Partial<Money> = {}): Money {
  return {
    id: "money-1",
    userId: "user-1",
    tag: "aluguel",
    objective: "1000.00",
    description: "Reserva para o aluguel",
    balance: "250.00",
    createdAt: new Date("2026-01-15T10:00:00.000Z"),
    ...overrides,
  } as Money;
}

describe("toMoneyDto", () => {
  describe("caminho feliz", () => {
    it("mapeia todos os campos corretamente", () => {
      const money = makeMoney();

      const dto = toMoneyDto(money);

      expect(dto).toEqual({
        id: "money-1",
        userId: "user-1",
        tag: "aluguel",
        objective: "1000.00",
        description: "Reserva para o aluguel",
        balance: "250.00",
        createdAt: money.createdAt.toISOString(),
      });
    });

    it("retorna um novo objeto, não a mesma referência da entidade", () => {
      const money = makeMoney();

      const dto = toMoneyDto(money);

      expect(dto).not.toBe(money);
    });

    it("não modifica a entidade original", () => {
      const money = makeMoney();
      const snapshot = { ...money };

      toMoneyDto(money);

      expect(money).toEqual(snapshot);
    });
  });

  describe("campos opcionais (objective / description)", () => {
    it("repassa null quando objective é null, sem convertê-lo para undefined ou string vazia", () => {
      const money = makeMoney({ objective: null });

      const dto = toMoneyDto(money);

      expect(dto.objective).toBeNull();
    });

    it("repassa null quando description é null", () => {
      const money = makeMoney({ description: null });

      const dto = toMoneyDto(money);

      expect(dto.description).toBeNull();
    });

    it("repassa undefined quando objective é undefined (não força null)", () => {
      const money = makeMoney({ objective: undefined });

      const dto = toMoneyDto(money);

      expect(dto.objective).toBeUndefined();
    });
  });

  describe("createdAt", () => {
    it("converte createdAt para string", () => {
      const createdAt = new Date("2025-06-01T00:00:00.000Z");
      const money = makeMoney({ createdAt });

      const dto = toMoneyDto(money);

      expect(dto.createdAt).toBe(createdAt.toISOString());
    });
  });

  describe("campos não mapeados", () => {
    it("não repassa propriedades da entidade que não fazem parte do MoneyDto", () => {
      const money = {
        ...makeMoney(),
        cartorioId: "cartorio-1",
        updatedAt: new Date(),
      } as unknown as Money;

      const dto = toMoneyDto(money);

      expect(dto).not.toHaveProperty("cartorioId");
      expect(dto).not.toHaveProperty("updatedAt");
    });
  });

  describe("chamadas independentes", () => {
    it("não compartilha estado entre chamadas com entidades diferentes", () => {
      const money1 = makeMoney({ id: "money-1", tag: "aluguel" });
      const money2 = makeMoney({ id: "money-2", tag: "mercado" });

      const dto1 = toMoneyDto(money1);
      const dto2 = toMoneyDto(money2);

      expect(dto1.id).toBe("money-1");
      expect(dto1.tag).toBe("aluguel");
      expect(dto2.id).toBe("money-2");
      expect(dto2.tag).toBe("mercado");
    });
  });
});
