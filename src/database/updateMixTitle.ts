
import { getDatabase } from "./db";

type MixRow = {
  id: string;
  title: string;
};

export async function updateMixTitle(
  mixId: string,
  newTitle: string
): Promise<void> {
  const id = mixId.trim();
  const title = newTitle.trim();

  if (!id) {
    throw new Error("Mix ID is required.");
  }

  if (!title) {
    throw new Error("Mix title cannot be empty.");
  }

  const db = await getDatabase();

  // Step 1: Confirm the mix actually exists.
  const existing = await db.select<MixRow[]>(
    `SELECT id, title FROM mixes WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (existing.length === 0) {
    throw new Error(
      "Mix not found in SQLite. Please reload your saved mixes."
    );
  }

  // Step 2: Nothing needs updating if titles match.
  if (existing[0].title === title) {
    return;
  }

  // Step 3: Update only this mix title.
  await db.execute(
    `UPDATE mixes SET title = $1 WHERE id = $2`,
    [title, id]
  );

  // Step 4: Verify the new title was saved.
  const updated = await db.select<MixRow[]>(
    `SELECT id, title FROM mixes WHERE id = $1 LIMIT 1`,
    [id]
  );

  if (updated[0]?.title !== title) {
    throw new Error(
      "Unable to verify the updated mix title."
    );
  }
}
