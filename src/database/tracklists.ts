
import { getDatabase } from "./db";

export interface MixTrack {
  id: string;
  mix_id: string;
  song_id: string;
  position: number;
  title: string;
  artist: string;
  rating: number;
}

export interface NewTrack {
  title: string;
  artist: string;
  rating: number;
}

// Get songs in the order a DJ played them
export async function getMixTracks(
  mixId: string
): Promise<MixTrack[]> {
  const db = await getDatabase();

  return db.select<MixTrack[]>(
    `SELECT
       mt.id,
       mt.mix_id,
       mt.song_id,
       mt.position,
       s.title,
       s.artist,
       s.rating
     FROM mix_tracks mt
     JOIN songs s ON s.id = mt.song_id
     WHERE mt.mix_id = $1
     ORDER BY mt.position ASC`,
    [mixId]
  );
}

// Add a song to the end of a DJ's mix
export async function addMixTrack(
  mixId: string,
  input: NewTrack
): Promise<void> {
  const db = await getDatabase();

  const title = input.title.trim();
  const artist = input.artist.trim();

  if (!title) {
    throw new Error("Song title is required.");
  }

  if (input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  // Check whether we've saved this song before
  const existing = await db.select<{ id: string }[]>(
    `SELECT id FROM songs
     WHERE lower(trim(title)) = lower($1)
       AND lower(trim(artist)) = lower($2)
     LIMIT 1`,
    [title, artist]
  );

  let songId = existing[0]?.id;

  // Only create a new song if it isn't in our library
  if (!songId) {
    songId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO songs (id, title, artist, rating)
       VALUES ($1, $2, $3, $4)`,
      [songId, title, artist, input.rating]
    );
  }

  // Determine the next position in this mix
  const rows = await db.select<{ next_position: number }[]>(
    `SELECT COALESCE(MAX(position), 0) + 1
       AS next_position
     FROM mix_tracks
     WHERE mix_id = $1`,
    [mixId]
  );

  const position = rows[0].next_position;

  await db.execute(
    `INSERT INTO mix_tracks
       (id, mix_id, song_id, position)
     VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), mixId, songId, position]
  );
}

// Update your personal fire rating
export async function updateSongRating(
  songId: string,
  rating: number
): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const db = await getDatabase();

  await db.execute(
    `UPDATE songs
     SET rating = $1
     WHERE id = $2`,
    [rating, songId]
  );
}

// Remove one occurrence from a mix, not the song itself
export async function removeMixTrack(
  trackId: string,
  mixId: string
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `DELETE FROM mix_tracks
     WHERE id = $1 AND mix_id = $2`,
    [trackId, mixId]
  );

  // Close gaps in playback positions after removal
  const tracks = await getMixTracks(mixId);

  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].position !== i + 1) {
      await db.execute(
        `UPDATE mix_tracks
         SET position = $1
         WHERE id = $2`,
        [i + 1, tracks[i].id]
      );
    }
  }
}
