import {
  MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT,
  START_DATE_AFTER_END_DATE,
} from "@/constants/constants";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { clearDecimal, decimalGreaterThan } from "@/utils/currencyUtil";
import { Between, FindOperator, ILike, LessThan, MoreThan } from "typeorm";

interface AmountFilter {
  amount?: FindOperator<string> | undefined;
}

interface CreateAtFilter {
  createdAt?: FindOperator<Date> | undefined;
}

function getFilterDate(
  startDate?: Date,
  endDate?: Date
): CreateAtFilter | undefined {
  const isStartDateDefined = !!startDate;
  const isEndDateDefined = !!endDate;

  switch (true) {
    case isStartDateDefined && isEndDateDefined:
      return { createdAt: Between(startDate, endDate) };
    case isStartDateDefined:
      return { createdAt: MoreThan(startDate) };
    case isEndDateDefined:
      return { createdAt: LessThan(endDate) };
  }

  return undefined;
}

function getFilterAmount(
  minAmount?: string,
  maxAmount?: string
): AmountFilter | undefined {
  const isMinAmountDefined = !!minAmount;
  const isMaxAmountDefined = !!maxAmount;

  switch (true) {
    case isMinAmountDefined && isMaxAmountDefined:
      return { amount: Between(minAmount, maxAmount) };
    case isMinAmountDefined:
      return { amount: MoreThan(minAmount) };
    case isMaxAmountDefined:
      return { amount: LessThan(maxAmount) };
  }

  return undefined;
}

export interface GeneralInput {
  tag?: string | FindOperator<string>;
  typeOperation?: OperationEnum;
  local?: LocalEnum;

  startDate?: string;
  endDate?: string;

  minAmount?: string;
  maxAmount?: string;
}

export interface GeneralFilter {
  amount?: FindOperator<string> | undefined;
  createdAt?: FindOperator<Date> | undefined;
  local?: LocalEnum | undefined;
  typeOperation?: OperationEnum | undefined;
  tag?: FindOperator<string> | undefined;
}

export function generalQueryFilter(input: GeneralInput): GeneralFilter {
  const startDate = input.startDate ? new Date(input.startDate) : undefined;
  const endDate = input.endDate ? new Date(input.endDate) : undefined;

  if (startDate && endDate && startDate > endDate)
    throw new Error(START_DATE_AFTER_END_DATE);

  const minAmount = input.minAmount ? clearDecimal(input.minAmount) : undefined;
  const maxAmount = input.maxAmount ? clearDecimal(input.maxAmount) : undefined;

  if (minAmount && maxAmount && decimalGreaterThan(minAmount, maxAmount))
    throw new Error(MIN_AMOUNT_GREATER_THAN_MAX_AMOUNT);

  const dateFilter = getFilterDate(startDate, endDate);
  const amountFilter = getFilterAmount(minAmount, maxAmount);

  return {
    ...(input.tag && { tag: ILike(`%${input.tag}%`) }),
    ...(input.typeOperation && { typeOperation: input.typeOperation }),
    ...(input.local && { local: input.local }),
    ...(dateFilter && dateFilter),
    ...(amountFilter && amountFilter),
  };
}
