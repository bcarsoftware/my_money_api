import { MeResolver } from "./me/MeResolver";
import { MoneyResolver } from "./money/MoneyResolver";
import { UserResolver } from "./user/UserResolver";

export const resolvers = [MeResolver, UserResolver, MoneyResolver] as const;
