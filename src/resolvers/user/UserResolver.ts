import { generateAccessToken } from "@/auth/generateAccessToken";
import { USER_NOT_FOUND, USER_PASSWORD_NOT_MATCH } from "@/constants/constants";
import { cookieOptions } from "@/constants/cookies";
import { type MyContext } from "@/context/MyContext";
import { User } from "@/entities/User";
import { UserDto } from "@/resolvers/user/dto/UserDto";
import { loggedContext } from "@/utils/loggedContext";
import { comparePassword, hashPassword } from "@/utils/passwordUtil";
import { Protected } from "@/utils/verifiers/decorators/Protected";
import { Arg, Ctx, Mutation, Resolver } from "type-graphql";
import { MessageResponse } from "../MessageResponse";
import { toUserDto } from "./dto/toUserDto";
import { UserInput, UserLoginInput } from "./UserInputs";

@Resolver()
export class UserResolver {
  @Mutation(() => UserDto)
  async loginUser(
    @Arg("input", () => UserLoginInput) input: UserLoginInput,
    @Ctx() context: MyContext
  ): Promise<UserDto> {
    try {
      const user = await User.findOne({
        where: [{ username: input.username }, { email: input.username }],
      });

      if (!user) throw new Error(USER_NOT_FOUND);

      if (!comparePassword(input.password, user.password)) {
        throw new Error(USER_PASSWORD_NOT_MATCH);
      }

      const accessToken = await generateAccessToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      context.res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: parseInt(process.env.MAX_AGE || "3600000"),
      });

      return toUserDto(user);
    } catch (error) {
      console.error("Error logging in user:", error);
      throw new Error("Failed to login user.");
    }
  }

  @Mutation(() => MessageResponse)
  async forgotPassowrd(
    @Arg("input", () => UserLoginInput) input: UserLoginInput
  ): Promise<MessageResponse> {
    try {
      const user = await User.findOne({
        where: [{ username: input.username }, { email: input.username }],
      });

      if (!user) throw new Error(USER_NOT_FOUND);

      user.password = await hashPassword(input.password);

      await user.save();

      return { message: "Password reset successfully." };
    } catch (error) {
      console.error("Error resetting password:", error);
      throw new Error("Failed to reset password.");
    }
  }

  @Mutation(() => UserDto)
  async createUser(
    @Arg("input", () => UserInput) input: UserInput
  ): Promise<UserDto> {
    if (!input.password) throw new Error("Password is required.");

    try {
      const password = await hashPassword(input.password);

      const user = await User.create({
        ...input,
        dateBorn: new Date(input.dateBorn),
        password,
      }).save();

      return toUserDto(user);
    } catch (error) {
      console.error("Error creating user:", error);

      throw new Error("Failed to create user.");
    }
  }

  @Protected()
  @Mutation(() => UserDto)
  async updateUser(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("input", () => UserInput) input: UserInput
  ): Promise<UserDto> {
    return loggedContext(context, async (em) => {
      const user = await em.findOne(User, { where: { id } });

      if (!user) throw new Error(USER_NOT_FOUND);

      try {
        const dateBorn =
          new Date(new Date(input.dateBorn) === user.dateBorn ? user.dateBorn : input.dateBorn);

        user.name = input.name === user.name ? user.name : input.name;
        user.dateBorn = dateBorn;
        user.gender = input.gender === user.gender ? user.gender : input.gender;
        user.email = input.email === user.email ? user.email : input.email;
        user.username =
          input.username === user.username ? user.username : input.username;

        user.salary =
          input.salary === null || input.salary !== user.salary
            ? input.salary
            : user.salary;
        user.phone =
          input.phone === null || input.phone !== user.phone
            ? input.phone
            : user.phone;

        await em.save(user);

        const accessToken = await generateAccessToken({
          userId: user.id,
          username: user.username,
          email: user.email,
        });

        context.res.clearCookie("accessToken", cookieOptions);
        context.res.cookie("accessToken", accessToken, {
          ...cookieOptions,
          maxAge: parseInt(process.env.MAX_AGE || "3600000"),
        });

        return toUserDto(user);
      } catch (error) {
        console.error("Error updating user:", error);
        throw new Error("Failed to update user.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async changePassword(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string,
    @Arg("newPassword", () => String) newPassword: string
  ): Promise<MessageResponse> {
    return loggedContext(context, async (em) => {
      const user = await em.findOne(User, { where: { id } });

      if (!user) throw new Error(USER_NOT_FOUND);

      try {
        user.password = await hashPassword(newPassword);
        await em.save(user);

        return { message: "Password changed successfully." };
      } catch (error) {
        console.error("Error changing password:", error);
        throw new Error("Failed to change password.");
      }
    });
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async logoutUser(@Ctx() context: MyContext): Promise<MessageResponse> {
    try {
      context.res.clearCookie("accessToken", cookieOptions);
      return { message: "User logged out successfully." };
    } catch (error) {
      console.error("Error logging out user:", error);
      throw new Error("Failed to logout user.");
    }
  }

  @Protected()
  @Mutation(() => MessageResponse)
  async deleteUser(
    @Ctx() context: MyContext,
    @Arg("id", () => String) id: string
  ): Promise<MessageResponse> {
    return loggedContext(context, async (em) => {
      const user = await em.findOne(User, { where: { id } });

      if (!user) throw new Error(USER_NOT_FOUND);

      try {
        await em.softRemove(user);

        context.res.clearCookie("accessToken", cookieOptions);

        return { message: "User deleted successfully." };
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user.");
      }
    });
  }
}
