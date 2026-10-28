import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Disc3,
  Flame,
  Music2,
  Search,
} from "lucide-react";

export type ComparisonSong = {
  id: string;
  title: string;
  artist: string;
  rating: number;
};

export type ComparisonMix = {
  id: string;
  title: string;
  dj: string;
  genre: string;
  rating: number;
  tracks: ComparisonSong[];
};

type Props = {
  mixes: ComparisonMix[];
  onBack: () => void;
};

type Appearance = {
  mixId: string;
  mixTitle: string;
  dj: string;
  position: number;
  nextTracks: ComparisonSong[];
};

export default function MixComparison({
  mixes,
  onBack,
}: Props) {
  const [hoveredSongId, setHoveredSongId] =
    useState<string | null>(null);

  const [selectedSongId, setSelectedSongId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");

  const activeSongId = hoveredSongId ?? selectedSongId;

  const allSongs = useMemo(() => {
    const songs = new Map<string, ComparisonSong>();

    for (const mix of mixes) {
      for (const song of mix.tracks) {
        if (!songs.has(song.id)) {
          songs.set(song.id, song);
        }
      }
    }

    return [...songs.values()];
  }, [mixes]);

  const currentSong = allSongs.find(
    (song) => song.id === activeSongId
  );

  const appearances = useMemo<Appearance[]>(() => {
    if (!activeSongId) return [];

    return mixes.flatMap((mix) =>
      mix.tracks.flatMap((song, index) =>
        song.id === activeSongId
          ? [{
              mixId: mix.id,
              mixTitle: mix.title,
              dj: mix.dj,
              position: index + 1,
              nextTracks: mix.tracks.slice(
                index + 1,
                index + 6
              ),
            }]
          : []
      )
    );
  }, [mixes, activeSongId]);

  // Compute highlighted positions once per selected song.
  const highlights = useMemo(() => {
    const result = new Map<
      string,
      { selected: Set<number>; following: Set<number> }
    >();

    for (const mix of mixes) {
      const selected = new Set<number>();
      const following = new Set<number>();

      if (activeSongId) {
        mix.tracks.forEach((song, index) => {
          if (song.id !== activeSongId) return;

          selected.add(index);

          for (
            let next = index + 1;
            next <= index + 5 && next < mix.tracks.length;
            next++
          ) {
            following.add(next);
          }
        });
      }

      result.set(mix.id, { selected, following });
    }

    return result;
  }, [mixes, activeSongId]);

  function handleSearch(value: string) {
    setSearch(value);
    setHoveredSongId(null);

    if (!value.trim()) {
      setSelectedSongId(null);
      return;
    }

    const query = value.trim().toLowerCase();

    const match = allSongs.find(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
    );

    setSelectedSongId(match?.id ?? null);
  }

  return (
    <div className="cf-comparison">
      <button
        type="button"
        className="btn btn-outline-light mb-4"
        onClick={onBack}
      >
        <ArrowLeft size={16} className="me-2" />
        BACK TO MIX LIBRARY
      </button>

      <header className="cf-header">
        <div>
          <p className="cf-eyebrow">
            MIX RESEARCH WORKSPACE
          </p>
          <h1>Selected Mix Comparison</h1>
          <p className="cf-muted">
            Comparing {mixes.length} DJ mixes in original
            playback order.
          </p>
        </div>
      </header>

      <section className="cf-toolbar">
        <div className="cf-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) =>
              handleSearch(event.target.value)
            }
            placeholder="Find a song or artist..."
            aria-label="Search comparison songs"
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

      <section
        className="cf-mix-grid"
        onMouseLeave={() => setHoveredSongId(null)}
      >
        {mixes.map((mix) => {
          const highlighted = highlights.get(mix.id);

          return (
            <article className="cf-mix-card" key={mix.id}>
              <div className="cf-mix-heading">
                <Disc3
                  size={25}
                  className="cf-accent"
                />
                <h2>{mix.title}</h2>
                <p>{mix.dj}</p>
                <span className="cf-genre">
                  {mix.genre || "Mixed Genre"}
                </span>
                <p className="cf-muted mt-2">
                  {mix.tracks.length} tracks ·{" "}
                  {mix.rating > 0
                    ? "👌".repeat(mix.rating)
                    : "Not rated"}
                </p>
              </div>

              {mix.tracks.length === 0 ? (
                <div className="cf-no-tracks">
                  <Music2 size={25} />
                  <p>No tracks recorded yet.</p>
                </div>
              ) : (
                <div className="cf-tracks">
                  {mix.tracks.map((song, index) => {
                    const state =
                      highlighted?.selected.has(index)
                        ? "selected"
                        : highlighted?.following.has(index)
                        ? "following"
                        : "normal";

                    return (
                      <button
                        key={`${mix.id}-${index}`}
                        type="button"
                        className={`cf-track ${state}`}
                        onMouseEnter={() =>
                          setHoveredSongId(song.id)
                        }
                        onFocus={() =>
                          setHoveredSongId(song.id)
                        }
                        onBlur={() =>
                          setHoveredSongId(null)
                        }
                        onClick={() =>
                          setSelectedSongId(song.id)
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
          );
        })}
      </section>

      <section className="cf-inspector">
        <div className="cf-inspector-heading">
          <Music2
            size={22}
            className="cf-accent"
          />
          <div>
            <h2>Song Reference</h2>
            <p>
              Compare matching songs and their
              following five tracks.
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
                  {"🔥".repeat(currentSong.rating)}
                </div>
              </div>
            </div>

            <p className="cf-reference-count">
              Found {appearances.length} appearance(s)
              across{" "}
              {
                new Set(
                  appearances.map((item) => item.mixId)
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
                  <h4>{item.mixTitle}</h4>
                  <p>
                    {item.dj} · Track #{item.position}
                  </p>

                  <strong>Next five tracks</strong>

                  {item.nextTracks.length > 0 ? (
                    <ol>
                      {item.nextTracks.map((song, index) => (
                        <li key={index}>
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
            Hover over or select a song to compare
            its occurrences across the selected mixes.
          </p>
        )}
      </section>
    </div>
  );
}
