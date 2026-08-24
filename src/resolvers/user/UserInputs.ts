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
import { Field, InputType, registerEnumType } from "type-graphql";

registerEnumType(GenderEnum, {
  name: "GenderEnum",
});

@InputType()
export class UserInput {
  @Field(() => String)
  @MaxLength(64, { message: "Name must be at most 64 characters long." })
  name: string;

  @Field(() => String)
  @IsDate({ message: "Date of birth must be a valid date." })
  dateBorn: Date;

  @Field(() => GenderEnum)
  @IsEnum(GenderEnum, { message: "Gender must be a valid enum value." })
  gender: GenderEnum;

  @Field(() => String)
  @MaxLength(256, { message: "Email must be at most 256 characters long." })
  @IsEmail({}, { message: "Email must be a valid email address." })
  email: string;

  @Field(() => String)
  @IsUsername({ message: "Username must be a valid username." })
  username: string;

  @Field(() => String)
  @IsOptional()
  @MaxLength(256, { message: "Password must be at most 256 characters long." })
  password?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsCurrency({}, { message: "Salary must be a valid currency value." })
  salary?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(/^\+?[0-9]{10,13}$/, {
    message: "Phone number must be a valid phone number.",
  })
  phone?: string | null;
}

@InputType()
export class UserLoginInput {
  @Field(() => String)
  @MaxLength(256, {
    message: "User access must be at most 256 characters long.",
  })
  username: string;

  @Field(() => String)
  @MaxLength(256, { message: "Password must be at most 256 characters long." })
  password: string;
}
