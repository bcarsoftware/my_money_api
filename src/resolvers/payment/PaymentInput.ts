import { MonthEnum } from "@/enums/MonthEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import {
  IsCurrency,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreatePaymentInput {
  @Field(() => String)
  @IsUUID("4", { message: "UserId must be a valid UUID." })
  userId: string;

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
  @IsEnum(RepeatEnum, { message: "Repeat must be a valid RepeatEnum value." })
  repeat: RepeatEnum;

  @Field(() => String)
  @IsCurrency(
    { allow_negatives: false },
    { message: "Balance must be a valid currency format." }
  )
  balance: string;

  @Field(() => Number)
  @IsInt({ message: "Day must be an integer." })
  @Min(1, { message: "Day must be at least 1." })
  @Max(31, { message: "Day must be at most 31." })
  day: number;

  @Field(() => MonthEnum)
  @IsEnum(MonthEnum, { message: "Month must be a valid MonthEnum value." })
  month: MonthEnum;
}

@InputType()
export class ListPaymentInput {
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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => RepeatEnum, { nullable: true })
  @IsOptional()
  @IsEnum(RepeatEnum, { message: "Repeat must be a valid RepeatEnum value." })
  repeat?: RepeatEnum;

  @Field(() => MonthEnum, { nullable: true })
  @IsOptional()
  @IsEnum(MonthEnum, { message: "Month must be a valid MonthEnum value." })
  month?: MonthEnum;
}

@InputType()
export class UpdatePaymentInput {
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

  @Field(() => RepeatEnum, { nullable: true })
  @IsOptional()
  @IsEnum(RepeatEnum, { message: "Repeat must be a valid RepeatEnum value." })
  repeat?: RepeatEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Balance must be a valid currency format." }
  )
  balance?: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({ message: "Day must be an integer." })
  @Min(1, { message: "Day must be at least 1." })
  @Max(31, { message: "Day must be at most 31." })
  day?: number;

  @Field(() => MonthEnum, { nullable: true })
  @IsOptional()
  @IsEnum(MonthEnum, { message: "Month must be a valid MonthEnum value." })
  month?: MonthEnum;
}
