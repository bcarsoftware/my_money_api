import { isUUID } from "class-validator";
import { randomUUID } from "@/utils/randomUUID";

describe("randomUUID — integração (sem mocks)", () => {
  describe("v1", () => {
    it("deve retornar um UUID v1 válido", () => {
      const value = randomUUID(1);

      expect(isUUID(value, "1")).toBe(true);
    });

    it("deve retornar valores diferentes em chamadas consecutivas", () => {
      const a = randomUUID(1);
      const b = randomUUID(1);

      expect(a).not.toBe(b);
    });
  });

  describe("v4", () => {
    it("deve retornar um UUID v4 válido", () => {
      const value = randomUUID(4);

      expect(isUUID(value, "4")).toBe(true);
    });

    it("deve retornar valores diferentes em chamadas consecutivas", () => {
      const a = randomUUID(4);
      const b = randomUUID(4);

      expect(a).not.toBe(b);
    });
  });

  describe("v7", () => {
    it("deve retornar um UUID v7 válido", () => {
      const value = randomUUID(7);

      expect(isUUID(value, "7")).toBe(true);
    });

    it("deve retornar valores diferentes em chamadas consecutivas", () => {
      const a = randomUUID(7);
      const b = randomUUID(7);

      expect(a).not.toBe(b);
    });
  });

  describe("valores inválidos", () => {
    it("deve lançar erro para version fora do enum", () => {
      expect(() => randomUUID(2 as 1 | 4 | 7)).toThrow(
        "Unsupported UUID version: 2"
      );
    });
  });
});
