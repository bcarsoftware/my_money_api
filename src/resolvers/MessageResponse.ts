import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class MessageResponse {
  @Field({ nullable: true })
  message?: string;
}
