import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserOrmEntity } from "../users/infrastructure/user.orm-entity";
import { AuthService } from "./application/auth.service";
import { UserRefreshTokenOrmEntity } from "./infrastructure/user-refresh-token.orm-entity";
import { AuthController } from "./presentation/auth.controller";
import { AccessTokenGuard } from "./presentation/guards/access-token.guard";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>("JWT_ACCESS_SECRET") ?? "dev-access-secret",
      }),
    }),
    TypeOrmModule.forFeature([UserOrmEntity, UserRefreshTokenOrmEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
