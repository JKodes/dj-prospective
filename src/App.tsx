import { useMemo, useState } from "react";
import {
  Flame,
  Disc3,
  ListMusic,
  Search,
  ArrowRight,
  Music2,
} from "lucide-react";

import "./App.css";

type Song = {
  id: string;
  title: string;
  artist: string;
};

type DJMix = {
  id: string;
  title: string;
  dj: string;
  genre: string;
  tracks: Song[];
};

const songs: Record<string, Song> = {
  a: { id: "a", title: "Song A", artist: "Artist One" },
  b: { id: "b", title: "Song B", artist: "Artist Two" },
  c: { id: "c", title: "Song C", artist: "Artist Three" },
  d: { id: "d", title: "Song D", artist: "Artist Four" },
  e: { id: "e", title: "Song E", artist: "Artist Five" },
  f: { id: "f", title: "Song F", artist: "Artist Six" },
  g: { id: "g", title: "Song G", artist: "Artist Seven" },
  h: { id: "h", title: "Song H", artist: "Artist Eight" },
  i: { id: "i", title: "Song I", artist: "Artist Nine" },
  j: { id: "j", title: "Song J", artist: "Artist Ten" },
  k: { id: "k", title: "Song K", artist: "Artist Eleven" },
  l: { id: "l", title: "Song L", artist: "Artist Twelve" },
  m: { id: "m", title: "Song M", artist: "Artist Thirteen" },
  n: { id: "n", title: "Song N", artist: "Artist Fourteen" },
  o: { id: "o", title: "Song O", artist: "Artist Fifteen" },
};

const demoMixes: DJMix[] = [
  {
    id: "mix-1",
    title: "Friday Night Mix",
    dj: "DJ Marcus",
    genre: "Dancehall / Open Format",
    tracks: [
      songs.a, songs.b, songs.c, songs.d,
      songs.e, songs.f, songs.g, songs.h,
    ],
  },
  {
    id: "mix-2",
    title: "Summer Sessions",
    dj: "DJ Rico",
    genre: "Afrobeats / Dancehall",
    tracks: [
      songs.i, songs.j, songs.c, songs.k,
      songs.l, songs.m, songs.n, songs.o,
    ],
  },
  {
    id: "mix-3",
    title: "Party Takeover",
    dj: "DJ Nova",
    genre: "Open Format",
    tracks: [
      songs.h, songs.a, songs.c, songs.g,
      songs.j, songs.k, songs.e, songs.f,
    ],
  },
];

