import { GenderEnum } from "@/enums/GenderEnum";

export interface UserDto {
  id: string;
  name: string;
  dateBorn: Date;
  gender: GenderEnum;
  email: string;
  username: string;
  salary?: string;
  phone?: string;
  createdAt: Date;
}
