import { FlowEnum } from "@/enums/FlowEnum";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import { OriginEnum } from "@/enums/OriginEnum";
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
import { Bank } from "./Bank";
import { BankBox } from "./BankBox";
import { GenericBank } from "./GenericBank";
import { GenericBankBox } from "./GenericBankBox";
import { Money } from "./Money";
import { Payment } from "./Payment";
import { User } from "./User";

@Entity("operations")
export class Operation extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "enum", enum: LocalEnum })
  local: LocalEnum;

  @Column({ type: "varchar", length: 256 })
  description: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  note?: string;

  @Column({ type: "enum", enum: OriginEnum })
  origin: OriginEnum;

  @Column({ type: "enum", enum: FlowEnum })
  flow: FlowEnum;

  @Column({ type: "enum", enum: OperationEnum, name: "operation_type" })
  operationType: OperationEnum;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discount?: number;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    name: "late_fee",
    nullable: true,
  })
  lateFee?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  rate?: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total: number;

  @Column({ type: "uuid", name: "bank_id", nullable: true })
  bankId?: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank?: Bank;

  @Column({ type: "uuid", name: "bank_box_id", nullable: true })
  bankBoxId?: string;

  @ManyToOne(() => BankBox, (bankBox) => bankBox.id)
  @JoinColumn({ name: "bank_box_id", referencedColumnName: "id" })
  bankBox?: BankBox;

  @Column({ type: "uuid", name: "generic_bank_id", nullable: true })
  genericBankId?: string;

  @ManyToOne(() => GenericBank, (genericBank) => genericBank.id)
  @JoinColumn({ name: "generic_bank_id", referencedColumnName: "id" })
  genericBank?: GenericBank;

  @Column({ type: "uuid", name: "generic_bank_box_id", nullable: true })
  genericBankBoxId?: string;

  @ManyToOne(() => GenericBankBox, (genericBankBox) => genericBankBox.id)
  @JoinColumn({ name: "generic_bank_box_id", referencedColumnName: "id" })
  genericBankBox?: GenericBankBox;

  @Column({ type: "uuid", name: "money_id", nullable: true })
  moneyId?: string;

  @ManyToOne(() => Money, (money) => money.id)
  @JoinColumn({ name: "money_id", referencedColumnName: "id" })
  money?: Money;

  @Column({ type: "uuid", name: "payment_id", nullable: true })
  paymentId?: string;

  @ManyToOne(() => Payment, (paymt) => paymt.id)
  @JoinColumn({ name: "payment_id", referencedColumnName: "id" })
  payment?: Payment;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
