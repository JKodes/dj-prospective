import { getDatabase } from "./db";

export async function removeMixTrack(
  mixId: string,
  trackId: string
): Promise<void> {
  if (!mixId.trim() || !trackId.trim()) {
    throw new Error("Mix ID and track ID are required.");
  }

  const db = await getDatabase();

  // Remove the track from this specific mix only.
  const result = await db.execute(
    `DELETE FROM mix_tracks
     WHERE id = $1 AND mix_id = $2`,
    [trackId, mixId]
  );

  if (result.rowsAffected !== 1) {
    throw new Error("Track not found in this mix.");
  }
}
