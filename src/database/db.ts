
import Database from "@tauri-apps/plugin-sql";

let connection: Promise<Database> | null = null;

export function getDatabase(): Promise<Database> {
  if (!connection) {
    connection = Database.load("sqlite:cratefire.db").catch(
      (error) => {
        connection = null;
        throw error;
      }
    );
  }

  return connection;
}
