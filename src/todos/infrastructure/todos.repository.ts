import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateTodoDto } from "../application/dto/create-todo.dto";
import { UpdateTodoDto } from "../application/dto/update-todo.dto";
import { Todo } from "../domain/todo";
import { TodoOrmEntity } from "./todo.orm-entity";

@Injectable()
export class TodosRepository {
  constructor(
    @InjectRepository(TodoOrmEntity)
    private readonly ormRepository: Repository<TodoOrmEntity>,
  ) {}

  async findAll(): Promise<Todo[]> {
    return this.ormRepository.find({ order: { id: "ASC" } });
  }

  async findById(id: number): Promise<Todo | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const entity = this.ormRepository.create(createTodoDto);
    return this.ormRepository.save(entity);
  }

  async update(id: number, updateTodoDto: UpdateTodoDto): Promise<Todo | null> {
    await this.ormRepository.update(id, updateTodoDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<number> {
    const result = await this.ormRepository.delete(id);
    return result.affected ?? 0;
  }
}
