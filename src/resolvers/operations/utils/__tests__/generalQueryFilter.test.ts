import "reflect-metadata";

import {
  MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT,
  START_DATE_AFTER_END_DATE,
} from "@/constants/constants";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { clearDecimal, decimalGreaterThan } from "@/utils/currencyUtil";
import { Between, ILike, LessThan, MoreThan } from "typeorm";
import { generalQueryFilter, GeneralFilter } from "@/resolvers/operations/utils/generalQueryFilter";

// ============================================================
// Mocks
// ============================================================
jest.mock("@/utils/currencyUtil");
jest.mock("typeorm", () => {
  const actual = jest.requireActual("typeorm");
  return {
    ...actual,
    ILike: jest.fn((value: string) => ({ _type: "ilike", value })),
    Between: jest.fn((a: unknown, b: unknown) => ({ _type: "between", a, b })),
    MoreThan: jest.fn((v: unknown) => ({ _type: "moreThan", v })),
    LessThan: jest.fn((v: unknown) => ({ _type: "lessThan", v })),
  };
});

const mockedClearDecimal = jest.mocked(clearDecimal);
const mockedDecimalGreaterThan = jest.mocked(decimalGreaterThan);
const mockedILike = jest.mocked(ILike);
const mockedBetween = jest.mocked(Between);
const mockedMoreThan = jest.mocked(MoreThan);
const mockedLessThan = jest.mocked(LessThan);

// ============================================================
// Setup
// ============================================================
beforeEach(() => {
  jest.clearAllMocks();
  // clearDecimal é identidade por padrão
  mockedClearDecimal.mockImplementation((v) => v);
  mockedDecimalGreaterThan.mockReturnValue(false);
});

