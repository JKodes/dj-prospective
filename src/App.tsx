
import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Disc3,
  ListMusic,
  Search,
  ArrowRight,
  Music2,
  Plus,
} from "lucide-react";

import NewMixForm from "./components/NewMixForm";

import {
  createResearchMix,
  loadMixWorkspace,
  type WorkspaceMix,
  type NewMixInput,
} from "./database/mixWorkspace";

import "./App.css";

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
  tracks: Song[];
};

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

const demoMixes: Mix[] = [
  {
    id: "demo-1",
    title: "Friday Night Mix",
    dj: "DJ Marcus",
    genre: "Dancehall / Open Format",
    tracks: [
      demoSongs.a, demoSongs.b, demoSongs.c, demoSongs.d,
      demoSongs.e, demoSongs.f, demoSongs.g, demoSongs.h,
    ],
  },
  {
    id: "demo-2",
    title: "Summer Sessions",
    dj: "DJ Rico",
    genre: "Afrobeats / Dancehall",
    tracks: [
      demoSongs.i, demoSongs.j, demoSongs.c, demoSongs.k,
      demoSongs.l, demoSongs.m, demoSongs.n, demoSongs.o,
    ],
  },
  {
    id: "demo-3",
    title: "Party Takeover",
    dj: "DJ Nova",
    genre: "Open Format",
    tracks: [
      demoSongs.h, demoSongs.a, demoSongs.c, demoSongs.g,
      demoSongs.j, demoSongs.k, demoSongs.e, demoSongs.f,
    ],
  },
];

function convertMixes(rows: WorkspaceMix[]): Mix[] {
  return rows.map((mix) => ({
    id: mix.id,
    title: mix.title,
    dj: mix.dj,
    genre: mix.genre,
    tracks: mix.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      rating: track.rating,
    })),
  }));
}

