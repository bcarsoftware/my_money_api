import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { GenderEnum } from "@/enums/GenderEnum";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ length: 64 })
  name: string;

  @Column({ type: "date", name: "date_born" })
  dateBorn: Date;

  @Column({ type: "enum", enum: GenderEnum })
  gender: GenderEnum;

  @Column({ length: 256, unique: true })
  email: string;

  @Column({ length: 128, unique: true })
  username: string;

  @Column({ length: 256 })
  password: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  salary?: number;

  @Column({ length: 32, nullable: true })
  phone?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
