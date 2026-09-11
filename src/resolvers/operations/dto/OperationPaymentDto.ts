import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class OperationPaymentDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  operationRegister: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  bankId?: string | null;

  @Field(() => String, { nullable: true })
  moneyId?: string | null;

  @Field(() => String, { nullable: true })
  invoiceId?: string | null;

  @Field(() => String)
  tag: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String)
  balance: string;

  @Field(() => String, { nullable: true })
  discount?: string | null;

  @Field(() => String, { nullable: true })
  forfeit?: string | null;

  @Field(() => String)
  amount: string;

  @Field(() => OperationEnum)
  typeOperation: OperationEnum;

  @Field(() => LocalEnum)
  local: LocalEnum;

  @Field(() => String)
  createdAt: string;
}

@ObjectType()
export class PaginatedOperationPaymentDto {
  @Field(() => [OperationPaymentDto])
  items: OperationPaymentDto[];

  @Field(() => Number)
  total: number;
}
