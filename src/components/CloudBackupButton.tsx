import { useState } from "react";
import {
  uploadCloudBackup,
  retrieveCloudBackup,
} from "../database/cloudBackup";

const LAST_BACKUP_KEY = "cratefire:lastSuccessfulCloudBackup";
const LAST_RETRIEVAL_KEY = "cratefire:lastSuccessfulCloudRetrieval";

type FailedAction = "backup" | "retrieve" | null;

export default function CloudBackupButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");
  const [failed, setFailed] = useState(false);
  const [failedAction, setFailedAction] = useState<FailedAction>(null);

  const [lastBackup, setLastBackup] = useState(
    () => localStorage.getItem(LAST_BACKUP_KEY) || ""
  );

  const [lastRetrieval, setLastRetrieval] = useState(
    () => localStorage.getItem(LAST_RETRIEVAL_KEY) || ""
  );

  function resetFeedback() {
    setMessage("");
    setErrorDetails("");
    setFailed(false);
    setFailedAction(null);
  }

  async function handleBackup() {
    if (loading) return;

    setLoading(true);
    resetFeedback();

    try {
      await uploadCloudBackup();

      const completedAt = new Date().toISOString();

      localStorage.setItem(LAST_BACKUP_KEY, completedAt);
      setLastBackup(completedAt);
      setMessage("Your CrateFire data was backed up successfully.");
    } catch (err) {
      setFailed(true);
      setFailedAction("backup");
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

  async function handleRetrieval() {
    if (loading) return;

    setLoading(true);
    resetFeedback();

    try {
      const backup = await retrieveCloudBackup();

      const retrievedAt = new Date().toISOString();

      localStorage.setItem(LAST_RETRIEVAL_KEY, retrievedAt);
      setLastRetrieval(retrievedAt);

      setMessage(
        `Cloud backup retrieved successfully. Created ${new Date(
          backup.createdAt
        ).toLocaleString()}. Your local data has not been changed.`
      );
    } catch (err) {
      setFailed(true);
      setFailedAction("retrieve");
      setMessage("Could not retrieve your cloud backup.");
      setErrorDetails(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRetry() {
    if (failedAction === "retrieve") {
      await handleRetrieval();
    } else {
      await handleBackup();
    }
  }

  return (
    <div className="mt-3">
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-outline-light btn-sm flex-fill"
          onClick={handleBackup}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Back Up to Cloud"}
        </button>

        <button
          type="button"
          className="btn btn-outline-info btn-sm flex-fill"
          onClick={handleRetrieval}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Retrieve from Cloud"}
        </button>
      </div>

      {lastBackup && (
        <p className="small text-secondary mt-2 mb-0">
          Last backup: {new Date(lastBackup).toLocaleString()}
        </p>
      )}

      {lastRetrieval && (
        <p className="small text-secondary mt-1 mb-0">
          Last retrieval: {new Date(lastRetrieval).toLocaleString()}
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
                onClick={handleRetry}
                disabled={loading}
              >
                Retry
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
