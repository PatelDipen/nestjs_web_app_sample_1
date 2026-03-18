import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateTodoDto } from "./dto/create-todo.dto";
import { UpdateTodoDto } from "./dto/update-todo.dto";
import { Todo } from "../domain/todo";
import { TodosRepository } from "../infrastructure/todos.repository";

@Injectable()
export class TodosService {
  constructor(private readonly todosRepository: TodosRepository) {}

  async findAll(): Promise<Todo[]> {
    return this.todosRepository.findAll();
  }

  async findOne(id: number): Promise<Todo> {
    const todo = await this.todosRepository.findById(id);
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }

    return todo;
  }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todosRepository.create(createTodoDto);
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    await this.findOne(id);

    const todo = await this.todosRepository.update(id, updateTodoDto);
    if (!todo) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }

    return todo;
  }

  async remove(id: number): Promise<void> {
    const affected = await this.todosRepository.delete(id);
    if (!affected) {
      throw new NotFoundException(`Todo with id ${id} not found`);
    }
  }
}
