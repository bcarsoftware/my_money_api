import { GenderEnum } from "@/enums/GenderEnum";
import { IsUsername } from "@/utils/verifiers/decorators/IsUsername";
import {
  IsCurrency,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  Matches,
  MaxLength,
} from "class-validator";
import { Field, ObjectType, registerEnumType } from "type-graphql";

registerEnumType(GenderEnum, {
  name: "GenderEnum",
});

@ObjectType()
export class UserInput {
  @Field()
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field()
  @IsDate({ message: "Date of birth must be a valid date." })
  dateBorn: Date;

  @Field(() => GenderEnum)
  @IsEnum(GenderEnum, { message: "Gender must be a valid enum value." })
  gender: GenderEnum;

  @Field()
  @MaxLength(256, { message: "Email must be at most 256 characters long." })
  @IsEmail({}, { message: "Email must be a valid email address." })
  email: string;

  @Field()
  @IsUsername({ message: "Username must be a valid username." })
  username: string;

  @Field()
  @IsOptional()
  @MaxLength(256, { message: "Password must be at most 256 characters long." })
  password?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "Salary must be a valid currency value." })
  salary?: string | null;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^\+?[0-9]{10,13}$/, {
    message: "Phone number must be a valid phone number.",
  })
  phone?: string | null;
}

@ObjectType()
export class UserLoginInput {
  @Field()
  @MaxLength(256, {
    message: "User access must be at most 256 characters long.",
  })
  username: string;

  @Field()
  @MaxLength(256, { message: "Password must be at most 256 characters long." })
  password: string;
}
