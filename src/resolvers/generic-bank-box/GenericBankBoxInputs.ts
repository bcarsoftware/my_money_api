import {
  IsCurrency,
  IsInt,
  IsOptional,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateGenericBankBoxInput {
  @Field(() => String)
  @IsUUID("4", { message: "Generic Bank ID must be a valid UUID." })
  genericBankId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Objective must be a valid currency value." }
  )
  objective?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => String)
  @IsCurrency(
    { allow_negatives: false },
    { message: "Balance must be a valid currency value." }
  )
  balance: string;
}

@InputType()
export class ListGenericBankBoxInput {
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Min(0, { message: "Limit must be at least 0." })
  @IsInt({ message: "Limit must be an integer." })
  limit?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Min(0, { message: "Offset must be at least 0." })
  @IsInt({ message: "Offset must be an integer." })
  offset?: number;

  @Field(() => String, { nullable: true })
  @IsUUID("4", { message: "Generic Bank ID must be a valid UUID." })
  genericBankId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;
}

@InputType()
export class UpdateGenericBankBoxInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Objective must be a valid currency value." }
  )
  objective?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;
}
