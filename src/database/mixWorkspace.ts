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
  tracks: WorkspaceTrack[];
}

type MixRow = {
  id: string;
  title: string;
  dj_name: string;
  genre: string;
};

type TrackRow = WorkspaceTrack & {
  mix_id: string;
};

export async function loadMixWorkspace(): Promise<WorkspaceMix[]> {
  const db = await getDatabase();

  // Load all DJ mixes
  const mixes = await db.select<MixRow[]>(`
    SELECT id, title, dj_name, genre
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
