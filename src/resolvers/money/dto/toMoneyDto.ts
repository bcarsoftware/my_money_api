import { Money } from "@/entities/Money";
import { MoneyDto } from "@/resolvers/money/dto/MoneyDto";

export const toMoneyDto = (money: Money): MoneyDto => ({
  id: money.id,
  userId: money.userId,
  tag: money.tag,
  objective: money.objective,
  description: money.description,
  balance: money.balance,
  createdAt: money.createdAt,
});
