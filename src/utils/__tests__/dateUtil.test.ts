import { MonthEnum } from "@/enums/MonthEnum";
import { isValidMonthAndDay } from "@/utils/dateUtil";

describe("isValidMonthAndDay", () => {
  // ============================================================
  // Fevereiro
  // ============================================================
  describe("Fevereiro", () => {
    it("deve retornar true para dias de 1 a 29", () => {
      for (let day = 1; day <= 29; day++) {
        expect(isValidMonthAndDay(MonthEnum.FEBRUARY, day)).toBe(true);
      }
    });

    it("deve retornar false para dias maiores que 29", () => {
      for (let day = 30; day <= 31; day++) {
        expect(isValidMonthAndDay(MonthEnum.FEBRUARY, day)).toBe(false);
      }
    });

    it("deve retornar false para dia 0", () => {
      expect(isValidMonthAndDay(MonthEnum.FEBRUARY, 0)).toBe(false);
    });

    it("deve retornar false para dia negativo", () => {
      expect(isValidMonthAndDay(MonthEnum.FEBRUARY, -5)).toBe(false);
    });
  });

  // ============================================================
  // Meses com 30 dias
  // ============================================================
  describe("Meses com 30 dias", () => {
    const monthsWith30Days = [
      MonthEnum.APRIL,
      MonthEnum.JUNE,
      MonthEnum.SEPTEMBER,
      MonthEnum.NOVEMBER,
    ];

    it.each(monthsWith30Days)(
      "deve retornar true para dias de 1 a 30 (%s)",
      (month) => {
        for (let day = 1; day <= 30; day++) {
          expect(isValidMonthAndDay(month, day)).toBe(true);
        }
      }
    );

    it.each(monthsWith30Days)(
      "deve retornar false para dia 31 (%s)",
      (month) => {
        expect(isValidMonthAndDay(month, 31)).toBe(false);
      }
    );

    it.each(monthsWith30Days)(
      "deve retornar false para dia 32 (%s)",
      (month) => {
        expect(isValidMonthAndDay(month, 32)).toBe(false);
      }
    );

    it.each(monthsWith30Days)(
      "deve retornar false para dia 0 (%s)",
      (month) => {
        expect(isValidMonthAndDay(month, 0)).toBe(false);
      }
    );
  });

  // ============================================================
  // Meses com 31 dias
  // ============================================================
  describe("Meses com 31 dias", () => {
    const monthsWith31Days = [
      MonthEnum.JANUARY,
      MonthEnum.MARCH,
      MonthEnum.MAY,
      MonthEnum.JULY,
      MonthEnum.AUGUST,
      MonthEnum.OCTOBER,
      MonthEnum.DECEMBER,
    ];

    it.each(monthsWith31Days)(
      "deve retornar true para dias de 1 a 31 (%s)",
      (month) => {
        for (let day = 1; day <= 31; day++) {
          expect(isValidMonthAndDay(month, day)).toBe(true);
        }
      }
    );

    it.each(monthsWith31Days)(
      "deve retornar false para dia 32 (%s)",
      (month) => {
        expect(isValidMonthAndDay(month, 32)).toBe(false);
      }
    );

    it.each(monthsWith31Days)(
      "deve retornar false para dia 0 (%s)",
      (month) => {
        expect(isValidMonthAndDay(month, 0)).toBe(false);
      }
    );
  });

  // ============================================================
  // Casos específicos
  // ============================================================
  describe("casos específicos", () => {
    it("deve retornar true para 29 de fevereiro", () => {
      expect(isValidMonthAndDay(MonthEnum.FEBRUARY, 29)).toBe(true);
    });

    it("deve retornar false para 30 de fevereiro", () => {
      expect(isValidMonthAndDay(MonthEnum.FEBRUARY, 30)).toBe(false);
    });

    it("deve retornar true para 31 de janeiro", () => {
      expect(isValidMonthAndDay(MonthEnum.JANUARY, 31)).toBe(true);
    });

    it("deve retornar false para 31 de abril", () => {
      expect(isValidMonthAndDay(MonthEnum.APRIL, 31)).toBe(false);
    });

    it("deve retornar true para 30 de abril", () => {
      expect(isValidMonthAndDay(MonthEnum.APRIL, 30)).toBe(true);
    });

    it("deve retornar true para 31 de março", () => {
      expect(isValidMonthAndDay(MonthEnum.MARCH, 31)).toBe(true);
    });
  });
});
