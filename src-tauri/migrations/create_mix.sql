-- CrateFire Database - Migration Version 1

-- Songs shared across different DJ mixes
CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    artist TEXT NOT NULL DEFAULT '',
    genre TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 3
        CHECK (rating BETWEEN 1 AND 5),
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Other DJs' mixes
CREATE TABLE IF NOT EXISTS mixes (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    dj_name TEXT NOT NULL,
    genre TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ordered songs in each DJ mix
CREATE TABLE IF NOT EXISTS mix_tracks (
    id TEXT PRIMARY KEY NOT NULL,
    mix_id TEXT NOT NULL,
    song_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1),
    notes TEXT NOT NULL DEFAULT '',

    FOREIGN KEY (mix_id)
        REFERENCES mixes(id) ON DELETE CASCADE,

    FOREIGN KEY (song_id)
        REFERENCES songs(id),

    UNIQUE (mix_id, position)
);

-- Your personal DJ crates
CREATE TABLE IF NOT EXISTS crates (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    theme TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Songs in your personal crates
CREATE TABLE IF NOT EXISTS crate_tracks (
    id TEXT PRIMARY KEY NOT NULL,
    crate_id TEXT NOT NULL,
    song_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 1),

    FOREIGN KEY (crate_id)
        REFERENCES crates(id) ON DELETE CASCADE,

    FOREIGN KEY (song_id)
        REFERENCES songs(id),

    UNIQUE (crate_id, position)
);

CREATE INDEX IF NOT EXISTS idx_mix_tracks_song
ON mix_tracks(song_id);

CREATE INDEX IF NOT EXISTS idx_mix_tracks_order
ON mix_tracks(mix_id, position);

CREATE INDEX IF NOT EXISTS idx_crate_tracks_order
ON crate_tracks(crate_id, position);

