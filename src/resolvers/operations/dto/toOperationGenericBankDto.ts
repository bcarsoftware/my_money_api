import { OperationGenericBank } from "@/entities/OperationGenericBank";
import { OperationGenericBankDto } from "@/resolvers/operations/dto/OperationGenericBankDto";

export const toOperationGenericBankDto = (
  operationGenericBank: OperationGenericBank
): OperationGenericBankDto => ({
  id: operationGenericBank.id,
  operationRegister: operationGenericBank.operationRegister,
  userId: operationGenericBank.userId,
  genericBankId: operationGenericBank.genericBankId,
  genericBankBoxId: operationGenericBank.genericBankBoxId ?? null,
  tag: operationGenericBank.tag,
  description: operationGenericBank.description ?? null,
  balance: operationGenericBank.balance,
  discount: operationGenericBank.discount ?? null,
  forfeit: operationGenericBank.forfeit ?? null,
  amount: operationGenericBank.amount,
  typeOperation: operationGenericBank.typeOperation,
  local: operationGenericBank.local,
  createdAt: operationGenericBank.createdAt.toISOString(),
});
