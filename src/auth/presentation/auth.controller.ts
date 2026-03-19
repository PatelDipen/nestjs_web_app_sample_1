import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../application/auth.service";
import { LoginDto } from "../application/dto/login.dto";
import { RefreshTokenDto } from "../application/dto/refresh-token.dto";
import { RegisterDto } from "../application/dto/register.dto";
import type { AuthenticatedRequest } from "../domain/authenticated-request";
import { AccessTokenGuard } from "./guards/access-token.guard";

type AuthResponse = {
  user: {
    id: number;
    user_name: string;
    email: string;
    is_active: boolean;
    email_verified: boolean;
  };
  access_token: string;
  refresh_token: string;
};

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.authService.register(registerDto, this.getSessionMeta(req));
  }

  @Post("login")
  login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.authService.login(loginDto, this.getSessionMeta(req));
  }

  @Post("refresh")
  refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    return this.authService.refresh(refreshTokenDto, this.getSessionMeta(req));
  }

  @Post("logout")
  logout(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    return this.authService.logout(refreshTokenDto);
  }

  @UseGuards(AccessTokenGuard)
  @Post("logout-all")
  logoutAll(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    return this.authService.logoutAll(req.user.sub);
  }

  private getSessionMeta(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
    deviceName: string | null;
  } {
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
      ? (forwardedFor[0] ?? null)
      : (forwardedFor?.split(",")[0]?.trim() ?? req.ip ?? null);

    const userAgent = req.headers["user-agent"] ?? null;
    const deviceHeader = req.headers["x-device-name"];
    const deviceName =
      typeof deviceHeader === "string"
        ? deviceHeader
        : Array.isArray(deviceHeader)
          ? (deviceHeader[0] ?? null)
          : null;

    return {
      ipAddress,
      userAgent,
      deviceName,
    };
  }
}
