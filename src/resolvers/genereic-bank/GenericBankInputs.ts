import { CurrencyEnum } from "@/enums/CurrencyEnum";
import {
  IsCurrency,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Field, InputType, registerEnumType } from "type-graphql";

registerEnumType(CurrencyEnum, {
  name: "CurrencyEnum",
});

@InputType()
export class CreateBankInfoInput {
  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => String)
  @MaxLength(256, { message: "Value must be at most 256 characters long." })
  value: string;
}

@InputType()
export class UpdateBankInfoInput {
  @Field(() => String)
  @IsUUID("4", { message: "ID must be a valid UUID." })
  id: string;

  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => String)
  @MaxLength(256, { message: "Value must be at most 256 characters long." })
  value: string;
}

@InputType()
export class CreateGenericBankInput {
  @Field(() => String)
  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => CurrencyEnum)
  @IsEnum(CurrencyEnum, { message: "Currency must be a valid currency type." })
  currency: CurrencyEnum;

  @Field(() => [CreateBankInfoInput], { nullable: true })
  @ValidateNested({ each: true })
  bankInfo?: CreateBankInfoInput[] | null;

  @Field(() => String)
  @IsCurrency(
    { allow_negatives: false },
    { message: "Balance must be a valid currency amount." }
  )
  balance: string;
}

@InputType()
export class ListGenericBankInput {
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
  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => CurrencyEnum, { nullable: true })
  @IsOptional()
  @IsEnum(CurrencyEnum, { message: "Currency must be a valid currency type." })
  currency?: CurrencyEnum;
}

@InputType()
export class UpdateGenericBankInput {
  @Field(() => String)
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => [UpdateBankInfoInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  bankInfo?: UpdateBankInfoInput[] | null;
}
