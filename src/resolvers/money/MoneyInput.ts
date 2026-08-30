import { IsCurrency, IsInt, IsOptional, MaxLength } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class CreateMoneyInput {
  @Field(() => String)
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "Objective must be a valid currency format." })
  objective?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => String)
  @IsCurrency({}, { message: "Balance must be a valid currency format." })
  balance: string;
}

@InputType()
export class ListMoneyInput {
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({ message: "Limit must be an integer." })
  limit?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt({ message: "Offset must be an integer." })
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
  @IsCurrency({}, { message: "Objective must be a valid currency format." })
  objective?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "Balance must be a valid currency format." })
  balance?: string | null;
}
