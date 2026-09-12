import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

export const IS_NOT_ZERO = "isNotZero";

const zeroVerify = (value: string): boolean => {
  const regex = /^[0.,]+$/;
  return !regex.test(value);
};

export function isNotZero(value: unknown): boolean {
  return typeof value === "string" && zeroVerify(value);
}

export function IsNotZero(
  validationOptions?: ValidationOptions
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IS_NOT_ZERO,
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          return isNotZero(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be zero.`;
        },
      },
    });
  };
}
