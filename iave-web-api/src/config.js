import { config } from "dotenv";
config();

export const PORT = process.env.PORT || 3001;
export const DB_USER = process.env.DB_USER || "pro_user";
export const DB_PASSWORD = process.env.DB_PASSWORD || "atm1234";
export const DB_SERVER = process.env.DB_SERVER || "server-datos";
export const DB_DATABASE = process.env.DB_DATABASE || "testDB";
export const SERVER = process.env.SERVER || "127.0.0.1";