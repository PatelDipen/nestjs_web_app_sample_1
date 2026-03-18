import { IsOptional, IsString, IsEnum, MaxLength } from "class-validator";

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsEnum(["todo", "inprogress", "completed"])
  status?: "todo" | "inprogress" | "completed";
}
