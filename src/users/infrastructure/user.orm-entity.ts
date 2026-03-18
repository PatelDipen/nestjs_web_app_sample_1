import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("tbl_users")
export class UserOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100, unique: true })
  user_name: string;

  @CreateDateColumn()
  created_at: Date;
}
