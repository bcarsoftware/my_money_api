import { Bank } from "@/entities/Bank";

export const toBankDto = (bank: Bank) => ({
  id: bank.id,
  userId: bank.userId,
  code: bank.code,
  name: bank.name,
  accountType: bank.accountType,
  accountNumber: bank.accountNumber,
  agency: bank.agency,
  balance: bank.balance,
  createdAt: bank.createdAt.toISOString(),
});
