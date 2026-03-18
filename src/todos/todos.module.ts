import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TodosService } from "./application/todos.service";
import { TodoOrmEntity } from "./infrastructure/todo.orm-entity";
import { TodosRepository } from "./infrastructure/todos.repository";
import { TodosController } from "./presentation/todos.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TodoOrmEntity])],
  controllers: [TodosController],
  providers: [TodosService, TodosRepository],
})
export class TodosModule {}