export default function App() {
  const [savedMixes, setSavedMixes] = useState<Mix[]>([]);
  const [mode, setMode] = useState<"saved" | "demo">("saved");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewMix, setShowNewMix] = useState(false);

  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [demoRatings, setDemoRatings] = useState<Record<string, number>>({});

  const mixes = mode === "demo" ? demoMixes : savedMixes;
  const activeSong = hoveredSong ?? selectedSong;

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
          setError(String(err));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const allSongs = useMemo(() => {
    const unique = new Map<string, Song>();

    for (const mix of mixes) {
      for (const song of mix.tracks) {
        unique.set(song.id, song);
      }
    }

    return [...unique.values()];
  }, [mixes]);

  const currentSong = allSongs.find(
    (song) => song.id === activeSong
  );

  const appearances = useMemo(() => {
    if (!activeSong) return [];

    return mixes.flatMap((mix) =>
      mix.tracks.flatMap((song, index) =>
        song.id === activeSong
          ? [{
              mixId: mix.id,
              title: mix.title,
              dj: mix.dj,
              position: index + 1,
              nextTracks: mix.tracks.slice(index + 1, index + 6),
            }]
          : []
      )
    );
  }, [mixes, activeSong]);

  function trackState(
    mix: Mix,
    index: number
  ): "selected" | "following" | "normal" {
    if (!activeSong) return "normal";

    if (mix.tracks[index].id === activeSong) {
      return "selected";
    }

    const follows = mix.tracks.some(
      (track, selectedIndex) =>
        track.id === activeSong &&
        index > selectedIndex &&
        index <= selectedIndex + 5
    );

    return follows ? "following" : "normal";
  }

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
  }

  function changeMode(next: "saved" | "demo") {
    setMode(next);
    setSelectedSong(next === "demo" ? "c" : null);
    setHoveredSong(null);
    setSearch("");
  }

  function changeSearch(value: string) {
    setSearch(value);

    if (!value.trim()) {
      setSelectedSong(null);
      return;
    }

    const match = allSongs.find(
      (song) =>
        song.title.toLowerCase().includes(value.toLowerCase()) ||
        song.artist.toLowerCase().includes(value.toLowerCase())
    );

    setSelectedSong(match?.id ?? null);
  }

  const currentRating = currentSong
    ? mode === "demo"
      ? demoRatings[currentSong.id] ?? currentSong.rating
      : currentSong.rating
    : 0;

  return (
    <div className="cratefire-app">
      <aside className="cf-sidebar">
        <div className="cf-logo">
          <Flame size={27} />
          <span>CrateFire</span>
        </div>

        <p className="cf-nav-heading">WORKSPACE</p>

        <nav className="cf-nav">
          <button className="cf-nav-link active" type="button">
            <Disc3 size={19} />
            DJ Mixes
          </button>

          <button className="cf-nav-link" type="button" disabled>
            <Search size={19} />
            Song Discovery
          </button>

          <button className="cf-nav-link" type="button" disabled>
            <ListMusic size={19} />
            My Crates
          </button>
        </nav>

        <div className="cf-sidebar-bottom">
          Personal DJ Research Workspace
        </div>
      </aside>

      <main className="cf-main">
        <header className="cf-header">
          <div>
            <p className="cf-eyebrow">MIX RESEARCH WORKSPACE</p>
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

        {error && (
          <div className="alert alert-danger" role="alert">
            Database error: {error}
          </div>
        )}

        <div className="cf-workspace-tabs">
          <button
            type="button"
            className={mode === "saved" ? "active" : ""}
            onClick={() => changeMode("saved")}
          >
            MY SAVED MIXES ({savedMixes.length})
          </button>

          <button
            type="button"
            className={mode === "demo" ? "active" : ""}
            onClick={() => changeMode("demo")}
          >
            SAMPLE COMPARISON
          </button>
        </div>

        <section className="cf-toolbar">
          <div className="cf-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search a song or artist..."
              aria-label="Search songs"
            />
          </div>

          <div className="cf-legend">
            <span><i className="cf-key selected" /> Matching song</span>
            <span><i className="cf-key following" /> Next 5 songs</span>
          </div>
        </section>

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
            <p>
              Or open SAMPLE COMPARISON to try the discovery feature.
            </p>
          </div>
        ) : (
          <section
            className="cf-mix-grid"
            onMouseLeave={() => setHoveredSong(null)}
          >
            {mixes.map((mix) => (
              <article className="cf-mix-card" key={mix.id}>
                <div className="cf-mix-heading">
                  <Disc3 size={25} className="cf-accent" />
                  <h2>{mix.title}</h2>
                  <p>{mix.dj}</p>
                  <span className="cf-genre">
                    {mix.genre || "Mixed Genre"}
                  </span>
                </div>

                {mix.tracks.length === 0 ? (
                  <div className="cf-no-tracks">
                    <Music2 size={25} />
                    <p>No tracks added yet.</p>
                    <small>
                      Track entry is our next feature.
                    </small>
                  </div>
                ) : (
                  <div className="cf-tracks">
                    {mix.tracks.map((song, index) => {
                      const state = trackState(mix, index);

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
                          onBlur={() => setHoveredSong(null)}
                          onClick={() =>
                            setSelectedSong(song.id)
                          }
                          aria-pressed={state === "selected"}
                        >
                          <span className="cf-track-number">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <span className="cf-track-info">
                            <strong>{song.title}</strong>
                            <small>{song.artist}</small>
                          </span>

                          {state === "selected" && (
                            <Flame
                              size={16}
                              className="cf-accent"
                            />
                          )}

                          {state === "following" && (
                            <ArrowRight
                              size={15}
                              className="cf-next-icon"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}

        <section className="cf-inspector">
          <div className="cf-inspector-heading">
            <Music2 size={22} className="cf-accent" />
            <div>
              <h2>Song Reference</h2>
              <p>Compare song appearances across mixes.</p>
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
                    {[1, 2, 3, 4, 5].map((value) => (
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
                          setDemoRatings((current) => ({
                            ...current,
                            [currentSong.id]: value,
                          }))
                        }
                        aria-label={`Rate ${value} fires`}
                        aria-pressed={currentRating === value}
                      >
                        🔥
                      </button>
                    ))}
                  </div>

                  {mode === "saved" && (
                    <small className="cf-muted">
                      Rating editing is coming with track entry.
                    </small>
                  )}
                </div>
              </div>

              <p className="cf-reference-count">
                Found {appearances.length} appearance(s)
                across {new Set(
                  appearances.map((a) => a.mixId)
                ).size} mix(es)
              </p>

              <div className="cf-reference-grid">
                {appearances.map((item) => (
                  <div
                    className="cf-reference-card"
                    key={`${item.mixId}-${item.position}`}
                  >
                    <h4>{item.title}</h4>
                    <p>
                      {item.dj} · Track #{item.position}
                    </p>
                    <strong>Next five tracks</strong>

                    {item.nextTracks.length > 0 ? (
                      <ol>
                        {item.nextTracks.map((song, i) => (
                          <li key={i}>
                            {song.title} — {song.artist}
                          </li>
                        ))}
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
              Select a song from a mix to see its references.
            </p>
          )}
        </section>

        {mode === "demo" && (
          <p className="cf-demo-note">
            Sample mixes and ratings are for demonstration only.
            They are not stored in SQLite.
          </p>
        )}
      </main>

      {showNewMix && (
        <NewMixForm
          onSave={handleCreateMix}
          onClose={() => setShowNewMix(false)}
        />
      )}
    </div>
  );
}

