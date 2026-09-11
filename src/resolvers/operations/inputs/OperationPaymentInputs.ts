import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  IsCurrency,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateOperationPaymentInput {
  @Field(() => String)
  @IsUUID("4", { message: "Payment ID must be a valid UUID." })
  paymentId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => String)
  @IsCurrency(
    { allow_negatives: true },
    { message: "Balance must be a valid currency amount." }
  )
  balance: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: true },
    { message: "Discount must be a valid currency amount." }
  )
  discount?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Forfeit must be a valid currency amount." }
  )
  forfeit?: string | null;

  @Field(() => OperationEnum)
  @IsEnum(OperationEnum, {
    message: "TypeOperation must be a valid OperationEnum value.",
  })
  typeOperation: OperationEnum;

  @Field(() => LocalEnum)
  @IsEnum(LocalEnum, { message: "Local must be a valid LocalEnum value." })
  local: LocalEnum;
}

@InputType()
export class UpdateOperationPaymentInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;
}

@InputType()
export class ListOperationPaymentInput {
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({ message: "Limit must be an integer." })
  @Min(0, { message: "Limit must be at least 0." })
  limit?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({ message: "Offset must be an integer." })
  @Min(0, { message: "Offset must be at least 0." })
  offset?: number;

  @Field(() => String)
  @IsUUID("4", { message: "PaymentId must be a valid UUID." })
  paymentId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string;

  @Field(() => OperationEnum)
  @IsOptional()
  @IsEnum(OperationEnum, {
    message: "TypeOperation must be a valid operation type.",
  })
  typeOperation?: OperationEnum;

  @Field(() => LocalEnum)
  @IsOptional()
  @IsEnum(LocalEnum, { message: "Local must be a valid local type." })
  local?: LocalEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString({}, { message: "StartDate must be a valid date string." })
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateString({}, { message: "EndDate must be a valid date string." })
  endDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "MinAmount must be a valid currency amount." })
  minAmount?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "MaxAmount must be a valid currency amount." })
  maxAmount?: string;
}
