import { GenderEnum } from "@/enums/GenderEnum";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class UserDto {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(() => Date)
  dateBorn: Date;

  @Field(() => GenderEnum)
  gender: GenderEnum;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  salary?: string | null;

  @Field({ nullable: true })
  phone?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
