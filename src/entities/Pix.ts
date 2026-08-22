import { PixEnum } from "@/enums/PixEnum";
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

@Entity("pix")
export class Pix extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "bank_id" })
  bankId: string;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank: Bank;

  @Column({ type: "varchar", length: 64 })
  tag: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  description?: string;

  @Column({ type: "enum", enum: PixEnum, name: "type_key" })
  typeKey: PixEnum;

  @Column({ type: "varchar", length: 512 })
  key: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
