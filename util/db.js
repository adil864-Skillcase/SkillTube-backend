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
    for (const query of queries.baseSchemaQueries) {
      await pool.query(query);
    }

    for (const query of queries.featureSchemaQueries) {
      await pool.query(query);
    }

    for (const query of queries.alterSchemaQueries) {
      try {
        await pool.query(query);
      } catch (err) {
        if (err.code !== "42701" && err.code !== "42710") {
          throw err;
        }
      }
    }

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'playlist_category_fk'
        ) THEN
          ALTER TABLE playlist
            ADD CONSTRAINT playlist_category_fk
            FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'video_category_fk'
        ) THEN
          ALTER TABLE video
            ADD CONSTRAINT video_category_fk
            FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    for (const query of queries.seedSchemaQueries) {
      await pool.query(query);
    }

    for (const query of queries.indexSchemaQueries) {
      await pool.query(query);
    }

    console.log("Tables created or already exist!");
  } catch (err) {
    console.error(`Error occurred while creating tables: ${err}`);
  }
}
