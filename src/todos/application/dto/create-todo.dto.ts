import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}
