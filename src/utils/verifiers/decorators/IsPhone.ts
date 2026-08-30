import { phoneVerify } from "@/utils/verifiers/phoneVerify";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export const IS_PHONE = "isPhone";

export function isPhone(value: unknown): boolean {
  return typeof value === "string" && phoneVerify(value);
}

export function IsPhone(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IS_PHONE,
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isPhone(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid Phone number.`;
        },
      },
    });
  };
}
