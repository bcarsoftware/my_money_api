import { MonthEnum } from "@/enums/MonthEnum";

export const isValidMonthAndDay = (month: MonthEnum, day: number): boolean => {
  if (month === MonthEnum.FEBRUARY && day > 29) return false;

  const monthsWith30Days = [
    MonthEnum.APRIL,
    MonthEnum.JUNE,
    MonthEnum.SEPTEMBER,
    MonthEnum.NOVEMBER,
  ];

  if (monthsWith30Days.includes(month) && day > 30) return false;

  const monthsWith31Days = [
    MonthEnum.JANUARY,
    MonthEnum.MARCH,
    MonthEnum.MAY,
    MonthEnum.JULY,
    MonthEnum.AUGUST,
    MonthEnum.OCTOBER,
    MonthEnum.DECEMBER,
  ];

  if (monthsWith31Days.includes(month) && day > 31) return false;

  return true;
};
