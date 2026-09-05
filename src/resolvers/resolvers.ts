import { BankBoxResolver } from "@/resolvers/bank-box/BankBoxResolver";
import { BankResolver } from "@/resolvers/bank/BankResolver";
import { InvoiceResolver } from "@/resolvers/invoice/InvoiceResolver";
import { MeResolver } from "@/resolvers/me/MeResolver";
import { MoneyResolver } from "@/resolvers/money/MoneyResolver";
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
] as const;
