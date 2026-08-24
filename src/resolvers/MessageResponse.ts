import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class MessageResponse {
  @Field(() => String, { nullable: true })
  message?: string;
}
