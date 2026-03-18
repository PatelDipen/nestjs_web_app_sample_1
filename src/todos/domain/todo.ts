export type TodoStatus = "todo" | "inprogress" | "completed";

export interface Todo {
  id: number;
  title: string;
  status: TodoStatus;
  created_at: Date;
  updated_at: Date;
}
