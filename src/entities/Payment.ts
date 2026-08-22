import { MonthEnum } from "@/enums/MonthEnum";
import { RepeatEnum } from "@/enums/RepeatEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentStatusEnum } from "../enums/PaymentStatusEnum";
import { User } from "./User";

@Entity("payments")
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ length: 64 })
  name: string;

  @Column({ length: 256, nullable: true })
  description?: string;

  @Column({ type: "enum", enum: RepeatEnum })
  repeat: RepeatEnum;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @Column({ type: "int" })
  day: number;

  @Column({ type: "enum", enum: MonthEnum })
  month: MonthEnum;

  @Column({ type: "enum", enum: PaymentStatusEnum })
  status: PaymentStatusEnum;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
