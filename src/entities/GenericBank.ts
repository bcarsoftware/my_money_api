import { CurrencyEnum } from "@/enums/CurrencyEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { Bank } from "@/entities/Bank";
import { GenericBankInfo } from "@/entities/GenericBankInfo";
import { User } from "@/entities/User";

@Entity("generic_banks")
export class GenericBank extends BaseEntity {
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

  @Column({ type: "varchar", length: 64 })
  name: string;

  @Column({ type: "enum", enum: CurrencyEnum })
  currency: CurrencyEnum;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: string;

  @OneToMany(
    () => GenericBankInfo,
    (genericBankInfo) => genericBankInfo.genericBank
  )
  bankInfo: Relation<GenericBankInfo[]>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
