import { GraphQLError } from "graphql";
import type { ValidationError as ClassValidatorValidationError } from "class-validator";

type IValidationError = Pick<
  ClassValidatorValidationError,
  "property" | "value" | "constraints" | "children"
>;

interface IFormattedValidationError {
  field: string;
  message: string;
  value?: unknown;
  constraints?: Record<string, string>;
  children?: IFormattedValidationError[];
}

function formatValidationErrors(
  validationError: IValidationError
): IFormattedValidationError {
  const firstConstraintKey = validationError.constraints
    ? Object.keys(validationError.constraints)[0]
    : undefined;

  const message =
    (firstConstraintKey && validationError.constraints?.[firstConstraintKey]) ||
    `Validation error on field ${validationError.property}`;

  return {
    field: validationError.property,
    message,
    ...(validationError.value !== undefined && {
      value: validationError.value,
    }),
    ...(validationError.constraints && {
      constraints: validationError.constraints,
    }),
    ...(validationError.children &&
      validationError.children.length > 0 && {
        children: validationError.children.map((child) =>
          formatValidationErrors(child)
        ),
      }),
  };
}

export class ValidationError extends GraphQLError {
  public constructor(validationErrors: ClassValidatorValidationError[]) {
    const firstError = validationErrors[0];
    const firstErrorMessage = firstError
      ? formatValidationErrors(firstError).message
      : "Validation Error";

    super(firstErrorMessage, {
      extensions: {
        code: "BAD_USER_INPUT",
        validationErrors: validationErrors.map((validationError) =>
          formatValidationErrors(validationError)
        ),
      },
    });

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
