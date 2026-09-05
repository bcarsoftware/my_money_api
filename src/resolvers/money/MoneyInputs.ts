import { IsCurrency, IsInt, IsOptional, MaxLength, Min } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateMoneyInput {
  @Field(() => String)
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Objective must be a valid currency format." }
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
    { message: "Balance must be a valid currency format." }
  )
  balance: string;
}

@InputType()
export class ListMoneyInput {
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
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string | null;
}

@InputType()
export class UpdateMoneyInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency(
    { allow_negatives: false },
    { message: "Objective must be a valid currency format." }
  )
  objective?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;
}