// ============================================================
// generalQueryFilter
// ============================================================
describe("generalQueryFilter", () => {
  // ============================================================
  // Entrada vazia
  // ============================================================
  describe("entrada vazia", () => {
    it("retorna objeto vazio quando nenhum filtro é fornecido", () => {
      const result = generalQueryFilter({});

      expect(result).toEqual({});
    });

    it("não chama clearDecimal quando minAmount e maxAmount ausentes", () => {
      generalQueryFilter({});

      expect(mockedClearDecimal).not.toHaveBeenCalled();
    });

    it("não chama decimalGreaterThan quando só minAmount é fornecido", () => {
      generalQueryFilter({ minAmount: "10.00" });

      expect(mockedDecimalGreaterThan).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // tag
  // ============================================================
  describe("tag", () => {
    it("aplica ILike com %...% quando tag é fornecido", () => {
      generalQueryFilter({ tag: "aluguel" });

      expect(mockedILike).toHaveBeenCalledWith("%aluguel%");
    });

    it("não aplica tag quando vazio (falsy)", () => {
      const result = generalQueryFilter({ tag: "" });

      expect(mockedILike).not.toHaveBeenCalled();
      expect(result.tag).toBeUndefined();
    });

    it("não aplica tag quando undefined", () => {
      const result = generalQueryFilter({ tag: undefined });

      expect(mockedILike).not.toHaveBeenCalled();
      expect(result.tag).toBeUndefined();
    });
  });

  // ============================================================
  // typeOperation / local
  // ============================================================
  describe("typeOperation", () => {
    it("aplica typeOperation quando fornecido", () => {
      const result = generalQueryFilter({ typeOperation: OperationEnum.PIX });

      expect(result.typeOperation).toBe(OperationEnum.PIX);
    });

    it("não aplica typeOperation quando undefined", () => {
      const result = generalQueryFilter({});

      expect(result.typeOperation).toBeUndefined();
    });
  });

  describe("local", () => {
    it("aplica local quando fornecido", () => {
      const result = generalQueryFilter({ local: LocalEnum.INTERNAL });

      expect(result.local).toBe(LocalEnum.INTERNAL);
    });

    it("não aplica local quando undefined", () => {
      const result = generalQueryFilter({});

      expect(result.local).toBeUndefined();
    });
  });

  // ============================================================
  // Filtros de data
  // ============================================================
  describe("filtros de data", () => {
    it("aplica Between quando startDate e endDate são fornecidos", () => {
      generalQueryFilter({
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });

      expect(mockedBetween).toHaveBeenCalledWith(
        new Date("2026-01-01"),
        new Date("2026-01-31")
      );
    });

    it("aplica MoreThan quando só startDate é fornecido", () => {
      generalQueryFilter({ startDate: "2026-01-01" });

      expect(mockedMoreThan).toHaveBeenCalledWith(new Date("2026-01-01"));
    });

    it("aplica LessThan quando só endDate é fornecido", () => {
      generalQueryFilter({ endDate: "2026-01-31" });

      expect(mockedLessThan).toHaveBeenCalledWith(new Date("2026-01-31"));
    });

    it("não aplica filtro de data quando ambos ausentes", () => {
      const result = generalQueryFilter({});

      expect(mockedBetween).not.toHaveBeenCalled();
      expect(mockedMoreThan).not.toHaveBeenCalled();
      expect(mockedLessThan).not.toHaveBeenCalled();
      expect(result.createdAt).toBeUndefined();
    });

    it("não aplica filtro de data quando startDate é string vazia", () => {
      generalQueryFilter({ startDate: "" });

      expect(mockedMoreThan).not.toHaveBeenCalled();
      expect(mockedBetween).not.toHaveBeenCalled();
    });

    it("lança erro quando startDate é depois de endDate", () => {
      expect(() =>
        generalQueryFilter({
          startDate: "2026-02-01",
          endDate: "2026-01-01",
        })
      ).toThrow(START_DATE_AFTER_END_DATE);
    });

    it("aceita startDate igual a endDate (Between)", () => {
      expect(() =>
        generalQueryFilter({
          startDate: "2026-01-01",
          endDate: "2026-01-01",
        })
      ).not.toThrow();

      expect(mockedBetween).toHaveBeenCalledWith(
        new Date("2026-01-01"),
        new Date("2026-01-01")
      );
    });
  });

  // ============================================================
  // Filtros de valor
  // ============================================================
  describe("filtros de valor", () => {
    it("chama clearDecimal em minAmount e maxAmount", () => {
      generalQueryFilter({
        minAmount: "10,00",
        maxAmount: "100,00",
      });

      expect(mockedClearDecimal).toHaveBeenCalledWith("10,00");
      expect(mockedClearDecimal).toHaveBeenCalledWith("100,00");
      expect(mockedClearDecimal).toHaveBeenCalledTimes(2);
    });

    it("aplica Between quando minAmount e maxAmount são fornecidos", () => {
      generalQueryFilter({
        minAmount: "10.00",
        maxAmount: "100.00",
      });

      expect(mockedBetween).toHaveBeenCalledWith("10.00", "100.00");
    });

    it("aplica MoreThan quando só minAmount é fornecido", () => {
      generalQueryFilter({ minAmount: "10.00" });

      expect(mockedMoreThan).toHaveBeenCalledWith("10.00");
    });

    it("aplica LessThan quando só maxAmount é fornecido", () => {
      generalQueryFilter({ maxAmount: "100.00" });

      expect(mockedLessThan).toHaveBeenCalledWith("100.00");
    });

    it("não aplica filtro de valor quando ambos ausentes", () => {
      const result = generalQueryFilter({});

      expect(mockedBetween).not.toHaveBeenCalled();
      expect(mockedMoreThan).not.toHaveBeenCalled();
      expect(mockedLessThan).not.toHaveBeenCalled();
      expect(result.amount).toBeUndefined();
    });

    it("lança erro quando minAmount é maior que maxAmount", () => {
      mockedDecimalGreaterThan.mockReturnValue(true);

      expect(() =>
        generalQueryFilter({
          minAmount: "200.00",
          maxAmount: "100.00",
        })
      ).toThrow(MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT);
    });

    it("não lança erro quando minAmount é igual a maxAmount", () => {
      mockedDecimalGreaterThan.mockReturnValue(false);

      expect(() =>
        generalQueryFilter({
          minAmount: "100.00",
          maxAmount: "100.00",
        })
      ).not.toThrow();
    });

    it("chama decimalGreaterThan com valores limpos", () => {
      mockedClearDecimal
        .mockReturnValueOnce("200.00")
        .mockReturnValueOnce("100.00");
      mockedDecimalGreaterThan.mockReturnValue(true);

      expect(() =>
        generalQueryFilter({
          minAmount: "200,00",
          maxAmount: "100,00",
        })
      ).toThrow();

      expect(mockedDecimalGreaterThan).toHaveBeenCalledWith("200.00", "100.00");
    });
  });

  // ============================================================
  // Composição de filtros
  // ============================================================
  describe("composição de filtros", () => {
    it("aplica todos os filtros simultaneamente", () => {
      const result = generalQueryFilter({
        tag: "aluguel",
        typeOperation: OperationEnum.TRANSFER,
        local: LocalEnum.INTERNAL,
        startDate: "2026-01-01",
        endDate: "2026-01-31",
        minAmount: "10.00",
        maxAmount: "100.00",
      });

      const expected: GeneralFilter = {
        tag: expect.objectContaining({ _type: "ilike" }),
        typeOperation: OperationEnum.TRANSFER,
        local: LocalEnum.INTERNAL,
        createdAt: expect.objectContaining({ _type: "between" }),
        amount: expect.objectContaining({ _type: "between" }),
      };

      expect(result).toEqual(expected);
    });

    it("combina tag + typeOperation sem filtros de data/valor", () => {
      const result = generalQueryFilter({
        tag: "aluguel",
        typeOperation: OperationEnum.PIX,
      });

      expect(result.tag).toBeDefined();
      expect(result.typeOperation).toBe(OperationEnum.PIX);
      expect(result.createdAt).toBeUndefined();
      expect(result.amount).toBeUndefined();
      expect(result.local).toBeUndefined();
    });

    it("combina startDate + minAmount", () => {
      const result = generalQueryFilter({
        startDate: "2026-01-01",
        minAmount: "50.00",
      });

      expect(result.createdAt).toBeDefined();
      expect(result.amount).toBeDefined();
      expect(mockedMoreThan).toHaveBeenCalledWith(new Date("2026-01-01"));
      expect(mockedMoreThan).toHaveBeenCalledWith("50.00");
    });

    it("não inclui chaves com valor undefined no resultado", () => {
      const result = generalQueryFilter({});

      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  // ============================================================
  // Ordem de validação
  // ============================================================
  describe("ordem de validação", () => {
    it("lança START_DATE_AFTER_END_DATE antes de validar amount", () => {
      mockedDecimalGreaterThan.mockReturnValue(true);

      expect(() =>
        generalQueryFilter({
          startDate: "2026-02-01",
          endDate: "2026-01-01",
          minAmount: "200.00",
          maxAmount: "100.00",
        })
      ).toThrow(START_DATE_AFTER_END_DATE);

      // Não chegou a validar amount
      expect(mockedDecimalGreaterThan).not.toHaveBeenCalled();
    });

    it("lança MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT quando datas são válidas", () => {
      mockedDecimalGreaterThan.mockReturnValue(true);

      expect(() =>
        generalQueryFilter({
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          minAmount: "200.00",
          maxAmount: "100.00",
        })
      ).toThrow(MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT);
    });
  });
});
