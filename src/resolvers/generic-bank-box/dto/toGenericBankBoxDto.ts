import { GenericBankBox } from "@/entities/GenericBankBox";
import { GenericBankBoxDto } from "./GenericBankBoxDto";

export const toGenericBankBoxDto = (
  genericBankBox: GenericBankBox
): GenericBankBoxDto => ({
  id: genericBankBox.id,
  genericBankId: genericBankBox.genericBankId,
  name: genericBankBox.name,
  objective: genericBankBox.objective ?? null,
  description: genericBankBox.description ?? null,
  balance: genericBankBox.balance,
  createdAt: genericBankBox.createdAt.toISOString(),
});
