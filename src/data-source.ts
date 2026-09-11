import "dotenv/config";
import "reflect-metadata";

import { DataSource } from "typeorm";

import { Bank } from "@/entities/Bank";
import { BankBox } from "@/entities/BankBox";
import { GenericBank } from "@/entities/GenericBank";
import { GenericBankBox } from "@/entities/GenericBankBox";
import { GenericBankInfo } from "@/entities/GenericBankInfo";
import { Invoice } from "@/entities/Invoice";
import { Money } from "@/entities/Money";
import { OperationBank } from "@/entities/OperationBank";
import { OperationGenericBank } from "@/entities/OperationGenericBank";
import { OperationMoney } from "@/entities/OperationMoney";
import { Payment } from "@/entities/Payment";
import { Pix } from "@/entities/Pix";
import { User } from "@/entities/User";

import { CreateUser1787412038436 } from "@/migrations/1787412038436-CreateUser";
import { FunctionUserLogged1787412078185 } from "@/migrations/1787412078185-FunctionUserLogged";
import { CreateMoney1787412195283 } from "@/migrations/1787412195283-CreateMoney";
import { CreateBank1787412644065 } from "@/migrations/1787412644065-CreateBank";
import { CreateBankBox1787412945271 } from "@/migrations/1787412945271-CreateBankBox";
import { CreatePix1787413263792 } from "@/migrations/1787413263792-CreatePix";
import { CreateInvoice1787414231023 } from "@/migrations/1787414231023-CreateInvoice";
import { CreatePayment1787414478068 } from "@/migrations/1787414478068-CreatePayment";
import { CreateGenericBank1787414685365 } from "@/migrations/1787414685365-CreateGenericBank";
import { CreateGenericBankBox1787415068662 } from "@/migrations/1787415068662-CreateGenericBankBox";
import { CreateGenericBankInfo1787415282084 } from "@/migrations/1787415282084-CreateGenericBankInfo";
import { AddIndexGenericBankInfo1788806787561 } from "@/migrations/1788806787561-AddIndexGenericBankInfo";
import { AddCreditLimitToBank1789085195409 } from "@/migrations/1789085195409-AddCreditLimitToBank";
import { AddCreditLimitToGenericBank1789085342041 } from "@/migrations/1789085342041-AddCreditLimitToGenericBank";
import { CreateOperationBank1789091625348 } from "@/migrations/1789091625348-CreateOperationBank";
import { CreateOperationGenericBank1789092353575 } from "@/migrations/1789092353575-CreateOperationGenericBank";
import { CreateOperationMoney1789092836106 } from "@/migrations/1789092836106-CreateOperationMoney";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: parseInt(process.env.POSTGRES_PORT, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: false,
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
    OperationBank,
    OperationGenericBank,
    OperationMoney,
  ],
  migrations: [
    CreateUser1787412038436,
    FunctionUserLogged1787412078185,
    CreateMoney1787412195283,
    CreateBank1787412644065,
    CreateBankBox1787412945271,
    CreatePix1787413263792,
    CreateInvoice1787414231023,
    CreatePayment1787414478068,
    CreateGenericBank1787414685365,
    CreateGenericBankBox1787415068662,
    CreateGenericBankInfo1787415282084,
    AddIndexGenericBankInfo1788806787561,
    AddCreditLimitToBank1789085195409,
    AddCreditLimitToGenericBank1789085342041,
    CreateOperationBank1789091625348,
    CreateOperationGenericBank1789092353575,
    CreateOperationMoney1789092836106,
  ],
  migrationsTransactionMode: "each",
  extra: {
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  subscribers: [],
});
