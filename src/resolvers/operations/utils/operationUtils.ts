import { isCurrency, isUUID } from "class-validator";

export const uuidFourVerify = (uuid: string) => isUUID(uuid, 4);

export const balanceCurrencyVerify = (balance: string) =>
  isCurrency(balance, {
    allow_negatives: true,
    allow_decimal: true,
    require_decimal: true,
  });
