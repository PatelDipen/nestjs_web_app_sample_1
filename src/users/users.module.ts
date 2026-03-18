import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./application/users.service";
import { UserOrmEntity } from "./infrastructure/user.orm-entity";
import { UsersRepository } from "./infrastructure/users.repository";
import { UsersController } from "./presentation/users.controller";

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
