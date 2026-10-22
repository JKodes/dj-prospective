
import { useState, type FormEvent } from "react";
import {
  Flame,
  LayoutDashboard,
  Library,
  ListMusic,
  Plus,
  Music2,
  Trash2,
} from "lucide-react";

type Song = {
  id: string;
  title: string;
  artist: string;
  rating: number;
};

type Page = "dashboard" | "library" | "crates";

const STORAGE_KEY = "cratefire-songs-v1";

function getSavedSongs(): Song[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [songs, setSongs] = useState<Song[]>(getSavedSongs);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [rating, setRating] = useState(3);

  function saveSongs(updated: Song[]) {
    setSongs(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function addSong(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) return;

    const song: Song = {
      id: crypto.randomUUID(),
      title: title.trim(),
      artist: artist.trim(),
      rating,
    };

    saveSongs([song, ...songs]);
    setTitle("");
    setArtist("");
    setRating(3);
    setShowForm(false);
  }

  function rateSong(id: string, value: number) {
    saveSongs(
      songs.map((song) =>
        song.id === id ? { ...song, rating: value } : song
      )
    );
  }

  function deleteSong(id: string) {
    saveSongs(songs.filter((song) => song.id !== id));
  }

  const favorites = songs.filter((song) => song.rating === 5);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <Flame size={29} />
          <span>CRATEFIRE</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="d-grid gap-2">
          <button
            className={`nav-link-custom ${
              page === "dashboard" ? "active" : ""
            }`}
            onClick={() => setPage("dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className={`nav-link-custom ${
              page === "library" ? "active" : ""
            }`}
            onClick={() => setPage("library")}
          >
            <Library size={19} />
            Music Library
          </button>

          <button
            className={`nav-link-custom ${
              page === "crates" ? "active" : ""
            }`}
            onClick={() => setPage("crates")}
          >
            <ListMusic size={19} />
            My Crates
          </button>
        </nav>

        <div className="sidebar-bottom">
          PERSONAL DJ WORKSPACE
        </div>
      </aside>

      <main className="main-area">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR MUSIC. YOUR TASTE.</p>
            <h1>
              {page === "dashboard"
                ? "Dashboard"
                : page === "library"
                ? "Music Library"
                : "My Crates"}
            </h1>
          </div>

          <button
            className="btn fire-button"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            ADD SONG
          </button>
        </div>

        {page === "dashboard" && (
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="stat-card">
                <Music2 />
                <p>Total Songs</p>
                <h2>{songs.length}</h2>
              </div>
            </div>

            <div className="col-md-4">
              <div className="stat-card">
                <Flame />
                <p>5-Fire Songs</p>
                <h2>{favorites.length}</h2>
              </div>
            </div>

            <div className="col-md-4">
              <div className="stat-card">
                <ListMusic />
                <p>Party Crates</p>
                <h2>0</h2>
              </div>
            </div>
          </div>
        )}

        {page === "crates" ? (
          <section className="content-card text-center py-5">
            <ListMusic size={38} className="accent-icon" />
            <h2 className="mt-3">Your Party Crates</h2>
            <p className="muted">
              We'll build your crate management system next.
            </p>
          </section>
        ) : (
          <section className="content-card">
            <h2>
              {page === "dashboard"
                ? "Recently Added Songs"
                : "All Songs"}
            </h2>
            <p className="muted">
              Keep track of the songs you discover.
            </p>

            {songs.length === 0 ? (
              <div className="empty-state">
                <Music2 size={38} />
                <p>No songs added yet.</p>
                <span>
                  Click ADD SONG to start your collection.
                </span>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table songs-table">
                  <thead>
                    <tr>
                      <th>SONG TITLE</th>
                      <th>ARTIST</th>
                      <th>FIRE RATING</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {songs.map((song) => (
                      <tr key={song.id}>
                        <td>{song.title}</td>
                        <td>{song.artist || "—"}</td>
                        <td>
                          <div className="flames">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                className={
                                  value <= song.rating
                                    ? "flame active"
                                    : "flame"
                                }
                                onClick={() =>
                                  rateSong(song.id, value)
                                }
                                aria-label={`Rate ${song.title} ${value} out of 5`}
                              >
                                🔥
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            className="delete-btn"
                            onClick={() => deleteSong(song.id)}
                            aria-label={`Delete ${song.title}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {showForm && (
          <div className="custom-backdrop">
            <section
              className="add-song-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-song-title"
            >
              <h2 id="add-song-title">Add New Song</h2>
              <p className="muted">
                Add a title to your personal DJ catalog.
              </p>

              <form onSubmit={addSong}>
                <label className="form-label">
                  Song Title
                </label>
                <input
                  className="form-control mb-3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />

                <label className="form-label">
                  Artist
                </label>
                <input
                  className="form-control mb-3"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                />

                <label className="form-label">
                  Fire Rating
                </label>
                <div className="flames mb-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={
                        value <= rating
                          ? "flame active"
                          : "flame"
                      }
                      onClick={() => setRating(value)}
                      aria-label={`Select ${value} fires`}
                    >
                      🔥
                    </button>
                  ))}
                </div>

                <div className="d-flex gap-2 justify-content-end">
                  <button
                    type="button"
                    className="btn cancel-button"
                    onClick={() => setShowForm(false)}
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    className="btn fire-button"
                  >
                    SAVE SONG
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
