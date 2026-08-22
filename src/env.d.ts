declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_USER: string;
      POSTGRES_PASSWORD: string;
      POSTGRES_DB: string;
      POSTGRES_TIMEZONE: string;
      POSTGRES_PORT: string;
    }
  }
}

export {};
