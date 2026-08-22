import { AccountEnum } from "@/enums/AccountEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@Entity("banks")
@Index("IDX_banks_user_id_code", ["user_id", "code"], { unique: true })
export class Bank extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "varchar", length: 8 })
  code: string;

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "enum", enum: AccountEnum, name: "account_type" })
  accountType: AccountEnum;

  @Column({ type: "varchar", length: 64 })
  accountNumber: string;

  @Column({ type: "varchar", length: 32 })
  agency: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
