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

export async function getMixTracks(
  mixId: string
): Promise<MixTrack[]> {
  if (!mixId.trim()) {
    throw new Error("A mix ID is required.");
  }

  const db = await getDatabase();

  return db.select<MixTrack[]>(
    `
    SELECT
      mt.id,
      mt.mix_id,
      mt.song_id,
      mt.position,
      s.title,
      s.artist,
      s.rating
    FROM mix_tracks AS mt
    INNER JOIN songs AS s
      ON mt.song_id = s.id
    WHERE mt.mix_id = $1
    ORDER BY mt.position ASC, mt.rowid ASC
    `,
    [mixId]
  );
}




export interface NewMixTrack {
  title: string;
  artist: string;
  rating: number;
}

export async function addMixTrack(
  mixId: string,
  input: NewMixTrack
): Promise<void> {
  const db = await getDatabase();

  const title = input.title.trim();
  const artist = input.artist.trim();

  if (!mixId || !title) {
    throw new Error("Mix ID and song title are required.");
  }

  if (
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5
  ) {
    throw new Error("Fire rating must be between 1 and 5.");
  }

  // Reuse a song if it already exists in another mix.
  const existingSongs = await db.select<{ id: string }[]>(
    `SELECT id
     FROM songs
     WHERE LOWER(TRIM(title)) = LOWER($1)
       AND LOWER(TRIM(artist)) = LOWER($2)
     LIMIT 1`,
    [title, artist]
  );

  let songId = existingSongs[0]?.id;

  if (!songId) {
    songId = crypto.randomUUID();

    await db.execute(
      `INSERT INTO songs (id, title, artist, rating)
       VALUES ($1, $2, $3, $4)`,
      [songId, title, artist, input.rating]
    );
  }

  // Add to the end of the selected mix.
  const positions = await db.select<
    { next_position: number }[]
  >(
    `SELECT COALESCE(MAX(position), 0) + 1
       AS next_position
     FROM mix_tracks
     WHERE mix_id = $1`,
    [mixId]
  );

  const position = positions[0]?.next_position ?? 1;

  await db.execute(
    `INSERT INTO mix_tracks
       (id, mix_id, song_id, position)
     VALUES ($1, $2, $3, $4)`,
    [
      crypto.randomUUID(),
      mixId,
      songId,
      position,
    ]
  );
}
