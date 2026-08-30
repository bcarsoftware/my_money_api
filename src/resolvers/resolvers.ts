import { BankResolver } from "@/resolvers/bank/BankResolver";
import { MeResolver } from "@/resolvers/me/MeResolver";
import { MoneyResolver } from "@/resolvers/money/MoneyResolver";
import { UserResolver } from "@/resolvers/user/UserResolver";
import { PixResolver } from "@/resolvers/pix/PixResolver";

export const resolvers = [
  MeResolver,
  UserResolver,
  MoneyResolver,
  BankResolver,
  PixResolver,
] as const;
