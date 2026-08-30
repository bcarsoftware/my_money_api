import { GenderEnum } from "@/enums/GenderEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UserDto {
  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Date)
  dateBorn: Date;

  @Field(() => GenderEnum)
  gender: GenderEnum;

  @Field(() => String, { nullable: true })
  cpf?: string | null;

  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  salary?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
