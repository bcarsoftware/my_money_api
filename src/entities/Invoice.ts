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
import { Bank } from "./Bank";
import { InvoiceStatusEnum } from "@/enums/InvoiceStatusEnum";

@Entity("invoices")
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "bank_id" })
  bankId: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank: Bank;

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  description?: string | null;

  @Column({ type: "enum", enum: RepeatEnum })
  repeat: RepeatEnum;

  @Column({ type: "int", default: 1 })
  installments: number;

  @Column({ type: "int", default: 0, name: "paid_installments" })
  paidInstallments: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total: string;

  @Column({ type: "enum", enum: InvoiceStatusEnum })
  status: InvoiceStatusEnum;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
