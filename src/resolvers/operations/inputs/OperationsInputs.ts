import { BankTransferEnum } from "@/enums/BankTrasnferEnum";
import { GenericBankTransferEnum } from "@/enums/GenericTransferEnum";
import { LocalEnum } from "@/enums/LocalEnum";
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
