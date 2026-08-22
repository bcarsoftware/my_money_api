import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { AccountEnum } from "@/enums/AccountEnum";

@Entity("banks")
export class Bank {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ length: 8 })
  codigo: string;

  @Column({ length: 64 })
  name: string;

  @Column({ type: "enum", enum: AccountEnum, name: "account_type" })
  accountType: AccountEnum;

  @Column({ length: 64 })
  accountNumber: string;

  @Column({ length: 32 })
  agency: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updateAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
