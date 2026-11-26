import { getDatabase } from "./db";
import { supabase } from "../lib/supabase";

export type BackupRow = Record<string, unknown>;

export interface CrateFireBackup {
  backupVersion: 1;
  createdAt: string;
  tables: {
    songs: BackupRow[];
    mixes: BackupRow[];
    mix_tracks: BackupRow[];
    crates: BackupRow[];
    crate_tracks: BackupRow[];
  };
}

export async function exportCloudBackup(): Promise<CrateFireBackup> {
  const db = await getDatabase();

  const songs = await db.select<BackupRow[]>(
    `SELECT * FROM songs ORDER BY created_at, id`,
  );

  const mixes = await db.select<BackupRow[]>(
    `SELECT * FROM mixes ORDER BY created_at, id`,
  );

  const mixTracks = await db.select<BackupRow[]>(
    `SELECT * FROM mix_tracks ORDER BY mix_id, position`,
  );

  const crates = await db.select<BackupRow[]>(
    `SELECT * FROM crates ORDER BY created_at, id`,
  );

  const crateTracks = await db.select<BackupRow[]>(
    `SELECT * FROM crate_tracks ORDER BY crate_id, position`,
  );

  return {
    backupVersion: 1,
    createdAt: new Date().toISOString(),
    tables: {
      songs,
      mixes,
      mix_tracks: mixTracks,
      crates,
      crate_tracks: crateTracks,
    },
  };
}

export async function uploadCloudBackup(): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to back up your data.");
  }

  const backup = await exportCloudBackup();

  const { error } = await supabase.from("user_backups").upsert(
    {
      user_id: user.id,
      backup_version: backup.backupVersion,
      payload: backup,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }
}

function isBackupRow(value: unknown): value is BackupRow {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCrateFireBackup(value: unknown): value is CrateFireBackup {
  if (!isBackupRow(value)) {
    return false;
  }

  if (
    value.backupVersion !== 1 ||
    typeof value.createdAt !== "string" ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    !isBackupRow(value.tables)
  ) {
    return false;
  }

  const tables = value.tables;

  const requiredTables = [
    "songs",
    "mixes",
    "mix_tracks",
    "crates",
    "crate_tracks",
  ] as const;

  return requiredTables.every((table) => {
    const rows = tables[table];

    return Array.isArray(rows) && rows.every(isBackupRow);
  });
}

export async function retrieveCloudBackup(): Promise<CrateFireBackup> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("You must be signed in to retrieve your cloud backup.");
  }

  const { data, error } = await supabase
    .from("user_backups")
    .select("backup_version, payload")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No cloud backup was found for this account.");
  }

  if (data.backup_version !== 1) {
    throw new Error(`Unsupported cloud backup version: ${data.backup_version}`);
  }

  if (!isCrateFireBackup(data.payload)) {
    throw new Error(
      "The cloud backup is invalid or has an unsupported format.",
    );
  }

  return data.payload;
}
