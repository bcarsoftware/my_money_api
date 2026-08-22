import express from "express";
import http from "http";

import { AppDataSource } from "./data-source";
import { mainApp } from "./server/apollo";

async function starting() {
  console.log("Starting the application...");

  try {
    await mainApp();
  } catch (error) {
    console.error("Error during App initialization", error);
    process.exit(1);
  }
}

starting();
