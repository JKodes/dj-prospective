import { getDatabase } from "./db";

export async function deleteMix(mixId: string): Promise<void> {
  if (!mixId.trim()) {
    throw new Error("Mix ID is required.");
  }

  const db = await getDatabase();

  // Verify the mix exists before making changes.
  const existing = await db.select<{ id: string }[]>(
    "SELECT id FROM mixes WHERE id = $1",
    [mixId]
  );

  if (existing.length === 0) {
    throw new Error("Mix not found.");
  }

  // Remove only track associations belonging to this mix.
  await db.execute(
    "DELETE FROM mix_tracks WHERE mix_id = $1",
    [mixId]
  );

  // Remove the mix itself.
  const result = await db.execute(
    "DELETE FROM mixes WHERE id = $1",
    [mixId]
  );

  if (result.rowsAffected !== 1) {
    throw new Error("Could not delete the DJ mix.");
  }
}
