import { usernameVerify } from "@/utils/verifiers/usernameVerify";
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export const IS_USERNAME = "isUsername";

export function isUsername(value: unknown): boolean {
  return typeof value === "string" && usernameVerify(value);
}

export function IsUsername(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IS_USERNAME,
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isUsername(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid username. It should start with a lowercase letter, can contain lowercase letters, numbers, underscores, and hyphens, and must be between 2 and 128 characters long.`;
        },
      },
    });
  };
}
