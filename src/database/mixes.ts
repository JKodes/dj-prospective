import { getDatabase } from "./db";

export interface DJMix {
  id: string;
  title: string;
  dj_name: string;
  genre: string;
  source_url: string;
  notes: string;
  created_at: string;
}

export type MixInput = Pick<
  DJMix,
  "title" | "dj_name" | "genre" | "source_url" | "notes"
>;

// Get all saved DJ mixes
export async function getMixes(): Promise<DJMix[]> {
  const db = await getDatabase();

  return db.select<DJMix[]>(
    `SELECT * FROM mixes
     ORDER BY created_at DESC, rowid DESC`
  );
}

// Save a new DJ mix
export async function createMix(input: MixInput): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `INSERT INTO mixes
       (id, title, dj_name, genre, source_url, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      crypto.randomUUID(),
      input.title.trim(),
      input.dj_name.trim(),
      input.genre.trim(),
      input.source_url.trim(),
      input.notes.trim(),
    ]
  );
}

// Update an existing mix
export async function updateMix(
  id: string,
  input: MixInput
): Promise<void> {
  const db = await getDatabase();

  await db.execute(
    `UPDATE mixes
     SET title = $1,
         dj_name = $2,
         genre = $3,
         source_url = $4,
         notes = $5
     WHERE id = $6`,
    [
      input.title.trim(),
      input.dj_name.trim(),
      input.genre.trim(),
      input.source_url.trim(),
      input.notes.trim(),
      id,
    ]
  );
}

// Delete an empty DJ mix
export async function deleteMix(id: string): Promise<void> {
  const db = await getDatabase();

  const rows = await db.select<{ count: number }[]>(
    "SELECT COUNT(*) AS count FROM mix_tracks WHERE mix_id = $1",
    [id]
  );

  if (rows[0]?.count !== 0) {
    throw new Error(
      "This mix contains songs. Removing populated mixes will be added with the tracklist manager."
    );
  }

  await db.execute("DELETE FROM mixes WHERE id = $1", [id]);
}
