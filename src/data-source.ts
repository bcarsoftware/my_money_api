import "dotenv/config";
import path from "path";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";

const migrationsDir = path.join(__dirname, "migrations");

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [`${migrationsDir}/*.{ts,js}`],
  migrationsTransactionMode: "each",
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  subscribers: [],
});
