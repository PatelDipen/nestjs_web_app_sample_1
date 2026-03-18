import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "../application/dto/create-user.dto";
import { UpdateUserDto } from "../application/dto/update-user.dto";
import { User } from "../domain/user";
import { UserOrmEntity } from "./user.orm-entity";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.ormRepository.find({ order: { id: "ASC" } });
  }

  async findById(id: number): Promise<User | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const entity = this.ormRepository.create(createUserDto);
    return this.ormRepository.save(entity);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User | null> {
    await this.ormRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async delete(id: number): Promise<number> {
    const result = await this.ormRepository.delete(id);
    return result.affected ?? 0;
  }
}
