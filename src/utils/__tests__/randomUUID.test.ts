import { randomUUID } from "@/utils/randomUUID";

jest.mock("uuid", () => ({
  v1: jest.fn(),
  v4: jest.fn(),
  v7: jest.fn(),
}));

// Como o módulo está mockado, pegamos a referência dos mocks via `requireMock`.
// A função só precisa de `.toString()` no retorno, então aceitamos `string`.
const {
  v1: mockedUuidv1,
  v4: mockedUuidv4,
  v7: mockedUuidv7,
} = jest.requireMock("uuid") as {
  v1: jest.Mock<string, []>;
  v4: jest.Mock<string, []>;
  v7: jest.Mock<string, []>;
};

describe("randomUUID", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUuidv1.mockReturnValue("11111111-1111-1111-1111-111111111111");
    mockedUuidv4.mockReturnValue("44444444-4444-4444-4444-444444444444");
    mockedUuidv7.mockReturnValue("77777777-7777-7777-7777-777777777777");
  });

  // ============================================================
  // Roteamento por versão
  // ============================================================
  describe("roteamento por versão", () => {
    it("deve chamar uuidv1 e retornar seu valor quando version = 1", () => {
      const result = randomUUID(1);

      expect(mockedUuidv1).toHaveBeenCalledTimes(1);
      expect(mockedUuidv4).not.toHaveBeenCalled();
      expect(mockedUuidv7).not.toHaveBeenCalled();
      expect(result).toBe("11111111-1111-1111-1111-111111111111");
    });

    it("deve chamar uuidv4 e retornar seu valor quando version = 4", () => {
      const result = randomUUID(4);

      expect(mockedUuidv4).toHaveBeenCalledTimes(1);
      expect(mockedUuidv1).not.toHaveBeenCalled();
      expect(mockedUuidv7).not.toHaveBeenCalled();
      expect(result).toBe("44444444-4444-4444-4444-444444444444");
    });

    it("deve chamar uuidv7 e retornar seu valor quando version = 7", () => {
      const result = randomUUID(7);

      expect(mockedUuidv7).toHaveBeenCalledTimes(1);
      expect(mockedUuidv1).not.toHaveBeenCalled();
      expect(mockedUuidv4).not.toHaveBeenCalled();
      expect(result).toBe("77777777-7777-7777-7777-777777777777");
    });
  });

  // ============================================================
  // Valor de retorno
  // ============================================================
  describe("valor de retorno", () => {
    it.each([1, 4, 7] as const)(
      "deve retornar o valor bruto da função da lib para version = %s",
      (version) => {
        const libValue = `uuid-lib-${version}`;
        if (version === 1) mockedUuidv1.mockReturnValueOnce(libValue);
        if (version === 4) mockedUuidv4.mockReturnValueOnce(libValue);
        if (version === 7) mockedUuidv7.mockReturnValueOnce(libValue);

        expect(randomUUID(version)).toBe(libValue);
      }
    );

    it("deve retornar sempre uma string", () => {
      expect(typeof randomUUID(1)).toBe("string");
      expect(typeof randomUUID(4)).toBe("string");
      expect(typeof randomUUID(7)).toBe("string");
    });

    it("deve retornar string não vazia", () => {
      const result = randomUUID(4);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Conversão para string
  // ============================================================
  describe("conversão para string", () => {
    it("deve aplicar toString() no retorno da lib (caso Uint8Array)", () => {
      // Simula o retorno Uint8Array que a lib pode dar por overload.
      const bytes = new TextEncoder().encode(
        "77777777-7777-7777-7777-777777777777"
      );
      mockedUuidv7.mockReturnValueOnce(bytes as unknown as string);

      const result = randomUUID(7);

      // `Uint8Array.prototype.toString()` junta os bytes em uma string separada por vírgulas.
      // O importante é que o componente não devolva o Uint8Array cru.
      expect(result).toBe(bytes.toString());
      expect(result).not.toBe(bytes);
    });
  });

  // ============================================================
  // Valores inválidos
  // ============================================================
  describe("valores inválidos", () => {
    it.each([0, 2, 3, 5, 6, 8, 9, 10, -1])(
      "deve lançar erro para version = %s (fora do enum suportado)",
      (version) => {
        expect(() => randomUUID(version as 1 | 4 | 7)).toThrow(
          `Unsupported UUID version: ${version}`
        );
      }
    );

    it("não deve chamar nenhuma função da lib quando o version é inválido", () => {
      expect(() => randomUUID(2 as 1 | 4 | 7)).toThrow();

      expect(mockedUuidv1).not.toHaveBeenCalled();
      expect(mockedUuidv4).not.toHaveBeenCalled();
      expect(mockedUuidv7).not.toHaveBeenCalled();
    });

    it("deve lançar erro com a mensagem exata incluindo a versão inválida", () => {
      expect(() => randomUUID(99 as 1 | 4 | 7)).toThrow(
        "Unsupported UUID version: 99"
      );
    });
  });

  // ============================================================
  // Unicidade a cada chamada
  // ============================================================
  describe("unicidade a cada chamada", () => {
    it("deve retornar valores diferentes em duas chamadas consecutivas para v1", () => {
      mockedUuidv1
        .mockReturnValueOnce("11111111-1111-1111-1111-111111111111")
        .mockReturnValueOnce("11111111-2222-2222-2222-222222222222");

      const value1 = randomUUID(1);
      const value2 = randomUUID(1);

      expect(value1).not.toBe(value2);
    });

    it("deve retornar valores diferentes em duas chamadas consecutivas para v4", () => {
      mockedUuidv4
        .mockReturnValueOnce("44444444-1111-1111-1111-111111111111")
        .mockReturnValueOnce("44444444-2222-2222-2222-222222222222");

      const value1 = randomUUID(4);
      const value2 = randomUUID(4);

      expect(value1).not.toBe(value2);
    });

    it("deve retornar valores diferentes em duas chamadas consecutivas para v7", () => {
      mockedUuidv7
        .mockReturnValueOnce("77777777-1111-1111-1111-111111111111")
        .mockReturnValueOnce("77777777-2222-2222-2222-222222222222");

      const value1 = randomUUID(7);
      const value2 = randomUUID(7);

      expect(value1).not.toBe(value2);
    });
  });
});
