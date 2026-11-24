import { useState } from "react";
import { uploadCloudBackup } from "../database/cloudBackup";

const LAST_BACKUP_KEY = "cratefire:lastSuccessfulCloudBackup";

export default function CloudBackupButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [failed, setFailed] = useState(false);
  const [lastBackup, setLastBackup] = useState(
    () => localStorage.getItem(LAST_BACKUP_KEY) || ""
  );

  async function handleBackup() {
    if (loading) return;

    setLoading(true);
    setMessage("");
    setErrorDetails("");
    setFailed(false);

    try {
      await uploadCloudBackup();

      const completedAt = new Date().toISOString();

      localStorage.setItem(LAST_BACKUP_KEY, completedAt);
      setLastBackup(completedAt);
      setMessage("Your CrateFire data was backed up successfully.");
    } catch (err) {
      setFailed(true);
      setMessage(
        "Cloud backup failed. Your local data is still safe on this device."
      );

      setErrorDetails(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        className="btn btn-outline-light btn-sm w-100"
        onClick={handleBackup}
        disabled={loading}
      >
        {loading ? "Backing up..." : "Back Up to Cloud"}
      </button>

      {lastBackup && (
        <p className="small text-secondary mt-2 mb-0">
          Last backup: {new Date(lastBackup).toLocaleString()}
        </p>
      )}

      {message && (
        <div
          className={`small mt-2 ${
            failed ? "text-danger" : "text-success"
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="mb-2">{message}</p>

          {failed && (
            <>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm w-100"
                onClick={handleBackup}
                disabled={loading}
              >
                Retry Backup
              </button>

              {errorDetails && (
                <details className="mt-2">
                  <summary>Technical details</summary>
                  <p className="mt-1 text-secondary">
                    {errorDetails}
                  </p>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
