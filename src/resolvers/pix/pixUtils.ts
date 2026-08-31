import { isEmail, isUUID } from "class-validator";

import { PixEnum } from "@/enums/PixEnum";
import { cnpjVerify } from "@/utils/verifiers/cnpjVerify";
import { cpfVerify } from "@/utils/verifiers/cpfVerify";
import { phoneVerify } from "@/utils/verifiers/phoneVerify";

function cpfCheck(cpf: string) {
  if (!cpfVerify(cpf)) throw new Error("CPF is invalid.");
}

function cnpjCheck(cnpj: string) {
  if (!cnpjVerify(cnpj)) throw new Error("CNPJ is invalid.");
}

function emailCheck(email: string) {
  if (!isEmail(email)) throw new Error("Email is invalid.");
}

function randomCheck(random: string) {
  if (!isUUID(random, "4")) throw new Error("Random key is invalid.");
}

function phoneCheck(phone: string) {
  if (!phoneVerify(phone)) throw new Error("Phone number is invalid.");
}

export function pixChecker(typeKey?: PixEnum, value?: string) {
  if (!typeKey && !value) return;

  if (typeKey && !value)
    throw new Error("Both typeKey and value must be provided together.");

  if (!typeKey && value)
    throw new Error("Both typeKey and value must be provided together.");

  const actualValue = value!;

  switch (typeKey) {
    case PixEnum.CPF:
      cpfCheck(actualValue);
      break;
    case PixEnum.CNPJ:
      cnpjCheck(actualValue);
      break;
    case PixEnum.EMAIL:
      emailCheck(actualValue);
      break;
    case PixEnum.RANDOM:
      randomCheck(actualValue);
      break;
    case PixEnum.PHONE:
      phoneCheck(actualValue);
      break;
    default:
      throw new Error("Invalid Pix key type.");
  }
}
