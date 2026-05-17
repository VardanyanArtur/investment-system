import * as dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const ENV = {
  ADMIN_EMAIL: required("ADMIN_EMAIL"),
  ADMIN_PASSWORD: required("ADMIN_PASSWORD"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",
};
