import { BankBox } from "@/entities/BankBox";

export const toBankBoxDto = (bankBox: BankBox) => ({
  id: bankBox.id,
  bankId: bankBox.bankId,
  tag: bankBox.tag,
  objective: bankBox.objective,
  description: bankBox.description,
  balance: bankBox.balance,
  createdAt: bankBox.createdAt,
});
