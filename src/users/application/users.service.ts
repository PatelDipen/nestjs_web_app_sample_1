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
import { hashPassword } from "../../auth/application/password.util";

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
      return await this.usersRepository.create({
        user_name: createUserDto.user_name,
        email: createUserDto.email,
        password_hash: await hashPassword(createUserDto.password),
      });
    } catch (error: unknown) {
      this.handleUniqueViolation(error);
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    try {
      const updatePayload: {
        user_name?: string;
        email?: string;
        password_hash?: string;
        is_active?: boolean;
        email_verified?: boolean;
        password_changed_at?: Date;
      } = {
        user_name: updateUserDto.user_name,
        email: updateUserDto.email,
        is_active: updateUserDto.is_active,
        email_verified: updateUserDto.email_verified,
      };

      if (updateUserDto.password) {
        updatePayload.password_hash = await hashPassword(
          updateUserDto.password,
        );
        updatePayload.password_changed_at = new Date();
      }

      const user = await this.usersRepository.update(id, updatePayload);
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
      throw new ConflictException("user_name or email already exists");
    }
  }
}
