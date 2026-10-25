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
} from "lucide-react";

import {
  addMixTrack,
  getMixTracks,
  type MixTrack,
} from "../database/mixTracks";

type Props = {
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
}: Props) {
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rating, setRating] = useState(3);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadTracks = useCallback(async () => {
    const result = await getMixTracks(mixId);
    setTracks(result);
  }, [mixId]);

  useEffect(() => {
    let active = true;

    getMixTracks(mixId)
      .then((result) => {
        if (active) setTracks(result);
      })
      .catch((err) => {
        if (active) setError(String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mixId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving || !title.trim()) return;

    setSaving(true);
    setError("");

    try {
      await addMixTrack(mixId, {
        title,
        artist,
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

  return (
    <section className="cf-editor">
      <button
        type="button"
        className="btn btn-outline-light mb-4"
        onClick={onBack}
        disabled={saving}
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

      <div className="cf-editor-panel mb-4">
        <h3>Add Song</h3>

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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter song title"
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
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Enter artist"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label">
              Personal Fire Rating
            </label>

            <div
              className="cf-fires"
              role="group"
              aria-label="Fire rating"
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

          <button
            type="submit"
            className="btn cf-primary-btn mt-4"
            disabled={saving}
          >
            <Plus size={17} />
            {saving ? "SAVING..." : "ADD SONG"}
          </button>
        </form>
      </div>

      <div className="cf-editor-panel">
        <div className="d-flex align-items-center gap-2 mb-3">
          <ListOrdered size={20} className="cf-accent" />
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
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
