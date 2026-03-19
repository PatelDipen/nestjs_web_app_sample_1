import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserOrmEntity } from "../../users/infrastructure/user.orm-entity";

@Entity("tbl_user_refresh_tokens")
export class UserRefreshTokenOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "bigint" })
  user_id: number;

  @ManyToOne(() => UserOrmEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: UserOrmEntity;

  @Column({ type: "uuid", unique: true })
  jti: string;

  @Column({ type: "varchar", length: 255 })
  token_hash: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  device_name: string | null;

  @Column({ type: "inet", nullable: true })
  ip_address: string | null;

  @Column({ type: "text", nullable: true })
  user_agent: string | null;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  revoked_at: Date | null;

  @Column({ type: "uuid", nullable: true })
  replaced_by_jti: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
