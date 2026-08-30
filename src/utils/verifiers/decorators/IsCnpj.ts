import { cnpjVerify } from "@/utils/verifiers/cnpjVerify";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export const IS_CNPJ = "isCnpj";

export function isCnpj(value: unknown): boolean {
  return typeof value === "string" && cnpjVerify(value);
}

export function IsCnpj(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IS_CNPJ,
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isCnpj(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid CNPJ`;
        },
      },
    });
  };
}
