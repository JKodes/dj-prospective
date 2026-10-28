import { getDatabase } from "./db";

type RatingRow = {
  rating: number;
};

export async function updateMixRating(
  mixId: string,
  rating: number
): Promise<void> {
  if (!mixId.trim()) {
    throw new Error("Mix ID is required.");
  }

  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const db = await getDatabase();

  await db.execute(
    "UPDATE mixes SET rating = $1 WHERE id = $2",
    [rating, mixId]
  );

  const rows = await db.select<RatingRow[]>(
    "SELECT rating FROM mixes WHERE id = $1",
    [mixId]
  );

  if (rows[0]?.rating !== rating) {
    throw new Error("Mix rating could not be saved.");
  }
}
