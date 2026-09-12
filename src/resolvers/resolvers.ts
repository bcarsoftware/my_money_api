import { BankBoxResolver } from "@/resolvers/bank-box/BankBoxResolver";
import { BankResolver } from "@/resolvers/bank/BankResolver";
import { GenericBankBoxResolver } from "@/resolvers/generic-bank-box/GenericBankBoxResolver";
import { GenericBankResolver } from "@/resolvers/generic-bank/GenericBankResolver";
import { InvoiceResolver } from "@/resolvers/invoice/InvoiceResolver";
import { MeResolver } from "@/resolvers/me/MeResolver";
import { MoneyResolver } from "@/resolvers/money/MoneyResolver";
import { OperationBankResolver } from "@/resolvers/operations/OperationBankResolvert";
import { OperationGenericBankResolver } from "@/resolvers/operations/OperationGenericBankResolver";
import { OperationMoneyResolver } from "@/resolvers/operations/OperationMoneyResolver";
import { OperationPaymentResolver } from "@/resolvers/operations/OperationPaymentResolver";
import { PaymentResolver } from "@/resolvers/payment/PaymentResolver";
import { PixResolver } from "@/resolvers/pix/PixResolver";
import { UserResolver } from "@/resolvers/user/UserResolver";

export const resolvers = [
  MeResolver,
  UserResolver,
  MoneyResolver,
  BankResolver,
  PixResolver,
  BankBoxResolver,
  InvoiceResolver,
  PaymentResolver,
  GenericBankResolver,
  GenericBankBoxResolver,
  OperationBankResolver,
  OperationGenericBankResolver,
  OperationMoneyResolver,
  OperationPaymentResolver,
] as const;
