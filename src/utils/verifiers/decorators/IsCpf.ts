import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { cpfVerify } from "@/utils/verifiers/cpfVerify";

export const IS_CPF = "isCpf";

export function isCpf(value: unknown): boolean {
  return typeof value === "string" && cpfVerify(value);
}

export function IsCpf(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IS_CPF,
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isCpf(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid CPF`;
        },
      },
    });
  };
}
