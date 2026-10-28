import { useState, type FormEvent } from "react";
import { X, Disc3 } from "lucide-react";
import type { NewMixInput } from "../database/mixWorkspace";

type Props = {
  onSave: (input: NewMixInput) => Promise<void>;
  onClose: () => void;
};

const initialForm: NewMixInput = {
  title: "",
  dj_name: "",
  genre: "",
  source_url: "",
  notes: "",
  rating: 0,
};

export default function NewMixForm({ onSave, onClose }: Props) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mixRating, setMixRating] = useState(0);

  function change(field: keyof NewMixInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({
        ...form,
        rating: mixRating,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="cf-modal-backdrop">
      <section
        className="cf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-mix-title"
      >
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Disc3 className="cf-accent" />
            <h2 id="new-mix-title" className="m-0">
              Create DJ Mix
            </h2>
          </div>

          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={onClose}
            disabled={saving}
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>

        <p className="cf-muted mb-4">
          Save a DJ mix you want to study. We'll add its ordered tracklist
          afterward.
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <label htmlFor="mix-title" className="form-label">
            Mix Title *
          </label>
          <input
            id="mix-title"
            className="form-control mb-3"
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
            placeholder="Friday Night Dancehall"
            required
            autoFocus
          />

          <label htmlFor="dj-name" className="form-label">
            DJ Name *
          </label>
          <input
            id="dj-name"
            className="form-control mb-3"
            value={form.dj_name}
            onChange={(e) => change("dj_name", e.target.value)}
            placeholder="DJ Marcus"
            required
          />

          <label htmlFor="mix-genre" className="form-label">
            Genre / Theme
          </label>
          <input
            id="mix-genre"
            className="form-control mb-3"
            value={form.genre}
            onChange={(e) => change("genre", e.target.value)}
            placeholder="Dancehall / Afrobeats"
          />

          <label htmlFor="mix-source" className="form-label">
            Original Mix Link (optional)
          </label>
          <input
            id="mix-source"
            type="url"
            className="form-control mb-3"
            value={form.source_url}
            onChange={(e) => change("source_url", e.target.value)}
            placeholder="https://..."
          />

          <label htmlFor="mix-notes" className="form-label">
            DJ Notes
          </label>
          <textarea
            id="mix-notes"
            className="form-control mb-4"
            rows={3}
            value={form.notes}
            onChange={(e) => change("notes", e.target.value)}
            placeholder="What makes this mix interesting?"
          />

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={onClose}
              disabled={saving}
            >
              CANCEL
            </button>

            {/* Overall DJ Mix Rating */}
            <div className="mb-3">
              <label className="form-label">Overall Mix Rating</label>

              <div
                className="d-flex align-items-center gap-2"
                role="group"
                aria-label="Overall DJ mix rating"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="btn btn-outline-light"
                    onClick={() => setMixRating(value)}
                    aria-label={`Rate mix ${value} out of 5`}
                    aria-pressed={mixRating === value}
                  >
                    {value <= mixRating ? "👌" : "◯"}
                  </button>
                ))}

                <span className="cf-muted ms-2">
                  {mixRating === 0 ? "Not rated" : `${mixRating}/5`}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn cf-primary-btn"
              disabled={saving}
            >
              {saving ? "SAVING..." : "SAVE MIX"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
