import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MoneyDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  tag: string;

  @Field(() => String, { nullable: true })
  objective?: string | null;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String)
  balance: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class PaginatedMoney {
  @Field(() => [MoneyDto])
  money: MoneyDto[];

  @Field(() => Number)
  total: number;
}
