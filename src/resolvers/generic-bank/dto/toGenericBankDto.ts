import { GenericBank } from "@/entities/GenericBank";
import { GenericBankDto } from "@/resolvers/genereic-bank/dto/GenericBankDto";

export const toGenericBankDto = (genericBank: GenericBank): GenericBankDto => ({
  id: genericBank.id,
  userId: genericBank.userId,
  bankId: genericBank.bankId,
  name: genericBank.name,
  currency: genericBank.currency,
  balance: genericBank.balance,
  bankInfo: genericBank.bankInfo
    ? genericBank.bankInfo.map((info) => ({
        id: info.id,
        name: info.name,
        value: info.value,
      }))
    : null,
  createdAt: genericBank.createdAt.toISOString(),
});
