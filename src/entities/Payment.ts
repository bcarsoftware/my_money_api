import { MonthEnum } from "@/enums/MonthEnum";
import { PaymentEnum } from "@/enums/PaymentEnum";
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
import { User } from "./User";

@Entity("payments")
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  description?: string | null;

  @Column({ type: "enum", enum: RepeatEnum })
  repeat: RepeatEnum;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: string;

  @Column({ type: "int" })
  day: number;

  @Column({ type: "enum", enum: MonthEnum })
  month: MonthEnum;

  @Column({ type: "enum", enum: PaymentEnum })
  status: PaymentEnum;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
