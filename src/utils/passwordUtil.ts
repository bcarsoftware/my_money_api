import { SALT_ROUNTS_INVALID } from "@/constants/constants";
import { compare, hash } from "bcrypt";

async function getSaltRounds(): Promise<number> {
  const saltRounds = process.env.SALT_ROUNDS;

  if (!/^[0-9]+$/.test(saltRounds)) {
    throw new Error(SALT_ROUNTS_INVALID);
  }

  return parseInt(saltRounds, 1);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRound = await getSaltRounds();

  return hash(password, saltRound);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}
