import { useEffect, useMemo, useState } from "react";

import {
  Flame,
  Disc3,
  ListMusic,
  Search,
  ArrowRight,
  Music2,
  Plus,
  Pencil,
} from "lucide-react";

import NewMixForm from "./components/NewMixForm";
import TracklistEditor from "./components/TracklistEditor";

import {
  createResearchMix,
  loadMixWorkspace,
  type WorkspaceMix,
  type NewMixInput,
} from "./database/mixWorkspace";

import { updateMixTitle } from "./database/updateMixTitle";
import { updateMixRating } from "./database/updateMixRating";

import "./App.css";

// -----------------------------------------
// Types
// -----------------------------------------

type Song = {
  id: string;
  title: string;
  artist: string;
  rating: number;
};

type Mix = {
  id: string;
  title: string;
  dj: string;
  genre: string;
  rating: number;
  tracks: Song[];
};

type WorkspaceMode = "saved" | "demo";

type SongAppearance = {
  mixId: string;
  title: string;
  dj: string;
  position: number;
  nextTracks: Song[];
};

// -----------------------------------------
// Sample Songs
// -----------------------------------------

const demoSongs: Record<string, Song> = {
  a: { id: "a", title: "Song A", artist: "Artist One", rating: 4 },
  b: { id: "b", title: "Song B", artist: "Artist Two", rating: 3 },
  c: { id: "c", title: "Song C", artist: "Artist Three", rating: 5 },
  d: { id: "d", title: "Song D", artist: "Artist Four", rating: 2 },
  e: { id: "e", title: "Song E", artist: "Artist Five", rating: 4 },
  f: { id: "f", title: "Song F", artist: "Artist Six", rating: 3 },
  g: { id: "g", title: "Song G", artist: "Artist Seven", rating: 5 },
  h: { id: "h", title: "Song H", artist: "Artist Eight", rating: 4 },
  i: { id: "i", title: "Song I", artist: "Artist Nine", rating: 3 },
  j: { id: "j", title: "Song J", artist: "Artist Ten", rating: 4 },
  k: { id: "k", title: "Song K", artist: "Artist Eleven", rating: 3 },
  l: { id: "l", title: "Song L", artist: "Artist Twelve", rating: 5 },
  m: { id: "m", title: "Song M", artist: "Artist Thirteen", rating: 2 },
  n: { id: "n", title: "Song N", artist: "Artist Fourteen", rating: 4 },
  o: { id: "o", title: "Song O", artist: "Artist Fifteen", rating: 3 },
};

// -----------------------------------------
// Sample DJ Mixes
// -----------------------------------------

const demoMixes: Mix[] = [
  {
    id: "demo-1",
    title: "Friday Night Mix",
    dj: "DJ Marcus",
    genre: "Dancehall / Open Format",
    rating: 4,
    tracks: [
      demoSongs.a,
      demoSongs.b,
      demoSongs.c,
      demoSongs.d,
      demoSongs.e,
      demoSongs.f,
      demoSongs.g,
      demoSongs.h,
    ],
  },
  {
    id: "demo-2",
    title: "Summer Sessions",
    dj: "DJ Rico",
    genre: "Afrobeats / Dancehall",
    rating: 5,
    tracks: [
      demoSongs.i,
      demoSongs.j,
      demoSongs.c,
      demoSongs.k,
      demoSongs.l,
      demoSongs.m,
      demoSongs.n,
      demoSongs.o,
    ],
  },
  {
    id: "demo-3",
    title: "Party Takeover",
    dj: "DJ Nova",
    genre: "Open Format",
    rating: 3,
    tracks: [
      demoSongs.h,
      demoSongs.a,
      demoSongs.c,
      demoSongs.g,
      demoSongs.j,
      demoSongs.k,
      demoSongs.e,
      demoSongs.f,
    ],
  },
];

// -----------------------------------------
// Convert SQLite Workspace Data
// -----------------------------------------

function convertMixes(rows: WorkspaceMix[]): Mix[] {
  return rows.map((mix) => ({
    id: mix.id,
    title: mix.title,
    dj: mix.dj,
    genre: mix.genre,
    rating: mix.rating,
    tracks: mix.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      rating: track.rating,
    })),
  }));
}

// -----------------------------------------
// Main Application
// -----------------------------------------

