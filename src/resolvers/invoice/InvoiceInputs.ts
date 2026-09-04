import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import {
  IsBoolean,
  IsCurrency,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateInvoiceInput {
  @Field(() => String)
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => RepeatEnum)
  @IsEnum(RepeatEnum, { message: "Repeat must be a valid enum value." })
  repeat: RepeatEnum;

  @Field(() => Number)
  @Min(1, { message: "Installments must be at least 1." })
  installments: number;

  @Field(() => String)
  @IsCurrency({}, { message: "Balance must be a valid currency value." })
  balance: string;

  @Field(() => String)
  @IsCurrency({}, { message: "Total must be a valid currency value." })
  total: string;
}

@InputType()
export class UpdateInvoiceInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;
}

@InputType()
export class InvoicePayInput {
  @Field(() => String)
  @IsUUID("4", { message: "Id must be a valid UUID." })
  id: string;

  @Field(() => String)
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId: string;

  @Field(() => Boolean)
  @IsBoolean({ message: "PayInvoice must be a boolean value." })
  payInvoice: boolean;
}

@InputType()
export class ListInvoiceInput {
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

  @Field(() => InvoiceStatusEnum, { nullable: true })
  @IsOptional()
  @IsEnum(InvoiceStatusEnum, {
    message: "Status Invoice must be a valid enum value.",
  })
  status?: InvoiceStatusEnum;

  @Field(() => RepeatEnum, { nullable: true })
  @IsOptional()
  @IsEnum(RepeatEnum, { message: "Repeat must be a valid enum value." })
  repeat?: RepeatEnum;
}
