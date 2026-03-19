import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_users")
export class UserOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 50, unique: true })
  user_name: string;

  @Column({ type: "citext", unique: true })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password_hash: string;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "boolean", default: false })
  email_verified: boolean;

  @Column({ type: "int", default: 0 })
  failed_login_attempts: number;

  @Column({ type: "timestamptz", nullable: true })
  locked_until: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  last_login_at: Date | null;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  password_changed_at: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
