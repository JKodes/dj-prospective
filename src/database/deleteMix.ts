import { getDatabase } from "./db";

export async function deleteMix(mixId: string): Promise<void> {
  const id = mixId.trim();

  if (!id) {
    throw new Error("Mix ID is required.");
  }

  const db = await getDatabase();

  // Verify this mix exists before deletion.
  const existing = await db.select<{ id: string }[]>(
    "SELECT id FROM mixes WHERE id = $1",
    [id]
  );

  if (existing.length === 0) {
    throw new Error("Mix not found.");
  }

  // Remove the mix. Related mix_tracks should be
  // deleted automatically by ON DELETE CASCADE.
  await db.execute(
    "DELETE FROM mixes WHERE id = $1",
    [id]
  );

  // Verify that the mix was actually deleted.
  const remaining = await db.select<{ id: string }[]>(
    "SELECT id FROM mixes WHERE id = $1",
    [id]
  );

  if (remaining.length > 0) {
    throw new Error("Could not delete the DJ mix.");
  }
}