export default function App() {
  const [savedMixes, setSavedMixes] = useState<Mix[]>([]);
  const [mode, setMode] = useState<WorkspaceMode>("saved");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showNewMix, setShowNewMix] = useState(false);
  const [editingMix, setEditingMix] = useState<Mix | null>(null);

  // Edit Mix Title
  const [renamingMixId, setRenamingMixId] = useState<string | null>(
    null
  );
  const [mixTitleDraft, setMixTitleDraft] = useState("");
  const [savingMixTitle, setSavingMixTitle] = useState(false);

  // Rate Entire DJ Mix
  const [savingMixRatingId, setSavingMixRatingId] = useState<
    string | null
  >(null);

  // Song Selection and Search
  const [selectedSong, setSelectedSong] = useState<string | null>(
    null
  );
  const [hoveredSong, setHoveredSong] = useState<string | null>(
    null
  );
  const [search, setSearch] = useState("");

  // Demo song ratings aren't persisted
  const [demoRatings, setDemoRatings] = useState<
    Record<string, number>
  >({});

  const mixes = mode === "demo" ? demoMixes : savedMixes;
  const activeSong = hoveredSong ?? selectedSong;

  // -----------------------------------------
  // Automatically dismiss success messages
  // -----------------------------------------

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  // -----------------------------------------
  // Load Saved DJ Mixes
  // -----------------------------------------

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await loadMixWorkspace();

        if (active) {
          setSavedMixes(convertMixes(data));
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : String(err)
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  // -----------------------------------------
  // Unique Songs in Current Workspace
  // -----------------------------------------

  const allSongs = useMemo(() => {
    const unique = new Map<string, Song>();

    for (const mix of mixes) {
      for (const song of mix.tracks) {
        if (!unique.has(song.id)) {
          unique.set(song.id, song);
        }
      }
    }

    return [...unique.values()];
  }, [mixes]);

  const currentSong = allSongs.find(
    (song) => song.id === activeSong
  );

  // -----------------------------------------
  // Cross-Mix Song Comparison
  // -----------------------------------------

  const appearances = useMemo<SongAppearance[]>(() => {
    if (!activeSong) return [];

    return mixes.flatMap((mix) =>
      mix.tracks.flatMap((song, index) =>
        song.id === activeSong
          ? [
              {
                mixId: mix.id,
                title: mix.title,
                dj: mix.dj,
                position: index + 1,
                nextTracks: mix.tracks.slice(
                  index + 1,
                  index + 6
                ),
              },
            ]
          : []
      )
    );
  }, [mixes, activeSong]);

  // -----------------------------------------
  // Highlight Matching and Following Tracks
  // -----------------------------------------

  function trackState(
    mix: Mix,
    index: number
  ): "selected" | "following" | "normal" {
    if (!activeSong) return "normal";

    if (mix.tracks[index].id === activeSong) {
      return "selected";
    }

    const isFollowing = mix.tracks.some(
      (track, selectedIndex) =>
        track.id === activeSong &&
        index > selectedIndex &&
        index <= selectedIndex + 5
    );

    return isFollowing ? "following" : "normal";
  }

  // -----------------------------------------
  // Create New Mix
  // -----------------------------------------

  async function handleCreateMix(input: NewMixInput) {
    await createResearchMix(input);

    const updated = await loadMixWorkspace();

    setSavedMixes(convertMixes(updated));
    setMode("saved");
    setSelectedSong(null);
    setHoveredSong(null);
    setSearch("");
    setError("");
    setShowNewMix(false);

    setSuccessMessage("New DJ mix created successfully.");
  }

  // -----------------------------------------
  // Close Tracklist Editor
  // -----------------------------------------

  async function closeTracklistEditor() {
    try {
      const updated = await loadMixWorkspace();

      setSavedMixes(convertMixes(updated));
      setEditingMix(null);

      setSelectedSong(null);
      setHoveredSong(null);
      setSearch("");
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // -----------------------------------------
  // Switch Saved / Demo
  // -----------------------------------------

  function changeMode(next: WorkspaceMode) {
    setMode(next);
    setSelectedSong(next === "demo" ? "c" : null);
    setHoveredSong(null);
    setSearch("");

    setRenamingMixId(null);
    setMixTitleDraft("");
    setSuccessMessage("");
  }

  // -----------------------------------------
  // Search Songs
  // -----------------------------------------

  function changeSearch(value: string) {
    setSearch(value);
    setHoveredSong(null);

    if (!value.trim()) {
      setSelectedSong(null);
      return;
    }

    const query = value.trim().toLowerCase();

    const match = allSongs.find(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    setSelectedSong(match?.id ?? null);
  }

  // -----------------------------------------
  // Edit Mix Title
  // -----------------------------------------

  function startRenamingMix(mix: Mix) {
    if (savingMixTitle) return;

    setRenamingMixId(mix.id);
    setMixTitleDraft(mix.title);
    setError("");
    setSuccessMessage("");
  }

  function cancelRenamingMix() {
    if (savingMixTitle) return;

    setRenamingMixId(null);
    setMixTitleDraft("");
  }

  async function saveMixTitle(mix: Mix) {
    if (savingMixTitle || renamingMixId !== mix.id) return;

    const title = mixTitleDraft.trim();

    if (!title) {
      setError("Mix title cannot be empty.");
      return;
    }

    if (title === mix.title) {
      cancelRenamingMix();
      return;
    }

    setSavingMixTitle(true);
    setError("");
    setSuccessMessage("");

    try {
      await updateMixTitle(mix.id, title);

      setSavedMixes((current) =>
        current.map((item) =>
          item.id === mix.id
            ? { ...item, title }
            : item
        )
      );

      setRenamingMixId(null);
      setMixTitleDraft("");

      setSuccessMessage(
        `Mix title successfully changed to "${title}".`
      );

      try {
        const updated = await loadMixWorkspace();
        setSavedMixes(convertMixes(updated));
      } catch {
        setError(
          "Title saved, but the mix list could not be refreshed."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSavingMixTitle(false);
    }
  }

  // -----------------------------------------
  // Rate Entire DJ Mix — 👌
  // -----------------------------------------

  async function saveMixRating(mix: Mix, rating: number) {
    if (savingMixRatingId !== null) return;

    if (mix.rating === rating) return;

    setSavingMixRatingId(mix.id);
    setError("");
    setSuccessMessage("");

    try {
      await updateMixRating(mix.id, rating);

      setSavedMixes((current) =>
        current.map((item) =>
          item.id === mix.id
            ? { ...item, rating }
            : item
        )
      );

      setSuccessMessage(
        `Rated "${mix.title}" ${rating}/5 👌.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSavingMixRatingId(null);
    }
  }

  // -----------------------------------------
  // Current Song Fire Rating — 🔥
  // -----------------------------------------

  const currentRating = currentSong
    ? mode === "demo"
      ? demoRatings[currentSong.id] ?? currentSong.rating
      : currentSong.rating
    : 0;

  // -----------------------------------------
  // Render
  // -----------------------------------------

  return (
    <div className="cratefire-app">
      {/* Sidebar */}
      <aside className="cf-sidebar">
        <div className="cf-logo">
          <Flame size={27} />
          <span>CrateFire</span>
        </div>

        <p className="cf-nav-heading">WORKSPACE</p>

        <nav className="cf-nav">
          <button
            type="button"
            className="cf-nav-link active"
          >
            <Disc3 size={19} />
            DJ Mixes
          </button>

          <button
            type="button"
            className="cf-nav-link"
            disabled
          >
            <Search size={19} />
            Song Discovery
          </button>

          <button
            type="button"
            className="cf-nav-link"
            disabled
          >
            <ListMusic size={19} />
            My Crates
          </button>
        </nav>

        <div className="cf-sidebar-bottom">
          Personal DJ Research Workspace
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="cf-main">
        {editingMix ? (
          <TracklistEditor
            mixId={editingMix.id}
            mixTitle={editingMix.title}
            djName={editingMix.dj}
            onBack={() => {
              void closeTracklistEditor();
            }}
          />
        ) : (
          <>
            {/* Header */}
            <header className="cf-header">
              <div>
                <p className="cf-eyebrow">
                  MIX RESEARCH WORKSPACE
                </p>

                <h1>DJ Mix Comparison</h1>

                <p className="cf-muted">
                  Study other DJs and their song sequences.
                </p>
              </div>

              <button
                type="button"
                className="btn cf-primary-btn"
                onClick={() => setShowNewMix(true)}
              >
                <Plus size={18} />
                NEW MIX
              </button>
            </header>

            {/* Error Message */}
            {error && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div
                className="alert alert-success d-flex align-items-center justify-content-between"
                role="status"
              >
                <span>
                  <strong>Success!</strong>{" "}
                  {successMessage}
                </span>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Dismiss success message"
                  onClick={() =>
                    setSuccessMessage("")
                  }
                />
              </div>
            )}

            {/* Workspace Tabs */}
            <div className="cf-workspace-tabs">
              <button
                type="button"
                className={
                  mode === "saved" ? "active" : ""
                }
                onClick={() => changeMode("saved")}
                disabled={savingMixTitle}
              >
                MY SAVED MIXES ({savedMixes.length})
              </button>

              <button
                type="button"
                className={
                  mode === "demo" ? "active" : ""
                }
                onClick={() => changeMode("demo")}
                disabled={savingMixTitle}
              >
                SAMPLE COMPARISON
              </button>
            </div>

            {/* Search and Legend */}
            <section className="cf-toolbar">
              <div className="cf-search">
                <Search size={18} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    changeSearch(event.target.value)
                  }
                  placeholder="Search a song or artist..."
                  aria-label="Search songs"
                />
              </div>

              <div className="cf-legend">
                <span>
                  <i className="cf-key selected" />
                  Matching song
                </span>

                <span>
                  <i className="cf-key following" />
                  Next 5 songs
                </span>
              </div>
            </section>

            {/* Mix Cards */}
            {mode === "saved" && loading ? (
              <div className="cf-empty">
                Loading your DJ mixes...
              </div>
            ) : mixes.length === 0 ? (
              <div className="cf-empty">
                <Disc3
                  size={40}
                  className="cf-accent"
                />

                <h2>No mixes saved yet</h2>

                <p>
                  Click NEW MIX to start documenting a DJ's set.
                </p>

                <p>
                  Or open SAMPLE COMPARISON to explore
                  the discovery feature.
                </p>
              </div>
            ) : (
              <section
                className="cf-mix-grid"
                onMouseLeave={() =>
                  setHoveredSong(null)
                }
              >
                {mixes.map((mix) => (
                  <article
                    className="cf-mix-card"
                    key={mix.id}
                  >
                    {/* Mix Heading */}
                    <div className="cf-mix-heading">
                      <Disc3
                        size={25}
                        className="cf-accent"
                      />

                      {mode === "saved" &&
                      renamingMixId === mix.id ? (
                        <form
                          className="cf-rename-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveMixTitle(mix);
                          }}
                        >
                          <label
                            htmlFor={`mix-title-${mix.id}`}
                            className="cf-muted"
                          >
                            Mix Title
                          </label>

                          <input
                            id={`mix-title-${mix.id}`}
                            type="text"
                            value={mixTitleDraft}
                            onChange={(event) =>
                              setMixTitleDraft(
                                event.target.value
                              )
                            }
                            maxLength={150}
                            disabled={savingMixTitle}
                            required
                            autoFocus
                          />

                          <div className="cf-rename-actions">
                            <button
                              type="submit"
                              className="btn cf-primary-btn btn-sm"
                              disabled={
                                savingMixTitle ||
                                !mixTitleDraft.trim()
                              }
                            >
                              {savingMixTitle
                                ? "SAVING..."
                                : "SAVE"}
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-light btn-sm"
                              onClick={cancelRenamingMix}
                              disabled={savingMixTitle}
                            >
                              CANCEL
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="cf-mix-title-row">
                          <h2>{mix.title}</h2>

                          {mode === "saved" && (
                            <button
                              type="button"
                              className="btn btn-outline-light btn-sm"
                              onClick={() =>
                                startRenamingMix(mix)
                              }
                              disabled={savingMixTitle}
                              aria-label={`Edit title of ${mix.title}`}
                              title="Edit mix title"
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                        </div>
                      )}

                      <p>{mix.dj}</p>

                      <span className="cf-genre">
                        {mix.genre || "Mixed Genre"}
                      </span>
                    </div>

                    {/* Overall DJ Mix Rating — 👌 */}
                    {mode === "saved" && (
                      <div className="cf-mix-rating">
                        <span className="cf-muted">
                          YOUR MIX RATING
                        </span>

                        <div
                          className="cf-mix-rating-fires"
                          role="group"
                          aria-label={`Rate ${mix.title}`}
                        >
                          {[1, 2, 3, 4, 5].map(
                            (value) => (
                              <button
                                key={value}
                                type="button"
                                className={
                                  value <= mix.rating
                                    ? "cf-fire lit"
                                    : "cf-fire"
                                }
                                onClick={() =>
                                  void saveMixRating(
                                    mix,
                                    value
                                  )
                                }
                                disabled={
                                  savingMixRatingId !== null
                                }
                                aria-label={`Rate ${mix.title} ${value} OK signs`}
                                aria-pressed={
                                  mix.rating === value
                                }
                              >
                                {value <= mix.rating
                                  ? "👌"
                                  : "◯"}
                              </button>
                            )
                          )}
                        </div>

                        <small className="cf-muted">
                          {mix.rating === 0
                            ? "Not rated yet"
                            : `${mix.rating}/5 👌`}
                        </small>
                      </div>
                    )}

                    {/* Edit Tracklist */}
                    {mode === "saved" && (
                      <div className="cf-edit-action">
                        <button
                          type="button"
                          className="btn cf-primary-btn w-100"
                          disabled={
                            savingMixTitle ||
                            savingMixRatingId !== null
                          }
                          onClick={() =>
                            setEditingMix(mix)
                          }
                        >
                          EDIT TRACKLIST
                        </button>
                      </div>
                    )}

                    {/* Ordered Tracks */}
                    {mix.tracks.length === 0 ? (
                      <div className="cf-no-tracks">
                        <Music2 size={25} />
                        <p>No tracks added yet.</p>
                        <small>
                          Open Edit Tracklist to add songs.
                        </small>
                      </div>
                    ) : (
                      <div className="cf-tracks">
                        {mix.tracks.map(
                          (song, index) => {
                            const state = trackState(
                              mix,
                              index
                            );

                            return (
                              <button
                                type="button"
                                key={`${mix.id}-${index}`}
                                className={`cf-track ${state}`}
                                onMouseEnter={() =>
                                  setHoveredSong(song.id)
                                }
                                onFocus={() =>
                                  setHoveredSong(song.id)
                                }
                                onBlur={() =>
                                  setHoveredSong(null)
                                }
                                onClick={() =>
                                  setSelectedSong(song.id)
                                }
                                aria-pressed={
                                  state === "selected"
                                }
                              >
                                <span className="cf-track-number">
                                  {String(
                                    index + 1
                                  ).padStart(2, "0")}
                                </span>

                                <span className="cf-track-info">
                                  <strong>
                                    {song.title}
                                  </strong>

                                  <small>
                                    {song.artist}
                                  </small>
                                </span>

                                {state ===
                                  "selected" && (
                                  <Flame
                                    size={16}
                                    className="cf-accent"
                                  />
                                )}

                                {state ===
                                  "following" && (
                                  <ArrowRight
                                    size={15}
                                    className="cf-next-icon"
                                  />
                                )}
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </section>
            )}

            {/* Song Reference Panel */}
            <section className="cf-inspector">
              <div className="cf-inspector-heading">
                <Music2
                  size={22}
                  className="cf-accent"
                />

                <div>
                  <h2>Song Reference</h2>
                  <p>
                    Compare song appearances across mixes.
                  </p>
                </div>
              </div>

              {currentSong ? (
                <>
                  <div className="cf-song-details">
                    <div>
                      <h3>{currentSong.title}</h3>
                      <p>{currentSong.artist}</p>
                    </div>

                    <div className="cf-rating">
                      <span>YOUR FIRE RATING</span>

                      <div className="cf-fires">
                        {[1, 2, 3, 4, 5].map(
                          (value) => (
                            <button
                              type="button"
                              key={value}
                              className={
                                value <= currentRating
                                  ? "cf-fire lit"
                                  : "cf-fire"
                              }
                              disabled={mode === "saved"}
                              onClick={() =>
                                setDemoRatings(
                                  (current) => ({
                                    ...current,
                                    [currentSong.id]:
                                      value,
                                  })
                                )
                              }
                              aria-label={`Rate ${value} fires`}
                              aria-pressed={
                                currentRating === value
                              }
                            >
                              🔥
                            </button>
                          )
                        )}
                      </div>

                      {mode === "saved" && (
                        <small className="cf-muted">
                          Song ratings are managed in
                          the Tracklist Editor.
                        </small>
                      )}
                    </div>
                  </div>

                  <p className="cf-reference-count">
                    Found {appearances.length} appearance(s)
                    across{" "}
                    {
                      new Set(
                        appearances.map(
                          (item) => item.mixId
                        )
                      ).size
                    }{" "}
                    mix(es)
                  </p>

                  <div className="cf-reference-grid">
                    {appearances.map((item) => (
                      <div
                        className="cf-reference-card"
                        key={`${item.mixId}-${item.position}`}
                      >
                        <h4>{item.title}</h4>

                        <p>
                          {item.dj} · Track #
                          {item.position}
                        </p>

                        <strong>
                          Next five tracks
                        </strong>

                        {item.nextTracks.length > 0 ? (
                          <ol>
                            {item.nextTracks.map(
                              (song, index) => (
                                <li key={index}>
                                  {song.title} —{" "}
                                  {song.artist}
                                </li>
                              )
                            )}
                          </ol>
                        ) : (
                          <p>No following tracks.</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="cf-muted">
                  Select a song from a mix to see
                  its references.
                </p>
              )}
            </section>

            {/* Sample Notice */}
            {mode === "demo" && (
              <p className="cf-demo-note">
                Sample mixes and ratings are for
                demonstration only. They are not
                stored in SQLite.
              </p>
            )}
          </>
        )}
      </main>

      {/* New Mix Modal */}
      {showNewMix && (
        <NewMixForm
          onSave={handleCreateMix}
          onClose={() =>
            setShowNewMix(false)
          }
        />
      )}
    </div>
  );
}
