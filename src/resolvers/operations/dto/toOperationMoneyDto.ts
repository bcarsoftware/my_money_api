import { OperationMoney } from "@/entities/OperationMoney";
import { OperationMoneyDto } from "@/resolvers/operations/dto/OperationMoneyDto";

export const toOperationMoneyDto = (
  operationMoney: OperationMoney
): OperationMoneyDto => ({
  id: operationMoney.id,
  operationRegister: operationMoney.operationRegister,
  userId: operationMoney.userId,
  moneyId: operationMoney.moneyId,
  tag: operationMoney.tag,
  description: operationMoney.description ?? null,
  balance: operationMoney.balance,
  discount: operationMoney.discount ?? null,
  forfeit: operationMoney.forfeit ?? null,
  amount: operationMoney.amount,
  typeOperation: operationMoney.typeOperation,
  local: operationMoney.local,
  createdAt: operationMoney.createdAt.toISOString(),
});
