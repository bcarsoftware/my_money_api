import { MonthEnum } from "@/enums/MonthEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PaymentDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => RepeatEnum)
  repeat: RepeatEnum;

  @Field(() => String)
  balance: string;

  @Field(() => Number)
  day: number;

  @Field(() => MonthEnum)
  month: MonthEnum;

  @Field(() => String)
  createdAt: string;
}

@ObjectType()
export class PaginatedPaymentsDto {
  @Field(() => [PaymentDto])
  items: PaymentDto[];

  @Field(() => Number)
  total: number;
}
