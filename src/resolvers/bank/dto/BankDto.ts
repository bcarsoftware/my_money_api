import { AccountEnum } from "@/enums/AccountEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class BankDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  code: string;

  @Field(() => String)
  name: string;

  @Field(() => AccountEnum)
  accountType: AccountEnum;

  @Field(() => String)
  accountNumber: string;

  @Field(() => String)
  agency: string;

  @Field(() => Number)
  balance: number;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class PaginatedBankDto {
  @Field(() => [BankDto])
  items: BankDto[];

  @Field(() => Number)
  total: number;
}
