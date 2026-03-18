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
import { CreateTodoDto } from "../application/dto/create-todo.dto";
import { UpdateTodoDto } from "../application/dto/update-todo.dto";
import { TodosService } from "../application/todos.service";
import { Todo } from "../domain/todo";

@Controller("todos")
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(): Promise<Todo[]> {
    return this.todosService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<Todo> {
    return this.todosService.findOne(id);
  }

  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todosService.create(createTodoDto);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<Todo> {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(":id")
  async remove(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.todosService.remove(id);
    return { message: "Todo deleted successfully" };
  }
}
