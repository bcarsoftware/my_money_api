import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  // Mapeia o alias "@/*" do seu tsconfig para o Jest
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: "es2022",
        },
      },
    ],
  },
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  clearMocks: true,
};

export default config;
