import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { Bank } from "./entities/Bank";
import { Money } from "./entities/Money";
import { User } from "./entities/User";

import { Starting1787411777403 } from "./migration/1787411777403-Starting";
import { CreateUser1787412038436 } from "./migration/1787412038436-CreateUser";
import { CreateMoney1787412195283 } from "./migration/1787412195283-CreateMoney";
import { CreateBank1787412644065 } from "./migration/1787412644065-CreateBank";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [User, Money, Bank],
  migrations: [
    Starting1787411777403,
    CreateUser1787412038436,
    CreateMoney1787412195283,
    CreateBank1787412644065,
  ],
  migrationsTransactionMode: "each",
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  subscribers: [],
});
