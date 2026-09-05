import { SALT_ROUNDS_INVALID } from "@/constants/constants";
import { compare, hash } from "bcrypt";

async function getSaltRounds(): Promise<number> {
  const saltRounds = process.env.SALT_ROUNDS;

  if (!saltRounds || !/^[0-9]+$/.test(saltRounds)) {
    throw new Error(SALT_ROUNDS_INVALID);
  }

  return Number(saltRounds);
}

export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required and must be a string");
  }

  const saltRound = await getSaltRounds();

  return hash(password, saltRound);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (
    !password ||
    !hash ||
    typeof password !== "string" ||
    typeof hash !== "string"
  ) {
    return false;
  }

  return compare(password, hash);
}
