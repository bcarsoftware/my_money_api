declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DB: string;
      POSTGRES_TIMEZONE: string;
      POSTGRES_PORT: string;
      PORT: string;
      ACCESS_SECRET: string;
      EXPIRES_IN: string;
      SALT_ROUNDS: string;
      MAX_AGE: string;
    }
  }
}

export {};
