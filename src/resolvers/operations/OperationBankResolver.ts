import {
  BALANCE_MUST_BE_POSITIVE,
  BANK_BOX_NOT_FOUND,
  BANK_NOT_FOUND,
  FROM_BANK_ID_MUST_OMITTED_EXTERNAL,
  INSUFFICIENT_BALANCE,
  INVOICE_NOT_FOUND,
  OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX,
  OPERATION_NOT_FOUND,
  TO_BANK_ID_REQUIRED,
  USER_BANK_NOT_MATCH,
  USER_NOT_AUTHENTICATED,
} from "@/constants/constants";
import { type MyContext } from "@/context/MyContext";
import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import { Invoice } from "@/entities/Invoice";
import { OperationBank } from "@/entities/OperationBank";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OperationError } from "@/errors/OperationError";
import {
  OperationBankDto,
  PaginatedOperationBankDto,
} from "@/resolvers/operations/dtos/OperationBankDto";
import { toOperationBankDto } from "@/resolvers/operations/dtos/toOperationBankDto";
import {
  CreateOperationBankInput,
  ListOperationBankInput,
  UpdateOperationBankInput,
} from "@/resolvers/operations/inputs/OperationBankInputs";
import {
  BankBoxVerify,
  InvoiceVerify,
} from "@/resolvers/operations/utils/OperationVerify";
import { generalQueryFilter } from "@/resolvers/operations/utils/generalQueryFilter";
import { uuidFourVerify } from "@/resolvers/operations/utils/operationUtils";
import {
  clearDecimal,
  decimalGreaterThan,
  decimalMultiply,
  decimalSubtract,
  decimalSum,
  decimalSumSequence,
} from "@/utils/currencyUtil";
import { loggedContext } from "@/utils/loggedContext";
import { randomUUID } from "@/utils/randomUUID";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { validate } from "class-validator";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import {
  OperationBankDepositInput,
  OperationBankTransferInput,
  OperationBankWithdrawInput,
} from "./inputs/OperationsInputs";

@Resolver()
export class OperationBankResolver {
  @Protected()
  @Query(() => PaginatedOperationBankDto)
  async operationBankList(
    @Ctx() context: MyContext,
    @Arg("input", () => ListOperationBankInput) input: ListOperationBankInput
  ): Promise<PaginatedOperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const limit = input.limit ?? 20;
    const offset = input.offset ?? 0;

    const queryFilters = generalQueryFilter(input);

