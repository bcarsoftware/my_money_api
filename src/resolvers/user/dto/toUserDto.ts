import { User } from "@/entities/User";
import { UserDto } from "@/resolvers/user/dto/UserDto";

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  name: user.name,
  dateBorn: user.dateBorn,
  gender: user.gender,
  email: user.email,
  username: user.username,
  salary: user.salary,
  phone: user.phone,
  createdAt: user.createdAt,
});
