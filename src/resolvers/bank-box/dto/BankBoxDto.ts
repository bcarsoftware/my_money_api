import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class BankBoxDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  bankId: string;

  @Field(() => String)
  tag: string;

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
export class PaginatedBankBoxDto {
  @Field(() => [BankBoxDto])
  items: BankBoxDto[];

  @Field(() => Number)
  total: number;
}
