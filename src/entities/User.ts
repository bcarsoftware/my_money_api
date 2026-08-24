import { GenderEnum } from "@/enums/GenderEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "date", name: "date_born" })
  dateBorn: Date;

  @Column({ type: "enum", enum: GenderEnum })
  gender: GenderEnum;

  @Column({ type: "varchar", length: 256, unique: true })
  email: string;

  @Column({ type: "varchar", length: 128, unique: true })
  username: string;

  @Column({ type: "varchar", length: 256 })
  password: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  salary?: string | null;

  @Column({ type: "varchar", length: 32, nullable: true })
  phone?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
