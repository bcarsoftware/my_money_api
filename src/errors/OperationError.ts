import { GraphQLError } from "graphql";

type ValidationInput =
  | string
  | null
  | undefined
  | {
      message?: string | string[];
      constraints?: Record<string, string>;
      children?: ValidationInput[];
    }
  | ValidationInput[];

export interface OperationErrorExtensions {
  code?: string;
  context?: string;
  [key: string]: unknown;
}

export class OperationError extends GraphQLError {
  public readonly errors: string[];

  constructor(
    validateReturn: ValidationInput,
    extensions: OperationErrorExtensions = {}
  ) {
    const stack = normalizeStack(validateReturn);
    const firstMessage = stack[0] ?? "Erro de validação";

    super(firstMessage, {
      extensions: {
        ...extensions,
        code: extensions.code ?? "BAD_USER_INPUT",
        errors: stack,
      },
    });

    this.name = "OperationError";
    this.errors = stack;
  }
}

function normalizeStack(input: ValidationInput): string[] {
  if (!input) {
    return [];
  }

  if (typeof input === "string") {
    return input.trim() ? [input.trim()] : [];
  }

  if (Array.isArray(input)) {
    return input.flatMap(normalizeStack);
  }

  if (typeof input === "object") {
    return extractMessagesFromObject(input);
  }

  return [];
}

function extractMessagesFromObject(
  input: Extract<ValidationInput, { constraints?: unknown }>
): string[] {
  const messages: string[] = [];

  if (input.constraints) {
    messages.push(...Object.values(input.constraints));
  }

  if (input.message) {
    const messageList = Array.isArray(input.message)
      ? input.message
      : [input.message];
    messages.push(...messageList);
  }

  if (input.children?.length) {
    messages.push(...input.children.flatMap(normalizeStack));
  }

  return messages.filter(Boolean);
}

export function getFirstMessage(validateReturn: ValidationInput): string {
  return normalizeStack(validateReturn)[0] ?? "Erro de validação";
}
