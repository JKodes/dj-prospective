import { useState } from "react";
import { uploadCloudBackup } from "../database/cloudBackup";

export default function CloudBackupButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function handleBackup() {
    setLoading(true);
    setMessage("");
    setError(false);

    try {
      await uploadCloudBackup();
      setMessage("Backup completed successfully.");
    } catch (err) {
      setError(true);
      setMessage(
        err instanceof Error
          ? err.message
          : "Unable to back up your data."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn btn-outline-light"
        onClick={handleBackup}
        disabled={loading}
      >
        {loading ? "Backing up..." : "Back Up to Cloud"}
      </button>

      {message && (
        <p
          className={`small mt-2 mb-0 ${
            error ? "text-danger" : "text-success"
          }`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}