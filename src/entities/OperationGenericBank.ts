import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
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

@Entity("operations_generic_bank")
export class OperationGenericBank extends BaseEntity {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @Column({ type: "uuid", name: "generic_bank_id" })
  genericBankId: string;

  @ManyToOne(() => GenericBank, (genericBank) => genericBank.id)
  @JoinColumn({ name: "generic_bank_id", referencedColumnName: "id" })
  genericBank: GenericBank;

  @Column({ type: "uuid", name: "generic_bank_box_id", nullable: true })
  genericBankBoxId?: string | null;

  @ManyToOne(() => GenericBankBox, (genericBankBox) => genericBankBox.id)
  @JoinColumn({ name: "generic_bank_box_id", referencedColumnName: "id" })
  genericBankBox?: GenericBankBox | null;

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
