import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class OperationBankDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  operationRegister: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  bankId: string;

  @Field(() => String, { nullable: true })
  bankBoxId?: string | null;

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
export class PaginatedOperationBankDto {
  @Field(() => [OperationBankDto])
  items: OperationBankDto[];

  @Field(() => Number)
  total: number;
}
