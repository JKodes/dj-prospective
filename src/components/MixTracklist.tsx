import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Flame,
  Plus,
  Trash2,
  Music2,
  Search,
  Disc3,
  ListOrdered,
} from "lucide-react";

import type { DJMix } from "../database/mixes";

import {
  getMixTracks,
  addMixTrack,
  updateSongRating,
  removeMixTrack,
  type MixTrack,
} from "../database/tracklists";

interface MixTracklistProps {
  mix: DJMix;
  onBack: () => void;
}

export default function MixTracklist({
  mix,
  onBack,
}: MixTracklistProps) {
  const [tracks, setTracks] = useState<MixTrack[]>([]);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rating, setRating] = useState(3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyTrackId, setBusyTrackId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadTracks = useCallback(async () => {
    try {
      const data = await getMixTracks(mix.id);
      setTracks(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [mix.id]);

  useEffect(() => {
    void loadTracks();
  }, [loadTracks]);

  async function handleAddTrack(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Song title is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addMixTrack(mix.id, {
        title: title.trim(),
        artist: artist.trim(),
        rating,
      });

      await loadTracks();

      setTitle("");
      setArtist("");
      setRating(3);
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRate(
    track: MixTrack,
    value: number
  ) {
    setBusyTrackId(track.id);
    setError("");

    try {
      await updateSongRating(track.song_id, value);
      await loadTracks();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyTrackId(null);
    }
  }

  async function handleRemove(track: MixTrack) {
    const confirmed = window.confirm(
      `Remove "${track.title}" from "${mix.title}"?`
    );

    if (!confirmed) return;

    setBusyTrackId(track.id);
    setError("");

    try {
      await removeMixTrack(track.id, mix.id);
      await loadTracks();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyTrackId(null);
    }
  }

  const filteredTracks = tracks.filter((track) =>
    [track.title, track.artist]
      .some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
  );

  const fiveFireCount = tracks.filter(
    (track) => track.rating === 5
  ).length;

  return (
    <section className="tracklist-page">
      <button
        type="button"
        className="btn btn-outline-light mb-4 d-inline-flex align-items-center gap-2"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        BACK TO MIXES
      </button>

      {/* Mix information */}
      <div className="content-card mb-4">
        <div className="d-flex align-items-center gap-3">
          <Disc3 size={40} className="accent-icon" />

          <div>
            <h2 className="mb-2">{mix.title}</h2>
            <p className="muted mb-0">
              {mix.dj_name}
              {mix.genre ? ` · ${mix.genre}` : ""}
            </p>
          </div>
        </div>

        <div className="row g-3 mt-3">
          <div className="col-sm-6">
            <div className="stat-card">
              <Music2 size={20} />
              <p>Total Tracks</p>
              <h2>{tracks.length}</h2>
            </div>
          </div>

          <div className="col-sm-6">
            <div className="stat-card">
              <Flame size={20} />
              <p>5-Fire Tracks</p>
              <h2>{fiveFireCount}</h2>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Add song form */}
      <div className="content-card mb-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <Plus size={21} className="accent-icon" />
          <h2 className="mb-0">Add Song to Mix</h2>
        </div>

        <p className="muted">
          Enter each song in the order the DJ played it.
        </p>

        <form onSubmit={handleAddTrack}>
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
                placeholder="Enter song title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
                placeholder="Enter artist name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="form-label">
              Personal Fire Rating
            </label>

            <div className="flames" role="group" aria-label="New song fire rating">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={
                    value <= rating
                      ? "flame active"
                      : "flame"
                  }
                  onClick={() => setRating(value)}
                  aria-label={`Rate ${value} out of 5`}
                  aria-pressed={rating === value}
                >
                  🔥
                </button>
              ))}

              <span className="muted ms-3">
                {rating}/5
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="btn fire-button mt-4"
            disabled={saving}
          >
            <Plus size={17} />
            {saving ? "SAVING..." : "ADD TO MIX"}
          </button>
        </form>
      </div>

      {/* Ordered tracklist */}
      <div className="content-card">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2">
              <ListOrdered
                size={21}
                className="accent-icon"
              />
              <h2 className="mb-0">DJ Tracklist</h2>
            </div>

            <p className="muted mb-0 mt-2">
              Songs listed in original playback order.
            </p>
          </div>

          <div className="search-box">
            <Search size={17} />

            <input
              type="search"
              placeholder="Search this mix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search songs in this mix"
            />
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading tracklist...</p>
        ) : tracks.length === 0 ? (
          <div className="empty-state">
            <Music2 size={38} />
            <p>No songs have been added yet.</p>
            <span>
              Add your first song to start documenting this mix.
            </span>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="empty-state">
            <Search size={32} />
            <p>No matching songs found.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table songs-table align-middle">
              <thead>
                <tr>
                  <th>ORDER</th>
                  <th>SONG TITLE</th>
                  <th>ARTIST</th>
                  <th>FIRE RATING</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredTracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      {String(track.position).padStart(2, "0")}
                    </td>

                    <td className="fw-semibold">
                      {track.title}
                    </td>

                    <td>
                      {track.artist || "—"}
                    </td>

                    <td>
                      <div
                        className="flames"
                        role="group"
                        aria-label={`Fire rating for ${track.title}`}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            type="button"
                            key={value}
                            className={
                              value <= track.rating
                                ? "flame active"
                                : "flame"
                            }
                            onClick={() =>
                              handleRate(track, value)
                            }
                            disabled={
                              busyTrackId === track.id
                            }
                            aria-label={`Rate ${track.title} ${value} out of 5`}
                            aria-pressed={
                              track.rating === value
                            }
                          >
                            🔥
                          </button>
                        ))}

                        <span className="muted ms-2">
                          {track.rating}/5
                        </span>
                      </div>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleRemove(track)}
                        disabled={
                          busyTrackId === track.id
                        }
                        title="Remove from mix"
                        aria-label={`Remove ${track.title} from mix`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}



