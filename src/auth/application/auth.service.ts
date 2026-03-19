import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID } from "crypto";
import { QueryFailedError, Repository } from "typeorm";
import { UserOrmEntity } from "../../users/infrastructure/user.orm-entity";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { hashPassword, verifyPassword } from "./password.util";
import { UserRefreshTokenOrmEntity } from "../infrastructure/user-refresh-token.orm-entity";

type JwtRefreshPayload = {
  sub: number;
  user_name: string;
  email: string;
  jti: string;
  type: "refresh";
};

type SessionMeta = {
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
};

type PublicUser = {
  id: number;
  user_name: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
};

type AuthResponse = {
  user: PublicUser;
  access_token: string;
  refresh_token: string;
};

type AuthTokensWithJti = AuthResponse & {
  refresh_jti: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly usersRepository: Repository<UserOrmEntity>,
    @InjectRepository(UserRefreshTokenOrmEntity)
    private readonly refreshTokenRepository: Repository<UserRefreshTokenOrmEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(
    registerDto: RegisterDto,
    sessionMeta: SessionMeta,
  ): Promise<AuthResponse> {
    try {
      const user = this.usersRepository.create({
        user_name: registerDto.user_name,
        email: registerDto.email,
        password_hash: await hashPassword(registerDto.password),
      });

      const savedUser = await this.usersRepository.save(user);
      const issued = await this.issueTokens(savedUser, sessionMeta);
      return {
        user: issued.user,
        access_token: issued.access_token,
        refresh_token: issued.refresh_token,
      };
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        (error as { driverError?: { code?: string } }).driverError?.code ===
          "23505"
      ) {
        throw new ConflictException("user_name or email already exists");
      }

      throw error;
    }
  }

  async login(
    loginDto: LoginDto,
    sessionMeta: SessionMeta,
  ): Promise<AuthResponse> {
    const user = await this.usersRepository.findOne({
      where: { email: loginDto.email },
      select: {
        id: true,
        user_name: true,
        email: true,
        password_hash: true,
        is_active: true,
        email_verified: true,
        failed_login_attempts: true,
        locked_until: true,
        last_login_at: true,
        password_changed_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.is_active) {
      throw new UnauthorizedException("Account is inactive");
    }

    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException("Account is temporarily locked");
    }

    const validPassword = await verifyPassword(
      loginDto.password,
      user.password_hash,
    );

    if (!validPassword) {
      const failedAttempts = user.failed_login_attempts + 1;
      const shouldLock = failedAttempts >= 5;

      await this.usersRepository.update(user.id, {
        failed_login_attempts: shouldLock ? 0 : failedAttempts,
        locked_until: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
      });

      throw new UnauthorizedException("Invalid credentials");
    }

    await this.usersRepository.update(user.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date(),
    });

    const issued = await this.issueTokens(user, sessionMeta);
    return {
      user: issued.user,
      access_token: issued.access_token,
      refresh_token: issued.refresh_token,
    };
  }

  async refresh(
    refreshTokenDto: RefreshTokenDto,
    sessionMeta: SessionMeta,
  ): Promise<AuthResponse> {
    let payload: JwtRefreshPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshTokenDto.refresh_token,
        {
          secret:
            this.configService.get<string>("JWT_REFRESH_SECRET") ??
            "dev-refresh-secret",
        },
      );
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token type");
    }

    const session = await this.refreshTokenRepository.findOne({
      where: { jti: payload.jti, user_id: payload.sub },
    });

    if (!session || session.revoked_at || session.expires_at <= new Date()) {
      throw new UnauthorizedException("Refresh session not valid");
    }

    const tokenHash = this.hashToken(refreshTokenDto.refresh_token);
    if (tokenHash !== session.token_hash) {
      await this.refreshTokenRepository.update(session.id, {
        revoked_at: new Date(),
      });
      throw new UnauthorizedException("Refresh token does not match session");
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.is_active) {
      throw new UnauthorizedException("User is not eligible for refresh");
    }

    const rotated = await this.issueTokens(user, sessionMeta);
    await this.refreshTokenRepository.update(session.id, {
      revoked_at: new Date(),
      replaced_by_jti: rotated.refresh_jti,
    });

    return {
      user: rotated.user,
      access_token: rotated.access_token,
      refresh_token: rotated.refresh_token,
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(
        refreshTokenDto.refresh_token,
        {
          secret:
            this.configService.get<string>("JWT_REFRESH_SECRET") ??
            "dev-refresh-secret",
        },
      );

      await this.refreshTokenRepository
        .createQueryBuilder()
        .update(UserRefreshTokenOrmEntity)
        .set({ revoked_at: new Date() })
        .where("jti = :jti", { jti: payload.jti })
        .andWhere("user_id = :userId", { userId: payload.sub })
        .andWhere("revoked_at IS NULL")
        .execute();
    } catch {
      // Token may already be invalid/expired; return success to keep logout idempotent.
    }

    return { message: "Logged out successfully" };
  }

  async logoutAll(userId: number): Promise<{ message: string }> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .update(UserRefreshTokenOrmEntity)
      .set({ revoked_at: new Date() })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL")
      .execute();

    return { message: "All sessions logged out successfully" };
  }

  private async issueTokens(
    user: UserOrmEntity,
    sessionMeta: SessionMeta,
  ): Promise<AuthTokensWithJti> {
    const refreshJti = randomUUID();

    const accessPayload = {
      sub: user.id,
      user_name: user.user_name,
      email: user.email,
      type: "access" as const,
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      user_name: user.user_name,
      email: user.email,
      jti: refreshJti,
      type: "refresh",
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret:
          this.configService.get<string>("JWT_ACCESS_SECRET") ??
          "dev-access-secret",
        expiresIn: this.getExpirySeconds(
          this.configService.get<string>("JWT_ACCESS_EXPIRES_IN"),
          15 * 60,
        ),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret:
          this.configService.get<string>("JWT_REFRESH_SECRET") ??
          "dev-refresh-secret",
        expiresIn: this.getExpirySeconds(
          this.configService.get<string>("JWT_REFRESH_EXPIRES_IN"),
          7 * 24 * 60 * 60,
        ),
      }),
    ]);

    const decodedRefresh: unknown = this.jwtService.decode(refreshToken);
    if (!this.hasExpTimestamp(decodedRefresh)) {
      throw new UnauthorizedException("Unable to create refresh session");
    }

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        user_id: user.id,
        jti: refreshJti,
        token_hash: this.hashToken(refreshToken),
        device_name: sessionMeta.deviceName,
        ip_address: sessionMeta.ipAddress,
        user_agent: sessionMeta.userAgent,
        expires_at: new Date(decodedRefresh.exp * 1000),
      }),
    );

    return {
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        is_active: user.is_active,
        email_verified: user.email_verified,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
      refresh_jti: refreshJti,
    };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private hasExpTimestamp(payload: unknown): payload is { exp: number } {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    const maybeExp = (payload as { exp?: unknown }).exp;
    return typeof maybeExp === "number";
  }

  private getExpirySeconds(
    value: string | undefined,
    fallback: number,
  ): number {
    if (!value) {
      return fallback;
    }

    const trimmed = value.trim();
    if (/^\d+$/.test(trimmed)) {
      return Number(trimmed);
    }

    const match = trimmed.match(/^(\d+)([smhd])$/i);
    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "s":
        return amount;
      case "m":
        return amount * 60;
      case "h":
        return amount * 60 * 60;
      case "d":
        return amount * 24 * 60 * 60;
      default:
        return fallback;
    }
  }
}
