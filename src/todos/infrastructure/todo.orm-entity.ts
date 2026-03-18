import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("tbl_todo")
export class TodoOrmEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({
    type: "enum",
    enum: ["todo", "inprogress", "completed"],
    default: "todo",
  })
  status: "todo" | "inprogress" | "completed";

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
