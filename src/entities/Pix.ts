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
import { PixEnum } from "@/enums/PixEnum";

@Entity("pix")
export class Pix {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "bank_id" })
  bankId: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank: Bank;

  @Column({ length: 64 })
  tag: string;

  @Column({ length: 256 })
  description?: string;

  @Column({ type: "enum", enum: PixEnum, name: "type_key" })
  typeKey: PixEnum;

  @Column({ length: 512 })
  key: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
