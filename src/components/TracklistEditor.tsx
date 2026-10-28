import { useCallback, useEffect, useState, type FormEvent } from "react";

import {
  ArrowLeft,
  Plus,
  ListOrdered,
  Music2,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowUpFromDot,
  ArrowDownToDotIcon,
} from "lucide-react";

import {
  addMixTrack,
  getMixTracks,
  type MixTrack,
} from "../database/mixTracks";

import { removeMixTrack } from "../database/removeMixTrack";
import { editMixTrack } from "../database/editMixTrack";

import {
  reorderMixTrack,
  type MoveDirection,
} from "../database/reorderMixTrack";

type TracklistEditorProps = {
  mixId: string;
  mixTitle: string;
  djName: string;
  onBack: () => void;
};

type SongForm = {
  title: string;
  artist: string;
  rating: number;
};

const emptyForm: SongForm = {
  title: "",
  artist: "",
  rating: 3,
};

function FireRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="cf-fires" role="group" aria-label="Personal fire rating">
      {[1, 2, 3, 4, 5].map((fire) => (
        <button
          key={fire}
          type="button"
          className={fire <= value ? "cf-fire lit" : "cf-fire"}
          onClick={() => onChange(fire)}
          disabled={disabled}
          aria-label={`${fire} out of 5 fires`}
          aria-pressed={value === fire}
        >
          🔥
        </button>
      ))}

      <span className="cf-muted ms-2">{value}/5</span>
    </div>
  );
}

