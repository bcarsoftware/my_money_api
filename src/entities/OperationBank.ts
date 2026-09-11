import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import { Invoice } from "@/entities/Invoice";
import { User } from "@/entities/User";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("operations_bank")
export class OperationBank extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "uuid", name: "bank_id" })
  bankId: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank: Bank;

  @Column({ type: "uuid", name: "bank_box_id", nullable: true })
  bankBoxId?: string | null;

  @ManyToOne(() => BankBox, (bankBox) => bankBox.id)
  @JoinColumn({ name: "bank_box_id", referencedColumnName: "id" })
  bankBox?: BankBox | null;

  @Column({ type: "uuid", name: "invoice_id", nullable: true })
  invoiceId?: string | null;

  @ManyToOne(() => Invoice, (invoice) => invoice.id)
  @JoinColumn({ name: "invoice_id", referencedColumnName: "id" })
  invoice?: Invoice | null;

  @Column({ type: "varchar", length: 64 })
  tag: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  discount?: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  forfeit?: string | null;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: string;

  @Column({ type: "enum", enum: OperationEnum, name: "type_operation" })
  typeOperation: OperationEnum;

  @Column({ type: "enum", enum: LocalEnum })
  local: LocalEnum;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
