import { useEffect, useMemo, useState } from "react";

import {
  Disc3,
  Flame,
  ListMusic,
  Music2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import NewMixForm from "./components/NewMixForm";
import TracklistEditor from "./components/TracklistEditor";
import MixComparison from "./components/MixComparison";

import {
  createResearchMix,
  loadMixWorkspace,
  type WorkspaceMix,
  type NewMixInput,
} from "./database/mixWorkspace";

import { updateMixTitle } from "./database/updateMixTitle";
import { deleteMix } from "./database/deleteMix";

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

type Discovery = {
  mix: Mix;
  matchingTracks: {
    song: Song;
    position: number;
  }[];
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
// SQLite Data Conversion
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
// Random High-Rated Song Previews
// -----------------------------------------

function getMixPreviewSongs(mix: Mix): Song[] {
  const candidates = mix.tracks.filter(
    (song) => song.rating >= 4
  );

  const shuffled = [...candidates];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [
      shuffled[j],
      shuffled[i],
    ];
  }

  return shuffled.slice(0, 3);
}

// -----------------------------------------
// Main Application
// -----------------------------------------

export default function App() {
  // Saved DJ mixes
  const [savedMixes, setSavedMixes] = useState<Mix[]>([]);

  const [mode, setMode] = useState<WorkspaceMode>("saved");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // New Mix
  const [showNewMix, setShowNewMix] = useState(false);

  // Tracklist Editor
  const [editingMix, setEditingMix] = useState<Mix | null>(
    null
  );

  // Mix Title Editing
  const [renamingMixId, setRenamingMixId] = useState<
    string | null
  >(null);
  const [mixTitleDraft, setMixTitleDraft] = useState("");
  const [savingMixTitle, setSavingMixTitle] = useState(false);

  // Mix Selection and Comparison
  const [selectedMixIds, setSelectedMixIds] = useState<
    string[]
  >([]);
  const [showComparison, setShowComparison] = useState(false);

  // Universal Search
  const [search, setSearch] = useState("");

  // Mix Deletion
  const [deletingMixId, setDeletingMixId] = useState<
    string | null
  >(null);
  const [mixToDelete, setMixToDelete] = useState<Mix | null>(
    null
  );

  // -----------------------------------------
  // Active Workspace
  // -----------------------------------------

  const mixes = mode === "demo" ? demoMixes : savedMixes;

  // -----------------------------------------
  // Automatic Success Message Dismissal
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
  // Load DJ Mixes From SQLite
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
  // Universal Search
  // -----------------------------------------

  const filteredMixes = useMemo(() => {
    const terms = search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (terms.length === 0) {
      return mixes;
    }

    return mixes.filter((mix) => {
      const searchableText = [
        mix.title,
        mix.dj,
        mix.genre,
        ...mix.tracks.flatMap((song) => [
          song.title,
          song.artist,
        ]),
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((term) =>
        searchableText.includes(term)
      );
    });
  }, [mixes, search]);

  // -----------------------------------------
  // Library Discoveries
  // -----------------------------------------

  const libraryDiscoveries = useMemo<Discovery[]>(() => {
    const query = search.trim().toLowerCase();

    if (!query || mode !== "saved") {
      return [];
    }

    const terms = query.split(/\s+/).filter(Boolean);

    return filteredMixes.map((mix) => {
      const matchingTracks = mix.tracks.flatMap(
        (song, index) => {
          const songText =
            `${song.title} ${song.artist}`.toLowerCase();

          const matches = terms.every((term) =>
            songText.includes(term)
          );

          return matches
            ? [{ song, position: index + 1 }]
            : [];
        }
      );

      return {
        mix,
        matchingTracks,
      };
    });
  }, [filteredMixes, search, mode]);

  // -----------------------------------------
  // Three High-Rated Preview Songs Per Mix
  // -----------------------------------------

  const previewSongs = useMemo(() => {
    const previews = new Map<string, Song[]>();

    for (const mix of mixes) {
      previews.set(mix.id, getMixPreviewSongs(mix));
    }

    return previews;
  }, [mixes]);

  // -----------------------------------------
  // Selected Mixes
  // -----------------------------------------

  const comparisonMixes = useMemo(
    () =>
      savedMixes.filter((mix) =>
        selectedMixIds.includes(mix.id)
      ),
    [savedMixes, selectedMixIds]
  );

  // -----------------------------------------
  // Create New DJ Mix
  // -----------------------------------------

  async function handleCreateMix(input: NewMixInput) {
    await createResearchMix(input);

    const updated = await loadMixWorkspace();

    setSavedMixes(convertMixes(updated));
    setMode("saved");
    setShowNewMix(false);
    setSearch("");
    setError("");

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
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // -----------------------------------------
  // Switch Saved and Demo Modes
  // -----------------------------------------

  function changeMode(next: WorkspaceMode) {
    setMode(next);
    setSelectedMixIds([]);
    setShowComparison(false);
    setSearch("");

    setRenamingMixId(null);
    setMixTitleDraft("");
    setSuccessMessage("");
    setError("");
  }

  // -----------------------------------------
  // Universal Search Input
  // -----------------------------------------

  function changeSearch(value: string) {
    setSearch(value);
  }

  // -----------------------------------------
  // Mix Comparison Selection
  // -----------------------------------------

  function toggleMixSelection(mixId: string) {
    setSelectedMixIds((current) =>
      current.includes(mixId)
        ? current.filter((id) => id !== mixId)
        : [...current, mixId]
    );
  }

  function clearMixSelection() {
    setSelectedMixIds([]);
  }

  function openComparison() {
    if (comparisonMixes.length < 2) return;

    setShowComparison(true);
    setError("");
    setSuccessMessage("");
  }

  // -----------------------------------------
  // Edit Mix Title
  // -----------------------------------------

  function startRenamingMix(mix: Mix) {
    if (savingMixTitle) return;

    setRenamingMixId(mix.id);
    setMixTitleDraft(mix.title);
    setError("");
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
  // Delete DJ Mix
  // -----------------------------------------

  async function handleDeleteMix() {
    if (!mixToDelete || deletingMixId !== null) return;

    const mix = mixToDelete;

    setDeletingMixId(mix.id);
    setError("");
    setSuccessMessage("");

    try {
      await deleteMix(mix.id);

      setSavedMixes((current) =>
        current.filter((item) => item.id !== mix.id)
      );

      setSelectedMixIds((current) =>
        current.filter((id) => id !== mix.id)
      );

      setMixToDelete(null);

      setSuccessMessage(
        `"${mix.title}" was deleted successfully.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setDeletingMixId(null);
    }
  }

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
            onClick={() => {
              setShowComparison(false);
              setEditingMix(null);
            }}
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
        {showComparison ? (
          <MixComparison
            mixes={comparisonMixes}
            onBack={() => setShowComparison(false)}
          />
        ) : editingMix ? (
          <TracklistEditor
            mixId={editingMix.id}
            mixTitle={editingMix.title}
            djName={editingMix.dj}
            mixRating={editingMix.rating}
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

                <h1>DJ Mix Library</h1>

                <p className="cf-muted">
                  Research DJ mixes, discover songs,
                  and compare track sequences.
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

            {/* Errors */}
            {error && (
              <div
                className="alert alert-danger"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Success Notifications */}
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

            {/* Saved / Demo Tabs */}
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

            {/* Universal Search */}
            <section className="cf-toolbar">
              <div className="cf-search">
                <Search size={18} />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    changeSearch(event.target.value)
                  }
                  placeholder="Search songs, artists, DJs, genres, or mixes..."
                  aria-label="Search DJ mix library"
                />
              </div>
            </section>

            {/* Mix Comparison Toolbar */}
            {mode === "saved" && savedMixes.length > 0 && (
              <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <span className="cf-muted">
                  {selectedMixIds.length} mix(es) selected
                </span>

                <button
                  type="button"
                  className="btn cf-primary-btn"
                  disabled={comparisonMixes.length < 2}
                  onClick={openComparison}
                >
                  COMPARE SELECTED MIXES
                </button>

                {selectedMixIds.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm"
                    onClick={clearMixSelection}
                  >
                    CLEAR SELECTION
                  </button>
                )}
              </div>
            )}

            {/* Search Results Count */}
            {search.trim() && (
              <p className="cf-muted">
                Found {filteredMixes.length} of {mixes.length} mixes
                matching "{search.trim()}"
              </p>
            )}

            {/* Mix Library */}
            {mode === "saved" && loading ? (
              <div className="cf-empty">
                Loading your DJ mixes...
              </div>
            ) : mixes.length === 0 ? (
              <div className="cf-empty">
                <Disc3 size={40} className="cf-accent" />

                <h2>No mixes saved yet</h2>

                <p>
                  Click NEW MIX to start documenting a DJ's set.
                </p>
              </div>
            ) : filteredMixes.length === 0 ? (
              <div className="cf-empty">
                <Search size={32} className="cf-accent" />

                <h2>No matching mixes</h2>

                <p>
                  Try another song title, artist, DJ name,
                  genre, or mix title.
                </p>
              </div>
            ) : (
              <section className="cf-mix-grid">
                {filteredMixes.map((mix) => (
                  <article
                    className="cf-mix-card"
                    key={mix.id}
                  >
                    {/* Comparison Selection and Delete */}
                    {mode === "saved" && (
                      <div className="d-flex align-items-center justify-content-between px-3 pt-3">
                        <div className="d-flex align-items-center gap-2">
                          <input
                            type="checkbox"
                            className="form-check-input m-0"
                            id={`select-mix-${mix.id}`}
                            checked={selectedMixIds.includes(
                              mix.id
                            )}
                            onChange={() =>
                              toggleMixSelection(mix.id)
                            }
                            disabled={deletingMixId !== null}
                          />

                          <label
                            htmlFor={`select-mix-${mix.id}`}
                            className="cf-muted"
                          >
                            Select for Comparison
                          </label>
                        </div>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            setMixToDelete(mix)
                          }
                          disabled={
                            deletingMixId !== null ||
                            savingMixTitle
                          }
                          aria-label={`Delete ${mix.title}`}
                          title="Delete DJ mix"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}

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

                    {/* Overall Mix Rating — Display Only */}
                    {mode === "saved" && (
                      <div className="cf-mix-rating">
                        <span className="cf-muted">
                          YOUR MIX RATING
                        </span>

                        <span
                          aria-label={
                            mix.rating === 0
                              ? "Mix not rated"
                              : `Mix rating ${mix.rating} out of 5`
                          }
                        >
                          {mix.rating === 0
                            ? "Not rated yet"
                            : "👌".repeat(mix.rating)}
                        </span>

                        {mix.rating > 0 && (
                          <small className="cf-muted">
                            {mix.rating}/5
                          </small>
                        )}
                      </div>
                    )}

                    {/* Edit Tracklist */}
                    {mode === "saved" && (
                      <div className="cf-edit-action">
                        <button
                          type="button"
                          className="btn cf-primary-btn w-100"
                          disabled={savingMixTitle}
                          onClick={() =>
                            setEditingMix(mix)
                          }
                        >
                          EDIT TRACKLIST
                        </button>
                      </div>
                    )}

                    {/* Three High-Rated Song Previews */}
                    <div className="cf-tracks">
                      <div className="px-3 pt-3 pb-2">
                        <strong>Top Song Discoveries</strong>

                        <p className="cf-muted mb-0">
                          Random songs rated 4–5 🔥
                        </p>
                      </div>

                      {(previewSongs.get(mix.id) ?? [])
                        .length === 0 ? (
                        <div className="cf-no-tracks">
                          <Music2 size={25} />

                          <p>
                            No highly rated songs yet.
                          </p>

                          <small>
                            Rate songs 4 or 5 🔥 to
                            see them here.
                          </small>
                        </div>
                      ) : (
                        (previewSongs.get(mix.id) ?? []).map(
                          (song, index) => (
                            <div
                              key={`${mix.id}-${song.id}-${index}`}
                              className="cf-track"
                            >
                              <span className="cf-track-number">
                                {String(index + 1).padStart(
                                  2,
                                  "0"
                                )}
                              </span>

                              <span className="cf-track-info">
                                <strong>
                                  {song.title}
                                </strong>

                                <small>
                                  {song.artist}
                                </small>
                              </span>

                              <span
                                aria-label={`${song.rating} out of 5 fires`}
                              >
                                {"🔥".repeat(song.rating)}
                              </span>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </article>
                ))}
              </section>
            )}

            {/* Library Discoveries */}
            {mode === "saved" && search.trim() && (
              <section className="cf-inspector">
                <div className="cf-inspector-heading">
                  <Search
                    size={22}
                    className="cf-accent"
                  />

                  <div>
                    <h2>Library Discoveries</h2>

                    <p>
                      Mixes matching "{search.trim()}"
                    </p>
                  </div>
                </div>

                {libraryDiscoveries.length === 0 ? (
                  <p className="cf-muted">
                    No matching DJ mixes found.
                  </p>
                ) : (
                  <div className="cf-reference-grid">
                    {libraryDiscoveries.map(
                      ({ mix, matchingTracks }) => (
                        <div
                          className="cf-reference-card"
                          key={mix.id}
                        >
                          <div className="d-flex align-items-start gap-2">
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              id={`discovery-${mix.id}`}
                              checked={selectedMixIds.includes(
                                mix.id
                              )}
                              onChange={() =>
                                toggleMixSelection(mix.id)
                              }
                              aria-label={`Select ${mix.title} for comparison`}
                            />

                            <div className="flex-grow-1">
                              <label
                                htmlFor={`discovery-${mix.id}`}
                                className="fw-bold"
                              >
                                {mix.title}
                              </label>

                              <p className="cf-muted">
                                {mix.dj} ·{" "}
                                {mix.genre || "Mixed Genre"}
                              </p>

                              {matchingTracks.length > 0 ? (
                                <>
                                  <strong>
                                    Matching Songs
                                  </strong>

                                  <ol>
                                    {matchingTracks.map(
                                      ({
                                        song,
                                        position,
                                      }) => (
                                        <li
                                          key={`${song.id}-${position}`}
                                        >
                                          {song.title}
                                          {" — "}
                                          {song.artist}
                                          {" · Track #"}
                                          {position}
                                        </li>
                                      )
                                    )}
                                  </ol>
                                </>
                              ) : (
                                <p className="cf-muted">
                                  Matches mix title, DJ,
                                  or genre.
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {comparisonMixes.length >= 2 && (
                  <button
                    type="button"
                    className="btn cf-primary-btn mt-3"
                    onClick={openComparison}
                  >
                    COMPARE {comparisonMixes.length} SELECTED MIXES
                  </button>
                )}
              </section>
            )}

            {/* Demo Notice */}
            {mode === "demo" && (
              <p className="cf-demo-note">
                Sample mixes are for demonstration
                only. They are not stored in SQLite.
              </p>
            )}
          </>
        )}
      </main>

      {/* New Mix Modal */}
      {showNewMix && (
        <NewMixForm
          onSave={handleCreateMix}
          onClose={() => setShowNewMix(false)}
        />
      )}

      {/* Delete Mix Confirmation Dialog */}
      {mixToDelete && (
        <div className="cf-modal-backdrop">
          <div
            className="cf-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-mix-title"
          >
            <h2 id="delete-mix-title">
              Delete DJ Mix?
            </h2>

            <p>
              Are you sure you want to permanently
              delete{" "}
              <strong>
                "{mixToDelete.title}"
              </strong>
              ?
            </p>

            <p className="cf-muted">
              This removes the mix and its tracklist.
              Songs in other mixes will remain.
              This action cannot be undone.
            </p>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={() =>
                  setMixToDelete(null)
                }
                disabled={deletingMixId !== null}
              >
                CANCEL
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() =>
                  void handleDeleteMix()
                }
                disabled={deletingMixId !== null}
              >
                {deletingMixId !== null
                  ? "DELETING..."
                  : "DELETE MIX"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