export default function TracklistEditor({
  mixId,
  mixTitle,
  djName,
  onBack,
}: TracklistEditorProps) {
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [newSong, setNewSong] = useState<SongForm>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SongForm>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadTracks = useCallback(async () => {
    const result = await getMixTracks(mixId);
    setTracks(result);
  }, [mixId]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setEditingId(null);

    getMixTracks(mixId)
      .then((result) => {
        if (active) setTracks(result);
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mixId]);

  function errorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }

  // -----------------------------------------
  // Add a song
  // -----------------------------------------

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (busy || editingId || !newSong.title.trim()) return;

    setBusy(true);
    setError("");

    try {
      await addMixTrack(mixId, newSong);
      await loadTracks();
      setNewSong({ ...emptyForm });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // Begin editing a song
  // -----------------------------------------

  function startEditing(track: MixTrack) {
    if (busy) return;

    setEditingId(track.id);

    setEditForm({
      title: track.title,
      artist: track.artist,
      rating: track.rating,
    });

    setError("");
  }

  function cancelEditing() {
    if (busy) return;

    setEditingId(null);
    setEditForm({ ...emptyForm });
  }

  // -----------------------------------------
  // Save changes to a song
  // -----------------------------------------

  async function handleSaveEdit(
    event: FormEvent<HTMLFormElement>,
    track: MixTrack,
  ) {
    event.preventDefault();

    if (busy || editingId !== track.id || !editForm.title.trim()) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await editMixTrack(mixId, track.id, editForm);
      await loadTracks();

      setEditingId(null);
      setEditForm({ ...emptyForm });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // Remove a track from this mix
  // -----------------------------------------

  async function handleRemove(track: MixTrack) {
    if (busy || editingId) return;

    const confirmed = window.confirm(
      `Remove "${track.title}" from "${mixTitle}"?\n\n` +
        "This will not delete the song from other mixes.",
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await removeMixTrack(mixId, track.id);
      await loadTracks();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(track: MixTrack, direction: MoveDirection) {
    if (busy || editingId !== null) return;

    setBusy(true);
    setError("");

    try {
      await reorderMixTrack(mixId, track.id, direction);
      await loadTracks();
    } catch (err) {
      setError(errorMessage(err));

      // Refresh even on failure so the UI reflects SQLite.
      try {
        await loadTracks();
      } catch {
        // Keep the original error visible.
      }
    } finally {
      setBusy(false);
    }
  }

  // -----------------------------------------
  // Render
  // -----------------------------------------

  return (
    <section className="cf-editor">
      <button
        type="button"
        className="btn btn-outline-light mb-4"
        onClick={onBack}
        disabled={busy}
      >
        <ArrowLeft size={16} className="me-2" />
        BACK TO MIXES
      </button>

      <header className="mb-4">
        <h2>{mixTitle}</h2>
        <p className="cf-muted">{djName}</p>
      </header>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add new song */}
      <div className="cf-editor-panel mb-4">
        <h3>Add Song</h3>

        <p className="cf-muted">
          Document songs in the order the DJ played them.
        </p>

        <form onSubmit={handleAdd}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="new-track-title" className="form-label">
                Song Title
              </label>

              <input
                id="new-track-title"
                className="form-control"
                value={newSong.title}
                onChange={(event) =>
                  setNewSong((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Enter song title"
                disabled={busy || editingId !== null}
                required
              />
            </div>

            <div className="col-md-6">
              <label htmlFor="new-track-artist" className="form-label">
                Artist
              </label>

              <input
                id="new-track-artist"
                className="form-control"
                value={newSong.artist}
                onChange={(event) =>
                  setNewSong((current) => ({
                    ...current,
                    artist: event.target.value,
                  }))
                }
                placeholder="Enter artist"
                disabled={busy || editingId !== null}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label">Personal Fire Rating</label>

            <FireRating
              value={newSong.rating}
              onChange={(rating) =>
                setNewSong((current) => ({
                  ...current,
                  rating,
                }))
              }
              disabled={busy || editingId !== null}
            />
          </div>

          <button
            type="submit"
            className="btn cf-primary-btn mt-4"
            disabled={busy || editingId !== null || !newSong.title.trim()}
          >
            <Plus size={17} />
            {busy ? "WORKING..." : "ADD SONG"}
          </button>
        </form>
      </div>

      {/* Existing tracks */}
      <div className="cf-editor-panel">
        <div className="d-flex align-items-center gap-2 mb-3">
          <ListOrdered size={20} className="cf-accent" />
          <h3 className="mb-0">Original Tracklist</h3>
          <span className="cf-muted ms-auto">{tracks.length} tracks</span>
        </div>

        {loading ? (
          <p className="cf-muted">Loading tracks...</p>
        ) : tracks.length === 0 ? (
          <div className="cf-editor-empty">
            <Music2 size={30} />
            <p>No songs added yet.</p>
          </div>
        ) : (
          <div className="cf-editor-tracks">
            {tracks.map((track, index) =>
              editingId === track.id ? (
                <form
                  key={track.id}
                  className="cf-editor-track"
                  onSubmit={(event) => handleSaveEdit(event, track)}
                >
                  <span className="cf-track-number">
                    {String(track.position).padStart(2, "0")}
                  </span>

                  <div className="flex-grow-1">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`title-${track.id}`}
                        >
                          Song Title
                        </label>
                        <input
                          id={`title-${track.id}`}
                          className="form-control"
                          value={editForm.title}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          disabled={busy}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          className="form-label"
                          htmlFor={`artist-${track.id}`}
                        >
                          Artist
                        </label>
                        <input
                          id={`artist-${track.id}`}
                          className="form-control"
                          value={editForm.artist}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              artist: event.target.value,
                            }))
                          }
                          disabled={busy}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <FireRating
                        value={editForm.rating}
                        onChange={(rating) =>
                          setEditForm((current) => ({
                            ...current,
                            rating,
                          }))
                        }
                        disabled={busy}
                      />
                    </div>

                    <div className="d-flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="btn cf-primary-btn"
                        disabled={busy || !editForm.title.trim()}
                      >
                        <Check size={16} />
                        SAVE CHANGES
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-light"
                        onClick={cancelEditing}
                        disabled={busy}
                      >
                        <X size={16} className="me-1" />
                        CANCEL
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div key={track.id} className="cf-editor-track">
                  <span className="cf-track-number">
                    {String(track.position).padStart(2, "0")}
                  </span>

                  <div className="cf-track-info">
                    <strong>{track.title}</strong>
                    <small>{track.artist || "Unknown artist"}</small>
                  </div>

                  <span
                    className="cf-track-rating"
                    aria-label={`${track.rating} out of 5 fires`}
                  >
                    {"🔥".repeat(track.rating)}
                  </span>

                  <div className="d-flex gap-1">
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      onClick={() => void handleMove(track, "up")}
                      disabled={busy || editingId !== null || index === 0}
                      aria-label={`Move ${track.title} up`}
                      title="Move up"
                    >
                      <ArrowUpFromDot size={16} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      onClick={() => void handleMove(track, "down")}
                      disabled={
                        busy ||
                        editingId !== null ||
                        index === tracks.length - 1
                      }
                      aria-label={`Move ${track.title} down`}
                      title="Move down"
                    >
                      <ArrowDownToDotIcon size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={() => startEditing(track)}
                    disabled={busy || editingId !== null}
                    aria-label={`Edit ${track.title}`}
                    title="Edit song"
                  >
                    <Pencil size={17} />
                  </button>

                 
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => handleRemove(track)}
                    disabled={busy || editingId !== null}
                    aria-label={`Remove ${track.title} from mix`}
                    title="Remove song"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
