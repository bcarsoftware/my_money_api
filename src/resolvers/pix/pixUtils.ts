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

export function pixChecker(typeKey: PixEnum, value: string) {
  switch (typeKey) {
    case PixEnum.CPF:
      cpfCheck(value);
      break;
    case PixEnum.CNPJ:
      cnpjCheck(value);
      break;
    case PixEnum.EMAIL:
      emailCheck(value);
      break;
    case PixEnum.RANDOM:
      randomCheck(value);
      break;
    case PixEnum.PHONE:
      phoneCheck(value);
      break;
    default:
      throw new Error("Invalid Pix key type.");
  }
}
