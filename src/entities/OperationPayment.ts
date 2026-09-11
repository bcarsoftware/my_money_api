import { Bank } from "@/entities/Bank";
import { Invoice } from "@/entities/Invoice";
import { Money } from "@/entities/Money";
import { User } from "@/entities/User";
import { LocalEnum } from "@/enums/LocalEnum";
import { OperationEnum } from "@/enums/OperationEnum";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("operations_payment")
@Index("IDX_payment_operation_register_id", ["operationRegister", "id"], {
  unique: true,
})
export class OperationPayment extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "operation_register" })
  operationRegister: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "uuid", name: "bank_id", nullable: true })
  bankId?: string | null;

  @ManyToOne(() => Bank, (bank) => bank.id)
  @JoinColumn({ name: "bank_id", referencedColumnName: "id" })
  bank?: Bank | null;

  @Column({ type: "uuid", name: "money_id", nullable: true })
  moneyId?: string | null;

  @ManyToOne(() => Money, (money) => money.id)
  @JoinColumn({ name: "money_id", referencedColumnName: "id" })
  money?: Money | null;

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
