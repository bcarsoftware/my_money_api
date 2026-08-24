import { MeResolver } from "./me/MeResolver";
import { UserResolver } from "./user/UserResolver";

export const resolvers = [MeResolver, UserResolver] as const;
