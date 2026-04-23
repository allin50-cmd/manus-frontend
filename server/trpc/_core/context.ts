import type { Request, Response } from 'express';

export type TrpcUser = {
  id: number;
  openId: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
  role: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date | null;
};

export type TrpcContext = {
  user: TrpcUser | null;
  req: Request;
  res: Pick<Response, 'clearCookie'>;
};
