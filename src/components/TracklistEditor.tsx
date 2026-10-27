import { removeMixTrack } from "../database/removeMixTrack";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Plus,
  ListOrdered,
  Music2,
  Trash2,
} from "lucide-react";

import {
  addMixTrack,
  getMixTracks,
  type MixTrack,
} from "../database/mixTracks";


type TracklistEditorProps = {
  mixId: string;
  mixTitle: string;
  djName: string;
  onBack: () => void;
};

export default function TracklistEditor({
  mixId,
  mixTitle,
  djName,
  onBack,
}: TracklistEditorProps) {
  const [tracks, setTracks] = useState<MixTrack[]>([]);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rating, setRating] = useState(3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingTrackId, setDeletingTrackId] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");

  // -----------------------------------------
  // Load ordered tracks from SQLite
  // -----------------------------------------

  const loadTracks = useCallback(async () => {
    const result = await getMixTracks(mixId);
    setTracks(result);
  }, [mixId]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");

    getMixTracks(mixId)
      .then((result) => {
        if (active) {
          setTracks(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : String(err)
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mixId]);

  // -----------------------------------------
  // Add a song to the selected DJ mix
  // -----------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !title.trim()) return;

    setSaving(true);
    setError("");

    try {
      await addMixTrack(mixId, {
        title: title.trim(),
        artist: artist.trim(),
        rating,
      });

      await loadTracks();

      setTitle("");
      setArtist("");
      setRating(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------------
  // Remove one track occurrence from a mix
  // -----------------------------------------

  async function handleRemoveTrack(track: MixTrack) {
    if (saving || deletingTrackId !== null) return;

    const confirmed = window.confirm(
      `Remove "${track.title}" from "${mixTitle}"?\n\n` +
        "This will not delete the song from other DJ mixes."
    );

    if (!confirmed) return;

    setDeletingTrackId(track.id);
    setError("");

    try {
      await removeMixTrack(mixId, track.id);

      // Refresh the tracklist after the deletion.
      await loadTracks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setDeletingTrackId(null);
    }
  }

  const isBusy = saving || deletingTrackId !== null;

  // -----------------------------------------
  // Render Tracklist Editor
  // -----------------------------------------

  return (
    <section className="cf-editor">
      {/* Back navigation */}
      <button
        type="button"
        className="btn btn-outline-light mb-4"
        onClick={onBack}
        disabled={isBusy}
      >
        <ArrowLeft size={16} className="me-2" />
        BACK TO MIXES
      </button>

      {/* Mix information */}
      <header className="mb-4">
        <h2>{mixTitle}</h2>
        <p className="cf-muted">{djName}</p>
      </header>

      {/* Database errors */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add Song form */}
      <div className="cf-editor-panel mb-4">
        <h3>Add Song</h3>

        <p className="cf-muted">
          Enter each song in the order the DJ played it.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label
                htmlFor="track-title"
                className="form-label"
              >
                Song Title
              </label>

              <input
                id="track-title"
                className="form-control"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Enter song title"
                disabled={isBusy}
                required
              />
            </div>

            <div className="col-md-6">
              <label
                htmlFor="track-artist"
                className="form-label"
              >
                Artist
              </label>

              <input
                id="track-artist"
                className="form-control"
                value={artist}
                onChange={(event) =>
                  setArtist(event.target.value)
                }
                placeholder="Enter artist"
                disabled={isBusy}
              />
            </div>
          </div>

          {/* Fire rating */}
          <div className="mt-3">
            <label className="form-label">
              Personal Fire Rating
            </label>

            <div
              className="cf-fires"
              role="group"
              aria-label="Fire rating for new song"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    value <= rating
                      ? "cf-fire lit"
                      : "cf-fire"
                  }
                  onClick={() => setRating(value)}
                  disabled={isBusy}
                  aria-label={`Rate ${value} fires`}
                  aria-pressed={rating === value}
                >
                  🔥
                </button>
              ))}

              <span className="cf-muted ms-3">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Save song */}
          <button
            type="submit"
            className="btn cf-primary-btn mt-4"
            disabled={isBusy || !title.trim()}
          >
            <Plus size={17} />
            {saving ? "SAVING..." : "ADD SONG"}
          </button>
        </form>
      </div>

      {/* Ordered tracklist */}
      <div className="cf-editor-panel">
        <div className="d-flex align-items-center gap-2 mb-3">
          <ListOrdered
            size={20}
            className="cf-accent"
          />

          <h3 className="mb-0">Original Tracklist</h3>

          <span className="cf-muted ms-auto">
            {tracks.length} tracks
          </span>
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
            {tracks.map((track) => (
              <div
                key={track.id}
                className="cf-editor-track"
              >
                {/* Original playback position */}
                <span className="cf-track-number">
                  {String(track.position).padStart(2, "0")}
                </span>

                {/* Song details */}
                <div className="cf-track-info">
                  <strong>{track.title}</strong>
                  <small>
                    {track.artist || "Unknown artist"}
                  </small>
                </div>

                {/* Fire rating */}
                <span
                  className="cf-track-rating"
                  aria-label={`${track.rating} out of 5 fires`}
                >
                  {"🔥".repeat(track.rating)}
                </span>

                {/* Delete one track from this mix */}
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveTrack(track)}
                  disabled={isBusy}
                  aria-label={`Remove ${track.title} from mix`}
                  title="Remove from mix"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

