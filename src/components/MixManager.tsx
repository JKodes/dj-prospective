
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Disc3,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  ListMusic,
  Search,
  Music2,
} from "lucide-react";

import {
  getMixes,
  createMix,
  updateMix,
  deleteMix,
  type DJMix,
  type MixInput,
} from "../database/mixes";

import MixTracklist from "./MixTracklist";

const emptyForm: MixInput = {
  title: "",
  dj_name: "",
  genre: "",
  source_url: "",
  notes: "",
};

export default function MixManager() {
  const [mixes, setMixes] = useState<DJMix[]>([]);
  const [selectedMix, setSelectedMix] = useState<DJMix | null>(null);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState<MixInput>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadMixes = useCallback(async () => {
    try {
      const data = await getMixes();
      setMixes(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMixes();
  }, [loadMixes]);

  function startNewMix() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function startEditing(mix: DJMix) {
    setEditingId(mix.id);
    setForm({
      title: mix.title,
      dj_name: mix.dj_name,
      genre: mix.genre,
      source_url: mix.source_url,
      notes: mix.notes,
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  function changeField(
    field: keyof MixInput,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim() || !form.dj_name.trim()) {
      setError("Mix title and DJ name are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateMix(editingId, form);
      } else {
        await createMix(form);
      }

      await loadMixes();
      closeAfterSave();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  }

  function closeAfterSave() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleDelete(mix: DJMix) {
    if (
      !window.confirm(
        `Delete "${mix.title}" by ${mix.dj_name}?`
      )
    ) {
      return;
    }

    setDeletingId(mix.id);
    setError("");

    try {
      await deleteMix(mix.id);
      await loadMixes();
    } catch (err) {
      setError(String(err));
    } finally {
      setDeletingId(null);
    }
  }

  const filteredMixes = mixes.filter((mix) =>
    [mix.title, mix.dj_name, mix.genre]
      .some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
  );

  if (selectedMix) {
    return (
      <MixTracklist
        mix={selectedMix}
        onBack={() => {
          setSelectedMix(null);
          void loadMixes();
        }}
      />
    );
  }

  return (
    <section className="mix-manager">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2>DJ Mix Collection</h2>
          <p className="muted mb-0">
            Research DJ tracklists and discover new song sequences.
          </p>
        </div>

        <button
          type="button"
          className="btn fire-button"
          onClick={startNewMix}
        >
          <Plus size={18} />
          NEW MIX
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div className="d-flex gap-3">
          <div className="content-card py-2 px-3">
            <span className="muted">Saved Mixes</span>
            <h3 className="mb-0">{mixes.length}</h3>
          </div>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search DJ mixes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search DJ mixes"
          />
        </div>
      </div>

      {loading ? (
        <p className="muted">Loading DJ mixes...</p>
      ) : filteredMixes.length === 0 ? (
        <div className="content-card text-center py-5">
          <Disc3 size={42} className="accent-icon" />

          <h3 className="mt-3">
            {search ? "No matching mixes" : "No DJ mixes yet"}
          </h3>

          <p className="muted">
            {search
              ? "Try another DJ name, title, or genre."
              : "Create your first DJ mix to get started."}
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {filteredMixes.map((mix) => (
            <div className="col-md-6 col-xl-4" key={mix.id}>
              <div className="content-card h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start">
                  <Disc3
                    size={30}
                    className="accent-icon"
                  />

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light"
                      onClick={() => startEditing(mix)}
                      title="Edit mix"
                      aria-label={`Edit ${mix.title}`}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(mix)}
                      disabled={deletingId === mix.id}
                      title="Delete mix"
                      aria-label={`Delete ${mix.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 mb-2">{mix.title}</h3>
                <p className="muted mb-2">{mix.dj_name}</p>

                {mix.genre && (
                  <div className="mb-3">
                    <span className="badge text-bg-secondary">
                      {mix.genre}
                    </span>
                  </div>
                )}

                {mix.notes && (
                  <p className="muted mt-2">
                    {mix.notes}
                  </p>
                )}

                {mix.source_url && (
                  <a
                    href={mix.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mix-source-link mb-3"
                  >
                    <ExternalLink size={15} />
                    Original Mix
                  </a>
                )}

                <button
                  type="button"
                  className="btn fire-button mt-auto align-self-start"
                  onClick={() => setSelectedMix(mix)}
                >
                  <ListMusic size={17} />
                  VIEW TRACKLIST
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="custom-backdrop">
          <section
            className="add-song-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mix-form-title"
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <Music2 className="accent-icon" />
              <h2 id="mix-form-title" className="mb-0">
                {editingId ? "Edit DJ Mix" : "Create DJ Mix"}
              </h2>
            </div>

            <p className="muted">
              Record the details of a DJ mix you want to study.
            </p>

            <form onSubmit={handleSave}>
              <label htmlFor="mix-title" className="form-label">
                Mix Title
              </label>
              <input
                id="mix-title"
                className="form-control mb-3"
                value={form.title}
                onChange={(e) =>
                  changeField("title", e.target.value)
                }
                required
                autoFocus
              />

              <label htmlFor="mix-dj" className="form-label">
                DJ Name
              </label>
              <input
                id="mix-dj"
                className="form-control mb-3"
                value={form.dj_name}
                onChange={(e) =>
                  changeField("dj_name", e.target.value)
                }
                required
              />

              <label htmlFor="mix-genre" className="form-label">
                Genre / Theme
              </label>
              <input
                id="mix-genre"
                className="form-control mb-3"
                placeholder="Dancehall, Afrobeats, Open Format..."
                value={form.genre}
                onChange={(e) =>
                  changeField("genre", e.target.value)
                }
              />

              <label htmlFor="mix-url" className="form-label">
                Original Mix URL
              </label>
              <input
                id="mix-url"
                type="url"
                className="form-control mb-3"
                placeholder="https://..."
                value={form.source_url}
                onChange={(e) =>
                  changeField("source_url", e.target.value)
                }
              />

              <label htmlFor="mix-notes" className="form-label">
                Notes
              </label>
              <textarea
                id="mix-notes"
                className="form-control mb-4"
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  changeField("notes", e.target.value)
                }
              />

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn cancel-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="btn fire-button"
                  disabled={saving}
                >
                  {saving ? "SAVING..." : "SAVE MIX"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
