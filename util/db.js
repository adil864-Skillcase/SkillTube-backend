import pg from "pg";
import { dbConfig } from "../config/configuration.js";
import * as queries from "../model/schema.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: dbConfig.connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  min: 0,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL DB");
    client.release();
  })
  .catch((err) => console.error("DB connection failed:", err));

export async function initDb(pool) {
  try {
    await pool.query(queries.createAppUser);
    await pool.query(queries.createOtpVerification);
    await pool.query(queries.createPlaylist);
    await pool.query(queries.createVideo);
    await pool.query(queries.createVideoIndexes);
    await pool.query(queries.createUserVideoReaction);
    await pool.query(queries.createComment);
    await pool.query(queries.createBookmark);

    console.log("Tables created or already exist!");
  } catch (err) {
    console.error(`Error occurred while creating tables: ${err}`);
  }
}
