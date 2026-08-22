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
import { GenericBank } from "./GenericBank";

@Entity("generic_bank_boxes")
export class GenericBankBox {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "generic_bank_id" })
  genericBankId: string;

  @ManyToOne(() => GenericBank, (generic_bank) => generic_bank.id)
  @JoinColumn({ name: "generic_bank_id", referencedColumnName: "id" })
  genericBank: GenericBank;

  @Column({ length: 64 })
  name: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  objective?: number;

  @Column({ length: 256, nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
