import { AccountEnum } from "@/enums/AccountEnum";
import {
  IsCurrency,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  MaxLength,
  Min,
} from "class-validator";
import { Field, InputType, registerEnumType } from "type-graphql";

registerEnumType(AccountEnum, {
  name: "AccountEnum",
});

@InputType()
export class CreateBankInput {
  @Field(() => String)
  @MaxLength(8, { message: "Code must be at most 8 characters long." })
  @IsNumberString({}, { message: "Code must contain only numbers." })
  code: string;

  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => AccountEnum)
  @IsEnum(AccountEnum, { message: "Account type must be a valid enum value." })
  accountType: AccountEnum;

  @Field(() => String)
  @MaxLength(64, {
    message: "Account number must be at most 64 characters long.",
  })
  @IsNumberString({}, { message: "Account number must contain only numbers." })
  accountNumber: string;

  @Field(() => String)
  @MaxLength(32, { message: "Agency must be at most 32 characters long." })
  @IsNumberString({}, { message: "Agency must contain only numbers." })
  agency: string;

  @Field(() => String)
  @IsCurrency({}, { message: "Balance must be a valid currency amount." })
  balance: string;
}

@InputType()
export class ListBankInput {
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
  @MaxLength(8, { message: "Code must be at most 8 characters long." })
  @IsNumberString({}, { message: "Code must contain only numbers." })
  code?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => AccountEnum, { nullable: true })
  @IsOptional()
  @IsEnum(AccountEnum, { message: "Account type must be a valid enum value." })
  accountType?: AccountEnum;
}

@InputType()
export class UpdateBankInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(8, { message: "Code must be at most 8 characters long." })
  @IsNumberString({}, { message: "Code must contain only numbers." })
  code?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => AccountEnum, { nullable: true })
  @IsOptional()
  @IsEnum(AccountEnum, { message: "Account type must be a valid enum value." })
  accountType?: AccountEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, {
    message: "Account number must be at most 64 characters long.",
  })
  @IsNumberString({}, { message: "Account number must contain only numbers." })
  accountNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(32, { message: "Agency must be at most 32 characters long." })
  @IsNumberString({}, { message: "Agency must contain only numbers." })
  agency?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "Balance must be a valid currency amount." })
  balance?: string;
}
