import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("money")
export class Money {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ length: 64 })
  tag: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updateAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
