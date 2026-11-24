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
    `SELECT * FROM songs ORDER BY created_at, id`
  );

  const mixes = await db.select<BackupRow[]>(
    `SELECT * FROM mixes ORDER BY created_at, id`
  );

  const mixTracks = await db.select<BackupRow[]>(
    `SELECT * FROM mix_tracks ORDER BY mix_id, position`
  );

  const crates = await db.select<BackupRow[]>(
    `SELECT * FROM crates ORDER BY created_at, id`
  );

  const crateTracks = await db.select<BackupRow[]>(
    `SELECT * FROM crate_tracks ORDER BY crate_id, position`
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

  const { error } = await supabase
    .from("user_backups")
    .upsert(
      {
        user_id: user.id,
        backup_version: backup.backupVersion,
        payload: backup,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    throw error;
  }
}