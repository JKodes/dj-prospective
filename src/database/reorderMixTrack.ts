import { getDatabase } from "./db";

type TrackPosition = {
  id: string;
  position: number;
};

export type MoveDirection = "up" | "down";

export async function reorderMixTrack(
  mixId: string,
  trackId: string,
  direction: MoveDirection
): Promise<void> {
  if (!mixId.trim() || !trackId.trim()) {
    throw new Error("Mix ID and track ID are required.");
  }

  if (direction !== "up" && direction !== "down") {
    throw new Error("Invalid move direction.");
  }

  const db = await getDatabase();

  const tracks = await db.select<TrackPosition[]>(
    `
    SELECT id, position
    FROM mix_tracks
    WHERE mix_id = $1
    ORDER BY position ASC
    `,
    [mixId]
  );

  const index = tracks.findIndex(
    (track) => track.id === trackId
  );

  if (index === -1) {
    throw new Error("Track not found in this mix.");
  }

  const neighborIndex =
    direction === "up" ? index - 1 : index + 1;

  if (
    neighborIndex < 0 ||
    neighborIndex >= tracks.length
  ) {
    return;
  }

  const current = tracks[index];
  const neighbor = tracks[neighborIndex];

  // Use an unused, positive position because
  // the schema requires positions >= 1.
  const temporaryPosition =
    Math.max(...tracks.map((track) => track.position)) + 1;

  // SQLite enforces UNIQUE(mix_id, position)
  // immediately, so a direct swap would fail.
  //
  // This is a three-statement move, not a
  // database transaction. We attempt to recover
  // if one of the later statements fails.

  await db.execute(
    `
    UPDATE mix_tracks
    SET position = $1
    WHERE id = $2
      AND mix_id = $3
      AND position = $4
    `,
    [temporaryPosition, current.id, mixId, current.position]
  ).then((result) => {
    if (result.rowsAffected !== 1) {
      throw new Error("Track changed before moving.");
    }
  });

  let neighborMoved = false;

  try {
    const second = await db.execute(
      `
      UPDATE mix_tracks
      SET position = $1
      WHERE id = $2
        AND mix_id = $3
        AND position = $4
      `,
      [current.position, neighbor.id, mixId, neighbor.position]
    );

    if (second.rowsAffected !== 1) {
      throw new Error("Adjacent track changed before moving.");
    }

    neighborMoved = true;

    const third = await db.execute(
      `
      UPDATE mix_tracks
      SET position = $1
      WHERE id = $2
        AND mix_id = $3
        AND position = $4
      `,
      [neighbor.position, current.id, mixId, temporaryPosition]
    );

    if (third.rowsAffected !== 1) {
      throw new Error("Could not finish track move.");
    }
  } catch (error) {
    // Attempt to put both rows back.
    // This is best-effort recovery, not an
    // atomic transaction guarantee.
    try {
      if (neighborMoved) {
        await db.execute(
          `
          UPDATE mix_tracks
          SET position = $1
          WHERE id = $2
            AND mix_id = $3
            AND position = $4
          `,
          [
            neighbor.position,
            neighbor.id,
            mixId,
            current.position,
          ]
        );
      }

      await db.execute(
        `
        UPDATE mix_tracks
        SET position = $1
        WHERE id = $2
          AND mix_id = $3
          AND position = $4
        `,
        [
          current.position,
          current.id,
          mixId,
          temporaryPosition,
        ]
      );
    } catch {
      throw new Error(
        "Track move failed and automatic recovery " +
        "could not complete. Reload the tracklist " +
        "and review its order."
      );
    }

    throw error;
  }
}
