import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { IsNotZero } from "@/utils/verifiers/decorators/IsNotZero";
import {
  Equals,
  IsCurrency,
  IsEnum,
  IsIn,
  IsOptional,
  IsUUID,
  Matches,
} from "class-validator";

export class BankTransferVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Balance must be a valid currency amount.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  balance: string;

  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  amount: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsUUID("4", { message: "Origin bank ID must be a valid UUID." })
  originBankId: string;

  @IsOptional()
  @IsUUID("4", { message: "Destination bank ID must be a valid UUID." })
  destinationBankId?: string;

  @IsEnum(LocalEnum, { message: "Local must be a valid LocalEnum value" })
  local: LocalEnum;

  @IsIn(
    [
      OperationEnum.PAYMENT,
      OperationEnum.TRANSFER,
      OperationEnum.PIX,
      OperationEnum.DOC,
      OperationEnum.TED,
    ],
    { message: "Operation type must be one of the valid bank operation types." }
  )
  typeOperation: OperationEnum;
}

export class MoneyTransferVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Balance must be a valid currency amount.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  balance: string;

  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  amount: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsUUID("4", { message: "Origin money ID must be a valid UUID." })
  originMoneyId: string;

  @IsOptional()
  @IsUUID("4", { message: "Destination money ID must be a valid UUID." })
  destinationMoneyId?: string;

  @IsEnum(LocalEnum, { message: "Local must be a valid LocalEnum value" })
  local: LocalEnum;

  @IsIn(
    [
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ],
    {
      message: "Operation type must be one of the valid money operation types.",
    }
  )
  typeOperation: OperationEnum;
}

export class BankDepositVerify {
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^\d/, { message: "Balance must be greater than zero." })
  balance: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount and not negative.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^\d/, { message: "Amount must be greater than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.DEPOSIT, {
    message: "Operation type must be exactly DEPOSIT.",
  })
  typeOperation: OperationEnum;
}

export class BankWithdrawVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not positive.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^-/, { message: "Balance must be less than zero." })
  balance: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount and not positive.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^-/, { message: "Amount must be less than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.WITHDRAW, {
    message: "Operation type must be exactly WITHDRAW.",
  })
  typeOperation: OperationEnum;
}

export class MoneySendVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not positive.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^-/, { message: "Balance must be less than zero." })
  balance: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount and not positive.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^-/, { message: "Amount must be less than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.SEND, {
    message: "Operation type must be exactly SEND.",
  })
  typeOperation: OperationEnum;
}

export class MoneyReceiveVerify {
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^\d/, { message: "Balance must be greater than zero." })
  balance: string;

  @IsIn([null, undefined], {
    message: "Discount must be either null or undefined.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must be either null or undefined.",
  })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Amount must be a valid currency amount and not negative.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^\d/, { message: "Amount must be greater than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.RECEIVE, {
    message: "Operation type must be exactly RECEIVE.",
  })
  typeOperation: OperationEnum;
}

export class PaymentVerify {
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^\d/, { message: "Balance must be greater than zero." })
  balance: string;

  @IsOptional()
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Discount must be a valid currency amount and negative.",
    }
  )
  @Matches(/^-/, { message: "Discount must be smaller than zero." })
  discount?: string | null;

  @IsOptional()
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Forfeit must be a valid currency amount and not negative.",
    }
  )
  @Matches(/^\d/, { message: "Forfeit must be greater than zero." })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Amount must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^\d/, { message: "Amount must be greater than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.PAYMENT, {
    message: "Operation type must be exactly PAYMENT.",
  })
  typeOperation: OperationEnum;
}

export class InvoiceVerify {
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Balance must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^\d/, { message: "Balance must be greater than zero." })
  balance: string;

  @IsOptional()
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true },
    {
      message: "Discount must be a valid currency amount and negative.",
    }
  )
  @Matches(/^-/, { message: "Discount must be smaller than zero." })
  discount?: string | null;

  @IsOptional()
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Forfeit must be a valid currency amount and not negative.",
    }
  )
  @Matches(/^\d/, { message: "Forfeit must be greater than zero." })
  forfeit?: string | null;

  @IsCurrency(
    { allow_negatives: false, allow_decimal: true },
    {
      message: "Amount must be a valid currency balance and not negative.",
    }
  )
  @IsNotZero({ message: "Amount must not be zero." })
  @Matches(/^\d/, { message: "Amount must be greater than zero." })
  amount: string;

  @IsEnum(OperationEnum, {
    message: "Operation type must be a valid OperationEnum value.",
  })
  @Equals(OperationEnum.PAYMENT, {
    message: "Operation type must be exactly PAYMENT.",
  })
  typeOperation: OperationEnum;
}

export class BankBoxVerify {
  @IsIn([OperationEnum.DEPOSIT, OperationEnum.WITHDRAW], {
    message: "Operation type must be DEPOSIT or WITHDRAW.",
  })
  typeOperation: OperationEnum;

  @IsOptional()
  @IsIn([null, undefined], {
    message: "Invoice ID must not be provided for bank box operations.",
  })
  invoiceId?: string | null;

  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId: string;

  @IsUUID("4", { message: "Bank Box ID must be a valid UUID." })
  bankBoxId?: string | null;

  @IsCurrency(
    { allow_negatives: true, allow_decimal: true, require_decimal: true },
    {
      message: "Balance must be a valid currency balance.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  balance: string;

  @IsOptional()
  @IsIn([null, undefined], {
    message: "Forfeit must not be provided for bank box operations.",
  })
  forfeit?: string | null;

  @IsOptional()
  @IsIn([null, undefined], {
    message: "Discount must not be provided for bank box operations.",
  })
  discount?: string | null;

  @Equals(LocalEnum.INTERNAL, {
    message: "Local must be exactly INTERNAL.",
  })
  local: LocalEnum;
}

export class MoneyVerify {
  @IsIn(
    [
      OperationEnum.SEND,
      OperationEnum.RECEIVE,
      OperationEnum.TRANSFER,
      OperationEnum.PAYMENT,
    ],
    {
      message: "Operation type must be one of the valid money operation types.",
    }
  )
  typeOperation: OperationEnum;
}

export class GenericBankVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true, require_decimal: true },
    {
      message: "Balance must be a valid currency balance.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^\d/, { message: "Balance must be greater than zero." })
  balance: string;

  @IsUUID("4", { message: "Generic Bank ID must be a valid UUID." })
  genericBankId: string;

  @IsIn(
    [OperationEnum.DEPOSIT, OperationEnum.WITHDRAW, OperationEnum.TRANSFER],
    {
      message:
        "Operation type must be one of the valid generic bank operation types.",
    }
  )
  typeOperation: OperationEnum;
}

export class DiscountForfeitOmitted {
  @IsIn([null, undefined], {
    message: "Discount must not be provided for this operation.",
  })
  discount?: string | null;

  @IsIn([null, undefined], {
    message: "Forfeit must not be provided for this operation.",
  })
  forfeit?: string | null;
}

export class DepositVerify {
  @IsCurrency(
    { allow_negatives: false, allow_decimal: true, require_decimal: true },
    {
      message: "Balance must be a valid value for deposit.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  balance: string;
}

export class WithdrawVerify {
  @IsCurrency(
    { allow_negatives: true, allow_decimal: true, require_decimal: true },
    {
      message: "Balance must be a valid value for withdraw.",
    }
  )
  @IsNotZero({ message: "Balance must not be zero." })
  @Matches(/^-/, { message: "Balance must be a negative value for withdraw." })
  balance: string;
}
