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
export class CreateBankBoxInput {
  @Field(() => String)
  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag: string;

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
export class ListBankBoxInput {
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
  @IsOptional()
  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string;
}

@InputType()
export class UpdateBankBoxInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID("4", { message: "Bank ID must be a valid UUID." })
  bankId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string;

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

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Balance must be a valid currency value." }
  )
  balance?: string;
}
