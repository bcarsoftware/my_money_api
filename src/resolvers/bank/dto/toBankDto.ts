import { Bank } from "@/entities/Bank";
import { BankDto } from "./BankDto";

export const toBankDto = (bank: Bank): BankDto => ({
  id: bank.id,
  userId: bank.userId,
  code: bank.code,
  name: bank.name,
  accountType: bank.accountType,
  accountNumber: bank.accountNumber,
  agency: bank.agency,
  balance: bank.balance,
  creditLimit: bank.creditLimit,
  actualLimit: bank.actualLimit,
  createdAt: bank.createdAt.toISOString(),
});
