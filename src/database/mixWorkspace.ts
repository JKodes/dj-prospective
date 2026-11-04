import { getDatabase } from "./db";

export interface WorkspaceTrack {
  id: string;
  title: string;
  artist: string;
  rating: number;
  position: number;
}

export interface WorkspaceMix {
  id: string;
  title: string;
  dj: string;
  genre: string;
  year: number | null;
  rating: number;
  tracks: WorkspaceTrack[];
}

type MixRow = {
  id: string;
  title: string;
  dj_name: string;
  genre: string;
  year: number | null;
  rating: number;
};

type TrackRow = WorkspaceTrack & {
  mix_id: string;
};

export async function loadMixWorkspace(): Promise<WorkspaceMix[]> {
  const db = await getDatabase();

  // Load all DJ mixes
  const mixes = await db.select<MixRow[]>(`
    SELECT id, title, dj_name, genre, year, rating
    FROM mixes
    ORDER BY created_at DESC, rowid DESC
  `);

  // Load songs in their original playback order
  const tracks = await db.select<TrackRow[]>(`
    SELECT
      mt.mix_id,
      s.id,
      s.title,
      s.artist,
      s.rating,
      mt.position
    FROM mix_tracks mt
    INNER JOIN songs s
      ON s.id = mt.song_id
    ORDER BY mt.mix_id, mt.position ASC
  `);

  // Connect tracks to their respective mixes
  return mixes.map((mix) => ({
    id: mix.id,
    title: mix.title,
    dj: mix.dj_name,
    genre: mix.genre,
    year: mix.year,
    rating: mix.rating,
    tracks: tracks
      .filter((track) => track.mix_id === mix.id)
      .map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        rating: track.rating,
        position: track.position,
      })),
  }));
}

export type NewMixInput = {
  title: string;
  dj_name: string;
  genre: string;
  year: number | null;
  source_url: string;
  notes: string;
  rating: number;
};

export async function createResearchMix(input: NewMixInput): Promise<string> {
  const title = input.title.trim();
  const djName = input.dj_name.trim();

  if (!title || !djName) {
    throw new Error("Mix title and DJ name are required.");
  }

  if (
    input.year !== null &&
    (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100)
  ) {
    throw new Error("Mix year must be between 1900 and 2100.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 0 || input.rating > 5) {
    throw new Error("Mix rating must be between 0 and 5.");
  }

  const db = await getDatabase();
  const id = crypto.randomUUID();

  await db.execute(
    `INSERT INTO mixes
      (id, title, dj_name, genre, year, source_url, notes, rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      title,
      djName,
      input.genre.trim(),
      input.year,
      input.source_url.trim(),
      input.notes.trim(),
      input.rating,
    ],
  );

  return id;
}
