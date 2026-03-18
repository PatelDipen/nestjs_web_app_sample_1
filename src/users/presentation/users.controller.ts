import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CreateUserDto } from "../application/dto/create-user.dto";
import { UpdateUserDto } from "../application/dto/update-user.dto";
import { UsersService } from "../application/users.service";
import { User } from "../domain/user";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.usersService.remove(id);
    return { message: "User deleted successfully" };
  }
}
