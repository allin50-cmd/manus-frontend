export const ENV = {
  ownerOpenId: process.env.OWNER_OPEN_ID ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
} as const;
