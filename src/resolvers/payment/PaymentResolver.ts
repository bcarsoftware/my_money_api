import {
  INVALID_DAY_MONTH_COMBINATION,
  PAYMENT_NOT_FOUND,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Payment } from "@/entities/Payment";
import { PaymentEnum } from "@/enums/PaymentEnum";
import {
  CreatePaymentInput,
  ListPaymentInput,
  UpdatePaymentInput,
} from "@/resolvers/payment/PaymentInputs";
import { clearDecimal } from "@/utils/currencyUtil";
import { isValidMonthAndDay } from "@/utils/dateUtil";
import { loggedContext } from "@/utils/loggedContext";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { ILike } from "typeorm";
import { MessageResponse } from "../MessageResponse";
import { PaginatedPaymentsDto, PaymentDto } from "./dto/PaymentDto";
import { toPaymentDto } from "./dto/toPaymentDto";

@Resolver()
export class PaymentResolver {
  @Protected()
  @Query(() => PaginatedPaymentsDto)
  async listPayments(
    @Ctx() context: MyContext,
    @Arg("input", () => ListPaymentInput) input: ListPaymentInput
  ): Promise<PaginatedPaymentsDto> {
    const { limit, offset } = input;

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId: context.userId,
          ...(input.name && { name: ILike(`%${input.name}%`) }),
          ...(input.repeat && { repeat: input.repeat }),
          ...(input.month && { month: input.month }),
          ...(input.status && { status: input.status }),
        };

        const [payments, total] = await em.findAndCount(Payment, {
          where,
          take: limit ?? 20,
          skip: offset ?? 0,
        });

        const items = payments.map((payment) => toPaymentDto(payment));

        return { items, total };
      } catch (error) {
        console.log("Error occurred in listPayments:", error);
        throw new Error("Failed to list payments.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaymentDto)
  async createPayment(
    @Ctx() context: MyContext,
    @Arg("input", () => CreatePaymentInput) input: CreatePaymentInput
  ): Promise<PaymentDto> {
    if (!isValidMonthAndDay(input.month, input.day))
      throw new Error(INVALID_DAY_MONTH_COMBINATION);

    return await loggedContext(context, async (em) => {
      try {
        const payment = em.create(Payment, {
          ...input,
          userId: context.userId,
          balance: clearDecimal(input.balance),
          status: PaymentEnum.ACTIVE,
        });
        const newPayment = await em.save(payment);
        return toPaymentDto(newPayment);
      } catch (error) {
        console.log("Error occurred in createPayment:", error);
        throw new Error("Failed to create payment.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaymentDto)
  async updatePayment(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdatePaymentInput) input: UpdatePaymentInput
  ): Promise<PaymentDto> {
    return await loggedContext(context, async (em) => {
      const payment = await em.findOne(Payment, {
        where: { id, userId: context.userId },
      });

      if (!payment) throw new Error(PAYMENT_NOT_FOUND);

      if (input.day || input.month) {
        const day = input.day ?? payment.day;
        const month = input.month ?? payment.month;

        if (!isValidMonthAndDay(month, day))
          throw new Error(INVALID_DAY_MONTH_COMBINATION);
      }

      try {
        payment.name = input.name ?? payment.name;
        payment.description =
          input.description !== undefined
            ? input.description
            : payment.description;
        payment.repeat = input.repeat ?? payment.repeat;
        payment.balance = input.balance
          ? clearDecimal(input.balance)
          : payment.balance;
        payment.day = input.day ?? payment.day;
        payment.month = input.month ?? payment.month;
        payment.status = input.status ?? payment.status;

        const updatedPayment = await em.save(payment);

        return toPaymentDto(updatedPayment);
      } catch (error) {
        console.log("Error occurred in updatePayment:", error);
        throw new Error("Failed to update payment.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deletePayment(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return await loggedContext(context, async (em) => {
      const payment = await em.findOne(Payment, {
        where: { id, userId: context.userId },
      });

      if (!payment) throw new Error(PAYMENT_NOT_FOUND);

      try {
        await em.softRemove(payment);
        return { message: "Payment deleted successfully." };
      } catch (error) {
        console.log("Error occurred in deletePayment:", error);
        throw new Error("Failed to delete payment.");
      }
    });
  }
}
