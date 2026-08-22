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
import { User } from "./User";

@Entity("money")
export class Money {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ length: 64 })
  tag: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  objective?: number;

  @Column({ length: 256, nullable: true })
  description?: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  balance: number;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
