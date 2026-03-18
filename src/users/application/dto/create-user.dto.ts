import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  user_name: string;
}
