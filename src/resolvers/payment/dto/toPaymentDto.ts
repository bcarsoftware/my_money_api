import { Payment } from "@/entities/Payment";
import { PaymentDto } from "@/resolvers/payment/dto/PaymentDto";

export const toPaymentDto = (payment: Payment): PaymentDto => ({
  id: payment.id,
  userId: payment.userId,
  name: payment.name,
  description: payment.description ?? null,
  repeat: payment.repeat,
  balance: payment.balance,
  day: payment.day,
  month: payment.month,
  createdAt: payment.createdAt.toISOString(),
});
