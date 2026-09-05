import { PixEnum } from "@/enums/PixEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PixDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  bankId: string;

  @Field(() => String)
  tag: string;

  @Field(() => String)
  description?: string | null;

  @Field(() => PixEnum)
  typeKey: PixEnum;

  @Field(() => String)
  key: string;

  @Field(() => String)
  createdAt: string;
}

@ObjectType()
export class PaginatedPixDto {
  @Field(() => [PixDto])
  items: PixDto[];

  @Field(() => Number)
  total: number;
}
