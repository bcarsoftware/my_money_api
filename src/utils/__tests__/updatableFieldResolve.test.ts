import { updatableFieldResolve } from "@/utils/updatableFieldResolve";

describe("updatableFieldResolve", () => {
  it("retorna null quando newValue é null (limpeza explícita)", () => {
    const result = updatableFieldResolve(null, "valor atual");
    expect(result).toBeNull();
  });

  it("retorna newValue quando é truthy e diferente de currentValue", () => {
    const result = updatableFieldResolve("novo valor", "valor atual");
    expect(result).toBe("novo valor");
  });

  it("retorna currentValue quando newValue é undefined (campo omitido)", () => {
    const current = "valor atual";
    const result = updatableFieldResolve(undefined, current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é igual a currentValue", () => {
    const current = "mesmo valor";
    const result = updatableFieldResolve("mesmo valor", current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é uma string vazia (falsy)", () => {
    const current = "valor atual";
    const result = updatableFieldResolve("", current);
    expect(result).toBe(current);
  });

  it("retorna currentValue quando newValue é 0 (falsy) e currentValue é um número", () => {
    const current = 42;
    const result = updatableFieldResolve(0, current);
    expect(result).toBe(current);
  });

  it("retorna newValue quando newValue é um número truthy diferente", () => {
    const result = updatableFieldResolve(100, 50);
    expect(result).toBe(100);
  });

  it("retorna currentValue quando newValue é false (falsy) e currentValue é booleano", () => {
    const current = true;
    const result = updatableFieldResolve(false, current);
    expect(result).toBe(current);
  });

  it("retorna newValue quando newValue é true (truthy) e diferente", () => {
    const result = updatableFieldResolve(true, false);
    expect(result).toBe(true);
  });

  it("lida corretamente com currentValue null e newValue truthy", () => {
    const result = updatableFieldResolve("novo", null);
    expect(result).toBe("novo");
  });

  it("lida corretamente com currentValue undefined e newValue truthy", () => {
    const result = updatableFieldResolve("novo", undefined);
    expect(result).toBe("novo");
  });

  it("mantém currentValue quando newValue é undefined e currentValue é null", () => {
    const result = updatableFieldResolve(undefined, null);
    expect(result).toBeNull();
  });

  it("mantém currentValue quando newValue é undefined e currentValue é undefined", () => {
    const result = updatableFieldResolve(undefined, undefined);
    expect(result).toBeUndefined();
  });
});
