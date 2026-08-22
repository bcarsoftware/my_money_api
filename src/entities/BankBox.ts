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
import { Bank } from "./Bank";

@Entity("bank_boxes")
export class BankBox {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ length: 64 })
  tag: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  objective?: number;

  @Column({ length: 256, nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @Column({ type: "uuid", name: "bank_id" })
  bankId: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank: Bank;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updateAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
