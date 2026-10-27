import { getDatabase } from "./db";

export interface EditMixTrackInput {
  title: string;
  artist: string;
  rating: number;
}

type TrackRow = {
  song_id: string;
  title: string;
  artist: string;
  rating: number;
};

type CountRow = {
  usage_count: number;
};

export async function editMixTrack(
  mixId: string,
  trackId: string,
  input: EditMixTrackInput
): Promise<void> {
  const title = input.title.trim();
  const artist = input.artist.trim();
  const rating = input.rating;

  if (!mixId.trim() || !trackId.trim()) {
    throw new Error("Mix ID and track ID are required.");
  }

  if (!title) {
    throw new Error("Song title is required.");
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error("Fire rating must be between 1 and 5.");
  }

  const db = await getDatabase();

  // Find this particular track occurrence.
  const rows = await db.select<TrackRow[]>(
    `
    SELECT
      mt.song_id,
      s.title,
      s.artist,
      s.rating
    FROM mix_tracks AS mt
    INNER JOIN songs AS s ON s.id = mt.song_id
    WHERE mt.id = $1
      AND mt.mix_id = $2
    LIMIT 1
    `,
    [trackId, mixId]
  );

  const current = rows[0];

  if (!current) {
    throw new Error("Track not found in this mix.");
  }

  // Nothing changed.
  if (
    current.title === title &&
    current.artist === artist &&
    current.rating === rating
  ) {
    return;
  }

  // Determine whether another track uses this song.
  const counts = await db.select<CountRow[]>(
    `
    SELECT COUNT(*) AS usage_count
    FROM mix_tracks
    WHERE song_id = $1
    `,
    [current.song_id]
  );

  const usageCount = counts[0]?.usage_count ?? 0;

  if (usageCount === 1) {
    // This song is used only once.
    // Update its existing record.
    const result = await db.execute(
      `
      UPDATE songs
      SET title = $1,
          artist = $2,
          rating = $3
      WHERE id = $4
      `,
      [title, artist, rating, current.song_id]
    );

    if (result.rowsAffected !== 1) {
      throw new Error("Song update failed.");
    }

    return;
  }

  // The song is shared across mixes or occurrences.
  // Create an independent record to protect the others.
  const newSongId = crypto.randomUUID();

  await db.execute(
    `
    INSERT INTO songs (id, title, artist, rating)
    VALUES ($1, $2, $3, $4)
    `,
    [newSongId, title, artist, rating]
  );

  try {
    // Change only this particular appearance.
    const result = await db.execute(
      `
      UPDATE mix_tracks
      SET song_id = $1
      WHERE id = $2
        AND mix_id = $3
        AND song_id = $4
      `,
      [newSongId, trackId, mixId, current.song_id]
    );

    if (result.rowsAffected !== 1) {
      throw new Error(
        "Track changed before the edit could be saved."
      );
    }
  } catch (error) {
    // Best-effort cleanup of the new, unused song.
    await db.execute(
      `
      DELETE FROM songs
      WHERE id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM mix_tracks
          WHERE song_id = $1
        )
      `,
      [newSongId]
    ).catch(() => {});

    throw error;
  }
}
