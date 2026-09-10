import { updatableFieldResolver } from "@/utils/updatableFieldResolverr";

describe("updatableFieldResolver", () => {
  it("retorna null quando newValue é null (limpeza explícita)", () => {
    const result = updatableFieldResolver(null, "valor atual");
    expect(result).toBeNull();
  });

  it("retorna newValue quando é truthy e diferente de currentValue", () => {
    const result = updatableFieldResolver("novo valor", "valor atual");
    expect(result).toBe("novo valor");
  });

  it("retorna currentValue quando newValue é undefined (campo omitido)", () => {
    const current = "valor atual";
    const result = updatableFieldResolver(undefined, current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é igual a currentValue", () => {
    const current = "mesmo valor";
    const result = updatableFieldResolver("mesmo valor", current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é uma string vazia (falsy)", () => {
    const current = "valor atual";
    const result = updatableFieldResolver("", current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é 0 (falsy) e currentValue é um número", () => {
    const current = 42;
    const result = updatableFieldResolver(0, current);
    expect(result).toBe(current);
  });

  it("retorna newValue quando newValue é um número truthy diferente", () => {
    const result = updatableFieldResolver(100, 50);
    expect(result).toBe(100);
  });

  it("retorna currentValue quando newValue é false (falsy) e currentValue é booleano", () => {
    const current = true;
    const result = updatableFieldResolver(false, current);
    expect(result).toBe(current);
  });

  it("retorna newValue quando newValue é true (truthy) e diferente", () => {
    const result = updatableFieldResolver(true, false);
    expect(result).toBe(true);
  });

  it("lida corretamente com currentValue null e newValue truthy", () => {
    const result = updatableFieldResolver("novo", null);
    expect(result).toBe("novo");
  });

  it("lida corretamente com currentValue undefined e newValue truthy", () => {
    const result = updatableFieldResolver("novo", undefined);
    expect(result).toBe("novo");
  });

  it("mantém currentValue quando newValue é undefined e currentValue é null", () => {
    const result = updatableFieldResolver(undefined, null);
    expect(result).toBeNull();
  });

  it("mantém currentValue quando newValue é undefined e currentValue é undefined", () => {
    const result = updatableFieldResolver(undefined, undefined);
    expect(result).toBeUndefined();
  });
});
