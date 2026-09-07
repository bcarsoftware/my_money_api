import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GenericBankBoxDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  genericBankId: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  objective?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String)
  balance: string;

  @Field(() => String)
  createdAt: string;
}

@ObjectType()
export class PaginatedGenericBankBoxDto {
  @Field(() => [GenericBankBoxDto])
  items: GenericBankBoxDto[];

  @Field(() => Number)
  total: number;
}
