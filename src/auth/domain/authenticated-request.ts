import { Request } from "express";

export interface JwtAccessPayload {
  sub: number;
  user_name: string;
  email: string;
  type: "access";
}

export interface AuthenticatedRequest extends Request {
  user: JwtAccessPayload;
}
