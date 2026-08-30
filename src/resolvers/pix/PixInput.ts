import { PixEnum } from "@/enums/PixEnum";
import { IsEnum, IsInt, IsOptional, IsUUID, MaxLength, Min } from "class-validator";
import { Field, InputType, registerEnumType } from "type-graphql";

registerEnumType(PixEnum, {
  name: "PixEnum",
});

@InputType()
export class CreatePixInput {
  @Field(() => String)
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId: string;

  @Field(() => String)
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag: string;

  @Field(() => String)
  @IsOptional()
  @MaxLength(256, {
    message: "Description must be at most 256 characters long.",
  })
  description?: string | null;

  @Field(() => PixEnum)
  @IsEnum(PixEnum, { message: "TypeKey must be a valid PixEnum value." })
  typeKey: PixEnum;

  @Field(() => String)
  @MaxLength(512, { message: "Key must be at most 512 characters long." })
  key: string;
}

@InputType()
export class ListPixInput {
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
  @MaxLength(64, { message: "Tag must be at most 64 characters long." })
  tag?: string | null;

  @Field(() => PixEnum, { nullable: true })
  @IsOptional()
  @IsEnum(PixEnum, { message: "TypeKey must be a valid PixEnum value." })
  typeKey?: PixEnum;
}

@InputType()
export class UpdatePixInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID("4", { message: "BankId must be a valid UUID." })
  bankId?: string;

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

  @Field(() => PixEnum, { nullable: true })
  @IsOptional()
  @IsEnum(PixEnum, { message: "TypeKey must be a valid PixEnum value." })
  typeKey?: PixEnum;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MaxLength(512, { message: "Key must be at most 512 characters long." })
  key?: string;
}