export default function App() {
  const [selectedSong, setSelectedSong] = useState<string | null>("c");
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [ratings, setRatings] = useState<Record<string, number>>({
    a: 4,
    b: 3,
    c: 5,
    d: 2,
    e: 4,
    f: 3,
    g: 5,
    h: 4,
    i: 3,
    j: 4,
    k: 3,
    l: 5,
    m: 2,
    n: 4,
    o: 3,
  });

  // Hover previews a song. Clicking makes the selection persistent.
  const activeSong = hoveredSong ?? selectedSong;

  // Find every occurrence of the selected song in every mix.
  const appearances = useMemo(() => {
    if (!activeSong) return [];

    return demoMixes.flatMap((mix) =>
      mix.tracks.flatMap((song, index) =>
        song.id === activeSong
          ? [{
              mixId: mix.id,
              mixTitle: mix.title,
              dj: mix.dj,
              position: index + 1,
              nextTracks: mix.tracks.slice(index + 1, index + 6),
            }]
          : []
      )
    );
  }, [activeSong]);

  function getTrackState(
    mix: DJMix,
    index: number
  ): "selected" | "following" | "normal" {
    if (!activeSong) return "normal";

    if (mix.tracks[index].id === activeSong) {
      return "selected";
    }

    // Support multiple appearances within the same mix.
    const isFollowing = mix.tracks.some(
      (track, selectedIndex) =>
        track.id === activeSong &&
        index > selectedIndex &&
        index <= selectedIndex + 5
    );

    return isFollowing ? "following" : "normal";
  }

  function updateRating(songId: string, value: number) {
    setRatings((current) => ({
      ...current,
      [songId]: value,
    }));
  }

  const currentSong = activeSong ? songs[activeSong] : null;

  return (
    <div className="cratefire-app">
      <aside className="cf-sidebar">
        <div className="cf-logo">
          <Flame size={27} />
          <span>CrateFire</span>
        </div>

        <p className="cf-nav-heading">WORKSPACE</p>

        <nav className="cf-nav">
          <button className="cf-nav-link active">
            <Disc3 size={19} />
            DJ Mixes
          </button>

          <button className="cf-nav-link" disabled title="Coming later">
            <Search size={19} />
            Song Discovery
          </button>

          <button className="cf-nav-link" disabled title="Coming later">
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
              Discover how other DJs sequence their tracks.
            </p>
          </div>

          <div className="cf-mix-count">
            <Disc3 size={18} />
            {demoMixes.length} Mixes
          </div>
        </header>

        <section className="cf-toolbar">
          <div className="cf-search">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                const term = event.target.value;
                setSearch(term);

                if (!term.trim()) return;

                const match = Object.values(songs).find(
                  (song) =>
                    song.title.toLowerCase().includes(term.toLowerCase()) ||
                    song.artist.toLowerCase().includes(term.toLowerCase())
                );

                if (match) setSelectedSong(match.id);
              }}
              placeholder="Search a song or artist..."
              aria-label="Search songs"
            />
          </div>

          <div className="cf-legend">
            <span><i className="cf-key selected" /> Matching song</span>
            <span><i className="cf-key following" /> Next 5 songs</span>
          </div>
        </section>

        <section
          className="cf-mix-grid"
          onMouseLeave={() => setHoveredSong(null)}
        >
          {demoMixes.map((mix) => (
            <article className="cf-mix-card" key={mix.id}>
              <div className="cf-mix-heading">
                <Disc3 size={25} className="cf-accent" />
                <h2>{mix.title}</h2>
                <p>{mix.dj}</p>
                <span className="cf-genre">{mix.genre}</span>
              </div>

              <div className="cf-tracks">
                {mix.tracks.map((song, index) => {
                  const state = getTrackState(mix, index);

                  return (
                    <button
                      key={`${mix.id}-${index}`}
                      type="button"
                      className={`cf-track ${state}`}
                      onMouseEnter={() => setHoveredSong(song.id)}
                      onFocus={() => setHoveredSong(song.id)}
                      onClick={() => setSelectedSong(song.id)}
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
                        <Flame size={16} className="cf-accent" />
                      )}

                      {state === "following" && (
                        <ArrowRight size={15} className="cf-next-icon" />
                      )}
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="cf-inspector">
          <div className="cf-inspector-heading">
            <Music2 size={22} className="cf-accent" />
            <div>
              <h2>Song Reference</h2>
              <p>Explore appearances across saved mixes.</p>
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
                  <span>YOUR RATING</span>
                  <div className="cf-fires">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={
                          value <= (ratings[currentSong.id] ?? 0)
                            ? "cf-fire lit"
                            : "cf-fire"
                        }
                        onClick={() =>
                          updateRating(currentSong.id, value)
                        }
                        aria-label={`Rate ${value} fires`}
                        aria-pressed={
                          ratings[currentSong.id] === value
                        }
                      >
                        🔥
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <p className="cf-reference-count">
                Found {appearances.length} time(s) across{" "}
                {new Set(appearances.map((a) => a.mixId)).size} mix(es)
              </p>

              <div className="cf-reference-grid">
                {appearances.map((appearance) => (
                  <div
                    className="cf-reference-card"
                    key={`${appearance.mixId}-${appearance.position}`}
                  >
                    <h4>{appearance.mixTitle}</h4>
                    <p>
                      {appearance.dj} · Track #{appearance.position}
                    </p>
                    <strong>Next five tracks</strong>

                    {appearance.nextTracks.length ? (
                      <ol>
                        {appearance.nextTracks.map((track, i) => (
                          <li key={i}>
                            {track.title} — {track.artist}
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
              Select a song to explore its appearances.
            </p>
          )}
        </section>

        <p className="cf-demo-note">
          Demo mode: mixes and ratings are sample data. Database
          persistence and mix editing will be connected next.
        </p>
      </main>
    </div>
  );
}
