import { __prodLike__ } from "@/constants/constants";
import { MyContext } from "@/context/MyContext";
import { AppDataSource } from "@/data-source";
import { ValidationError } from "@/errors/ValidationError";
import { resolvers } from "@/resolvers/resolvers";
import { buildHttpContext } from "@/utils/buildHttpContext";
import { setupHealthCheckEndpoint } from "@/utils/setupHealthCheckEndpoint";
import { ApolloServer } from "@apollo/server";
import { unwrapResolverError } from "@apollo/server/errors";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import { ArgumentValidationError, buildSchema } from "type-graphql";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";

export const mainApp = async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();

  const app = express();
  const httpServer = http.createServer(app);

  app.set("trust proxy", 1);
  app.use(cookieParser());

  const allowedOrigins = [process.env.CORS_ORIGIN];
  if (!__prodLike__) {
    allowedOrigins.push("http://localhost:5173");
  }

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || allowedOrigins.includes(origin) || !__prodLike__)
        return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  };

  app.use(cors(corsOptions));

  setupHealthCheckEndpoint(app);

  const schema = await buildSchema({
    resolvers,
    validate: true,
  });

  const plugins = [ApolloServerPluginDrainHttpServer({ httpServer })];
  if (__prodLike__) plugins.push(ApolloServerPluginLandingPageDisabled());

  const server = new ApolloServer<MyContext>({
    schema,
    introspection: !__prodLike__,
    plugins,
    formatError: (formattedError, error) => {
      const originalError = unwrapResolverError(error);
      if (originalError instanceof ArgumentValidationError) {
        return new ValidationError(originalError.extensions.validationErrors);
      }
      return formattedError;
    },
  });

  await server.start();

  app.use(
    "/graphql",
    cors(corsOptions),
    express.json({ limit: "5mb" }),
    expressMiddleware(server, {
      context: ({ req, res }) => buildHttpContext(req, res),
    })
  );

  const PORT = process.env.PORT ?? 4000;
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: PORT }, resolve)
  );

  console.log(`🚀 Server ready`);
  console.log(`   Sandbox:  http://localhost:${PORT}/graphql`);
  console.log(`   WS:       ws://localhost:${PORT}/graphql`);
  console.log(`   Health:   http://localhost:${PORT}/api/health`);
};
