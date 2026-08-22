import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";

import { Bank } from "./entities/Bank";
import { BankBox } from "./entities/BankBox";
import { GenericBank } from "./entities/GenericBank";
import { GenericBankBox } from "./entities/GenericBankBox";
import { GenericBankInfo } from "./entities/GenericBankInfo";
import { Invoice } from "./entities/Invoice";
import { Money } from "./entities/Money";
import { Operation } from "./entities/Operation";
import { Payment } from "./entities/Payment";
import { Pix } from "./entities/Pix";
import { User } from "./entities/User";

import { Starting1787411777403 } from "./migration/1787411777403-Starting";
import { CreateUser1787412038436 } from "./migration/1787412038436-CreateUser";
import { CreateMoney1787412195283 } from "./migration/1787412195283-CreateMoney";
import { CreateBank1787412644065 } from "./migration/1787412644065-CreateBank";
import { CreateBankBox1787412945271 } from "./migration/1787412945271-CreateBankBox";
import { CreatePix1787413263792 } from "./migration/1787413263792-CreatePix";
import { CreateInvoice1787414231023 } from "./migration/1787414231023-CreateInvoice";
import { CreatePayment1787414478068 } from "./migration/1787414478068-CreatePayment";
import { CreateGenericBank1787414685365 } from "./migration/1787414685365-CreateGenericBank";
import { CreateGenericBankBox1787415068662 } from "./migration/1787415068662-CreateGenericBankBox";
import { CreateGenericBankInfo1787415282084 } from "./migration/1787415282084-CreateGenericBankInfo";
import { CreateOperation1787415560149 } from "./migration/1787415560149-CreateOperation";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: true,
  logging: false,
  entities: [
    User,
    Money,
    Bank,
    BankBox,
    Pix,
    Invoice,
    Payment,
    GenericBank,
    GenericBankBox,
    GenericBankInfo,
    Operation,
  ],
  migrations: [
    Starting1787411777403,
    CreateUser1787412038436,
    CreateMoney1787412195283,
    CreateBank1787412644065,
    CreateBankBox1787412945271,
    CreatePix1787413263792,
    CreateInvoice1787414231023,
    CreatePayment1787414478068,
    CreateGenericBank1787414685365,
    CreateGenericBankBox1787415068662,
    CreateGenericBankInfo1787415282084,
    CreateOperation1787415560149,
  ],
  migrationsTransactionMode: "each",
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  subscribers: [],
});
