import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "../domain/user";
import { UsersRepository } from "../infrastructure/users.repository";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.usersRepository.create(createUserDto);
    } catch (error: unknown) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    try {
      const user = await this.usersRepository.update(id, updateUserDto);
      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      return user;
    } catch (error: unknown) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const affected = await this.usersRepository.delete(id);
    if (!affected) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  private handleUniqueViolation(error: unknown): void {
    if (
      error instanceof QueryFailedError &&
      typeof (error as { driverError?: { code?: string } }).driverError
        ?.code === "string" &&
      (error as { driverError?: { code?: string } }).driverError?.code ===
        "23505"
    ) {
      throw new ConflictException("user_name already exists");
    }
  }
}
