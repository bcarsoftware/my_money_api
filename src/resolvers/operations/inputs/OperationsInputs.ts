import { BankTransferEnum } from "@/enums/BankTrasnferEnum";
import { GenericBankTransferEnum } from "@/enums/GenericTransferEnum";
import { LocalEnum } from "@/enums/LocalEnum";
import { MoneyTransferEnum } from "@/enums/MoneyTrasnferEnum";
import { IsNotZero } from "@/utils/verifiers/decorators/IsNotZero";
import {
  IsCurrency,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from "class-validator";
import { Field, InputType, registerEnumType } from "type-graphql";

registerEnumType(BankTransferEnum, {
  name: "BankTransferEnum",
});

registerEnumType(GenericBankTransferEnum, {
  name: "GenericBankTransferEnum",
});

registerEnumType(MoneyTransferEnum, {
  name: "MoneyTransferEnum",
});

@InputType()
export class OperationBankTransferInput {
  @Field(() => String)
  @IsUUID("4", { message: "FromBankId must be a valid UUID." })
  fromBankId: string;

  @Field(() => String)
  @IsOptional()
  @IsUUID("4", { message: "ToBankId must be a valid UUID." })
  toBankId?: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;

  @Field(() => BankTransferEnum)
  @IsEnum(BankTransferEnum, {
    message: "TypeOperation must be DOC or PIX or TRANSFER or TED or PAYMENT.",
  })
  typeOperation: BankTransferEnum;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be INTERNAL or EXTERNAL." })
  local: LocalEnum;
}

@InputType()
export class OperationBankDepositInput {
  @Field(() => String)
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: false,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;
}

@InputType()
export class OperationBankWithdrawInput {
  @Field(() => String)
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  @Matches(/^-/, { message: "Amount must be a negative value." })
  amount: string;
}

@InputType()
export class OperationGenericBankTransferInput {
  @Field(() => String)
  @IsUUID("4", { message: "FromGenericBankId must be a valid UUID." })
  fromGenericBankId: string;

  @Field(() => String)
  @IsOptional()
  @IsUUID("4", { message: "ToGenericBankId must be a valid UUID." })
  toGenericBankId?: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;

  @Field(() => GenericBankTransferEnum)
  @IsEnum(GenericBankTransferEnum, {
    message: "TypeOperation must be TRANSFER or WITHDRAW or DEPOSIT.",
  })
  typeOperation: GenericBankTransferEnum;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be INTERNAL or EXTERNAL." })
  local: LocalEnum;
}

@InputType()
export class OperationGenericBankDepositInput {
  @Field(() => String)
  @IsUUID("4", { message: "GenericBankId must be a valid UUID." })
  genericBankId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: false,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;
}

@InputType()
export class OperationGenericBankWithdrawInput {
  @Field(() => String)
  @IsUUID("4", { message: "GenericBankId must be a valid UUID." })
  genericBankId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  @Matches(/^-/, { message: "Amount must be a negative value." })
  amount: string;
}

@InputType()
export class OperationMoneyTransferInput {
  @Field(() => String)
  @IsUUID("4", { message: "FromMoneyId must be a valid UUID." })
  fromMoneyId: string;

  @Field(() => String)
  @IsOptional()
  @IsUUID("4", { message: "ToMoneyId must be a valid UUID." })
  toMoneyId?: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;

  @Field(() => MoneyTransferEnum)
  @IsEnum(MoneyTransferEnum, {
    message: "TypeOperation must be SEND or RECEIVE.",
  })
  typeOperation: MoneyTransferEnum;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be INTERNAL or EXTERNAL." })
  local: LocalEnum;
}

@InputType()
export class OperationMoneyDepositInput {
  @Field(() => String)
  @IsUUID("4", { message: "MoneyId must be a valid UUID." })
  moneyId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: false,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  amount: string;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be INTERNAL or EXTERNAL." })
  local: LocalEnum;
}

@InputType()
export class OperationMoneyWithdrawInput {
  @Field(() => String)
  @IsUUID("4", { message: "MoneyId must be a valid UUID." })
  moneyId: string;

  @Field(() => String)
  @IsNotZero({ message: "Amount must not be zero." })
  @IsCurrency(
    {
      allow_negatives: true,
      require_decimal: true,
    },
    { message: "Amount must be a valid currency value." }
  )
  @Matches(/^-/, { message: "Amount must be a negative value." })
  amount: string;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be INTERNAL or EXTERNAL." })
  local: LocalEnum;
}
