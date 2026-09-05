import { CurrencyEnum } from "@/enums/CurrencyEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class GenBankInfoDto {
  id: string;
  name: string;
  value: string;
}

@ObjectType()
export class GenericBankDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  bankId: string;

  @Field(() => String)
  name: string;

  @Field(() => CurrencyEnum)
  currency: CurrencyEnum;

  @Field(() => String)
  balance: string;

  @Field(() => [GenBankInfoDto])
  bankInfo: GenBankInfoDto[];

  @Field(() => String)
  createdAt: string;
}

export class PaginatedGenericBankDto {
  @Field(() => [GenericBankDto])
  items: GenericBankDto[];

  @Field(() => Number)
  total: number;
}