    return await loggedContext(context, async (em) => {
      try {
        const where = {
          userId,
          bankId: input.bankId,
          ...(input.bankBoxId && { bankBoxId: input.bankBoxId }),
          ...(input.invoiceId && { invoiceId: input.invoiceId }),
          ...(queryFilters && queryFilters),
        };

        const [operations, total] = await em.findAndCount(OperationBank, {
          where,
          take: limit,
          skip: offset,
          order: { createdAt: "DESC" },
        });

        const items = operations.map(toOperationBankDto);

        return { items, total };
      } catch (error) {
        console.error(error);

        throw new Error("Failed to fetch operation bank list.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankUpdate(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UpdateOperationBankInput)
    input: UpdateOperationBankInput
  ): Promise<OperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    return await loggedContext(context, async (em) => {
      const operation = await em.findOne(OperationBank, {
        where: { id, userId },
      });

      if (!operation) throw new Error(OPERATION_NOT_FOUND);

      operation.tag = input.tag ?? operation.tag;
      operation.description = input.description ?? operation.description;

      try {
        const uptOpreation = await em.save(OperationBank, operation);

        return toOperationBankDto(uptOpreation);
      } catch (error) {
        console.error(error);

        throw new Error("Failed to update operation bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankDeposit(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationBankDepositInput)
    input: OperationBankDepositInput
  ): Promise<OperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(BANK_NOT_FOUND);

      bank.balance = decimalSum(bank.balance, input.amount);

      const operation: CreateOperationBankInput = {
        bankId: input.bankId,
        balance: input.amount,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.DEPOSIT,
        local: LocalEnum.EXTERNAL,
        tag: `Deposit into bank ${bank.name}.`,
        description: `Deposit of ${input.amount} into bank ${bank.name}.`,
      };

      const registerOperation = randomUUID(7);

      try {
        await em.save(Bank, bank);

        const savedOperation = await em.save(OperationBank, {
          ...operation,
          operationRegister: registerOperation,
        });

        return toOperationBankDto(savedOperation);
      } catch (error) {
        console.error("Failed to deposit into bank.", error);

        throw new Error("Failed to deposit into bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankWithdraw(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationBankWithdrawInput)
    input: OperationBankWithdrawInput
  ): Promise<OperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.amount = clearDecimal(input.amount);

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(BANK_NOT_FOUND);

      const amount = decimalMultiply(input.amount, "-1.00");

      if (decimalGreaterThan(amount, bank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      bank.balance = decimalSum(bank.balance, input.amount);

      const operation: CreateOperationBankInput = {
        bankId: input.bankId,
        balance: input.amount,
        discount: null,
        forfeit: null,
        typeOperation: OperationEnum.WITHDRAW,
        local: LocalEnum.EXTERNAL,
        tag: `Withdraw from bank ${bank.name}.`,
        description: `Withdraw of ${input.amount} from bank ${bank.name}.`,
      };

      const registerOperation = randomUUID(7);

      try {
        await em.save(Bank, bank);

        const savedOperation = await em.save(OperationBank, {
          ...operation,
          operationRegister: registerOperation,
        });

        return toOperationBankDto(savedOperation);
      } catch (error) {
        console.error("Failed to withdraw from bank.", error);

        throw new Error("Failed to withdraw from bank.");
      }
    });
  }

  @Protected()
  @Mutation(() => PaginatedOperationBankDto)
  async operationBankTransfer(
    @Ctx() context: MyContext,
    @Arg("input", () => OperationBankTransferInput)
    input: OperationBankTransferInput
  ): Promise<PaginatedOperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    if (input.local === LocalEnum.EXTERNAL && input.toBankId)
      throw new Error(FROM_BANK_ID_MUST_OMITTED_EXTERNAL);

    if (input.local === LocalEnum.INTERNAL && !input.toBankId)
      throw new Error(TO_BANK_ID_REQUIRED);

    if (
      input.local === LocalEnum.INTERNAL &&
      decimalGreaterThan("0.00", input.amount)
    )
      throw new Error(BALANCE_MUST_BE_POSITIVE);

    return await loggedContext(context, async (em) => {
      const origin = await em.findOne(Bank, {
        where: { id: input.fromBankId, userId },
      });

      if (!origin) throw new Error(BANK_NOT_FOUND);

      const destination: Bank | null = await em.findOne(Bank, {
        where: { id: input.toBankId, userId },
      });

      if (input.toBankId && !destination) throw new Error(BANK_NOT_FOUND);

      const amount = input.amount.replace("-", "");

      const status = decimalGreaterThan("0.00", input.amount)
        ? "Sent."
        : "Received.";

      const operations: CreateOperationBankInput[] = [
        {
          bankId: input.fromBankId,
          balance: input.amount,
          typeOperation: OperationEnum[input.typeOperation],
          local: input.local,
          tag: `Transfer ${input.amount} ${status} using ${input.typeOperation}.`,
          description: `Transfer of ${input.amount} from bank ${origin.name}.`,
        },
      ];

      switch (input.local) {
        case LocalEnum.INTERNAL:
          if (decimalGreaterThan(amount, origin.balance))
            throw new Error(INSUFFICIENT_BALANCE);
          origin.balance = decimalSum(origin.balance, input.amount);
          if (!destination) throw new Error(BANK_NOT_FOUND);
          destination.balance = decimalSum(destination.balance, amount);
          operations.push({
            bankId: destination.id,
            balance: amount,
            typeOperation: OperationEnum[input.typeOperation],
            local: input.local,
            tag: `Transfer ${amount} Received! Using ${input.typeOperation}.`,
            description: `Transfer of ${input.amount} to bank ${destination.name}.`,
          });
          break;
        case LocalEnum.EXTERNAL:
          if (
            decimalGreaterThan("0.00", input.amount) &&
            decimalGreaterThan(amount, origin.balance)
          )
            throw new Error(INSUFFICIENT_BALANCE);
          origin.balance = decimalSum(origin.balance, input.amount);
          break;
      }

      try {
        await em.save(Bank, origin);
        if (destination) await em.save(Bank, destination);

        const items: OperationBankDto[] = [];

        for (const operation of operations) {
          const response = await em.save(OperationBank, operation);
          if (!response) continue;
          items.push(toOperationBankDto(response));
        }

        return { items, total: items.length };
      } catch (error) {
        console.error("Error occurred during bank transfer operation:", error);

        throw new Error("Bank transfer operation failed.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankPayInvoice(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateOperationBankInput)
    input: CreateOperationBankInput
  ): Promise<OperationBankDto> {
    input.balance = clearDecimal(input.balance);

    if (input.local !== LocalEnum.INTERNAL)
      throw new Error("Operation bank payment invoice must be INTERNAL.");

    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    const amount = decimalSumSequence([
      input.balance,
      input.forfeit ?? "0.00",
      input.discount ?? "0.00",
    ]);

    const invoiceValidate: InvoiceVerify = {
      ...input,
      amount,
    };

    const operationErrors = await validate(invoiceValidate);

    if (operationErrors.length > 0) throw new OperationError(operationErrors);

    return await loggedContext(context, async (em) => {
      if (!input.invoiceId)
        throw new Error(
          "Invoice ID must be provided for bank invoice operation."
        );

      if (!uuidFourVerify(input.invoiceId))
        throw new Error("Invoice ID must be a valid UUID.");

      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      const invoice = await em.findOne(Invoice, {
        where: { id: input.invoiceId, bankId: input.bankId },
      });

      if (!invoice) throw new Error(INVOICE_NOT_FOUND);

      if (invoice.status === InvoiceStatusEnum.COMPLETED)
        throw new Error("Invoice has already been completed.");

      if (decimalGreaterThan(amount, bank.balance))
        throw new Error(INSUFFICIENT_BALANCE);

      bank.balance = decimalSubtract(bank.balance, amount);
      invoice.paidInstallments += 1;

      if (invoice.installments === invoice.paidInstallments)
        invoice.status = InvoiceStatusEnum.COMPLETED;

      const operationRegister = randomUUID(7);

      bank.creditLimit = decimalSum(bank.creditLimit, invoice.balance);

      try {
        const operationBank = em.create(OperationBank, {
          bank,
          invoice,
          tag: `${input.tag}. Using: ${input.typeOperation}.`,
          description: `${input.description}. Total: ${amount}`,
          amount,
          operationRegister,
        });

        await em.save(Bank, bank);
        await em.save(Invoice, invoice);

        const newOperationBank = await em.save(OperationBank, operationBank);

        return toOperationBankDto(newOperationBank);
      } catch (error) {
        console.error("Failed to complete bank invoice payment:", error);
        throw new Error("Failed to complete bank invoice paymeent.");
      }
    });
  }

  @Protected()
  @Mutation(() => OperationBankDto)
  async operationBankToBankBox(
    @Ctx() context: MyContext,
    @Arg("input", () => CreateOperationBankInput)
    input: CreateOperationBankInput
  ): Promise<OperationBankDto> {
    const { userId } = context;

    if (!userId) throw new Error(USER_NOT_AUTHENTICATED);

    input.balance = clearDecimal(input.balance);

    const bankBox: BankBoxVerify = {
      typeOperation: input.typeOperation,
      invoiceId: input.invoiceId,
      bankId: input.bankId,
      bankBoxId: input.bankBoxId,
      balance: input.balance,
      forfeit: input.forfeit,
      discount: input.discount,
      local: input.local,
    };

    const errorsBankBox = await validate(bankBox);

    if (errorsBankBox.length > 0) throw new OperationError(errorsBankBox);

    const isNegative = decimalGreaterThan("0.00", input.balance);

    switch (true) {
      case input.typeOperation === OperationEnum.WITHDRAW && !isNegative:
      case input.typeOperation === OperationEnum.DEPOSIT && isNegative:
        throw new Error(OPERATION_BANK_INVALID_BALANCE_TO_BANK_BOX);
    }

    return await loggedContext(context, async (em) => {
      const bank = await em.findOne(Bank, {
        where: { id: input.bankId, userId },
      });

      if (!bank) throw new Error(USER_BANK_NOT_MATCH);

      const bankBox = await em.findOne(BankBox, {
        where: { id: input.bankBoxId ?? undefined },
      });

      if (!bankBox) throw new Error(BANK_BOX_NOT_FOUND);

      switch (true) {
        case input.typeOperation === OperationEnum.DEPOSIT &&
          decimalGreaterThan(input.balance, bank.balance):
        case input.typeOperation === OperationEnum.WITHDRAW &&
          decimalGreaterThan(
            decimalMultiply(input.balance, "-1.00"),
            bankBox.balance
          ):
          throw new Error(INSUFFICIENT_BALANCE);
      }

      try {
        bankBox.balance = decimalSum(bankBox.balance, input.balance);
        bank.balance = decimalSum(
          bank.balance,
          decimalMultiply(input.balance, "-1.00")
        );

        const registerOperation = randomUUID(7);

        const operation = em.create(OperationBank, {
          ...input,
          registerOperation,
          userId,
          amount: input.balance,
        });

        const newOperation = await em.save(OperationBank, operation);

        return toOperationBankDto(newOperation);
      } catch (error) {
        console.error("Failed to complete bank to bank box operation:", error);
        throw new Error("Failed to complete bank to bank box operation.");
      }
    });
  }
}
