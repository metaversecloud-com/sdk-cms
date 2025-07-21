import { useState, useContext } from "react";
import { backendAPI, setErrorMessage } from "@/utils";
import { GlobalDispatchContext } from "@/context/GlobalContext";

export const LinkModal = ({
  assetId,
  currentLink,
  onClose,
}: {
  assetId: string;
  currentLink: string;
  onClose: () => void;
}) => {
  const dispatch = useContext(GlobalDispatchContext);

  const [link, setLink] = useState(currentLink);
  const [loading, setLoading] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);

  const isValidUrl = link.trim().startsWith("https://");

  const onUpdate = async () => {
    if (!isValidUrl) return;
    setLoading(true);
    setAreButtonsDisabled(true);
    try {
      await backendAPI.put("/update-link", { assetId, link });
      onClose();
    } catch (err: any) {
      setErrorMessage(dispatch, err);
    } finally {
      setLoading(false);
      setAreButtonsDisabled(false);
    }
  };

  const onCancel = () => {
    if (areButtonsDisabled) return;
    onClose();
  };

  return (
    <div className="modal-container">
      <div className="modal">
        <h4>Update Asset Link</h4>
        <input
          type="text"
          className="input mb-4"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com/..."
        />
        {!isValidUrl && link.trim().length > 0 && <p className="p3 text-error">Link must start with “https://”</p>}
        <div className="actions">
          <button
            className="btn"
            onClick={onUpdate}
            disabled={areButtonsDisabled || loading || !link.trim() || !isValidUrl}
          >
            {loading ? "Updating…" : "Update"}
          </button>
          <button className="btn btn-outline" onClick={onCancel} disabled={areButtonsDisabled || loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkModal;
