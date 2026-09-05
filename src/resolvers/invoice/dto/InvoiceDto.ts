import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class InvoiceDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => RepeatEnum)
  repeat: RepeatEnum;

  @Field(() => Number)
  installments: number;

  @Field(() => Number)
  paidInstallments: number;

  @Field(() => String)
  balance: string;

  @Field(() => String)
  total: string;

  @Field(() => InvoiceStatusEnum)
  status: InvoiceStatusEnum;

  @Field(() => String)
  createdAt: String;
}

@ObjectType()
export class PaginatedInvoiceDto {
  @Field(() => [InvoiceDto])
  items: InvoiceDto[];

  @Field(() => Number)
  total: number;
}
