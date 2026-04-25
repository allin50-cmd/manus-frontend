import type { Request, Response } from 'express';
import type { Tenant } from '../../drizzle/schema';

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
  /** Resolved from subdomain or x-tenant header */
  tenantId: string | null;
  tenant: Tenant | null;
  req: Request;
  res: Pick<Response, 'clearCookie'>;
};

/** Narrowed context available inside authed+tenant procedures */
export type TenantedContext = TrpcContext & {
  user: TrpcUser;
  tenantId: string;
  tenant: Tenant;
};
