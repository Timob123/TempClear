import ItemForm from "./ItemForm";
import { dispositionColor, dispositionLabel, DISPOSITION_OPTIONS } from "../lib/disposition";
import { photoPublicUrl } from "../lib/supabase";
import type { DispositionStatus } from "../types";
import type { ItemInput, ItemWithPhotos } from "../lib/api";
import type { Photo } from "../types";
import "./ImageUploadModal.css";

type Props = {
  item: ItemWithPhotos | null;
  open: boolean;
  isAdmin: boolean;
  categories?: string[];
  disposals?: string[];
  editing: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (input: ItemInput) => Promise<void>;
  onDelete: () => void;
  onAddImage: () => void;
  onDispositionChange: (status: DispositionStatus) => void;
  onDownloadPhoto: (photo: Photo) => void;
  onRemovePhoto: (photo: Photo) => void;
};

function disposalBadgeStyle(method: string | null) {
  const c = method ? "#5c4a32" : "var(--muted)";
  return { backgroundColor: `${c}18`, color: c };
}

export default function ItemViewModal({
  item,
  open,
  isAdmin,
  categories = [],
  disposals = [],
  editing,
  onClose,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAddImage,
  onDispositionChange,
  onDownloadPhoto,
  onRemovePhoto,
}: Props) {
  if (!open || !item) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-item-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card item-view-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {editing ? (
          <>
            <h2 id="view-item-title">Edit item</h2>
            <p className="modal-sub">Item {item.external_id ?? "—"}</p>
            <ItemForm
              mode="edit"
              initial={item}
              categories={categories}
              disposals={disposals}
              onSave={onSaveEdit}
              onCancel={onCancelEdit}
            />
          </>
        ) : (
          <>
            <p className="detail-id">Item {item.external_id ?? "—"}</p>
            <h2 id="view-item-title">{item.brief_description ?? "No description"}</h2>

            <dl className="detail-meta">
              <dt>Category</dt>
              <dd>{item.category ?? "—"}</dd>
              <dt>Disposal</dt>
              <dd>
                <span className="disposal-badge" style={disposalBadgeStyle(item.disposal_method)}>
                  {item.disposal_method ?? "—"}
                </span>
              </dd>
              <dt>Whereabouts</dt>
              <dd>
                {isAdmin ? (
                  <select
                    className="detail-status-select"
                    value={item.disposition_status ?? "at_cragleigh"}
                    onChange={(e) => onDispositionChange(e.target.value as DispositionStatus)}
                  >
                    {DISPOSITION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className="disposal-badge"
                    style={{
                      backgroundColor: `${dispositionColor(item.disposition_status)}18`,
                      color: dispositionColor(item.disposition_status),
                    }}
                  >
                    {dispositionLabel(item.disposition_status)}
                  </span>
                )}
              </dd>
              <dt>Catalog</dt>
              <dd>{item.catalog_status}</dd>
              <dt>Photo refs</dt>
              <dd>
                <code>{item.photo_refs_raw ?? "—"}</code>
              </dd>
              {item.comments && (
                <>
                  <dt>Comments</dt>
                  <dd>{item.comments}</dd>
                </>
              )}
            </dl>

            {isAdmin && (
              <div className="admin-actions">
                <button type="button" className="btn-ghost" onClick={onEdit}>
                  Edit
                </button>
                <button type="button" className="btn-danger" onClick={onDelete}>
                  Delete item
                </button>
                <button type="button" className="btn-ghost" onClick={onAddImage}>
                  Add image
                </button>
              </div>
            )}

            {item.photos.length > 0 ? (
              <div className="gallery">
                {item.photos.map((p) => {
                  const url = photoPublicUrl(p.storage_path);
                  if (!url) return null;
                  return (
                    <div key={p.id} className="gallery-item">
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`IMG ${p.img_number}`} />
                      </a>
                      <span>IMG_{p.img_number}</span>
                      <div className="gallery-btns">
                        <button
                          type="button"
                          className="btn-ghost btn-sm"
                          onClick={() => onDownloadPhoto(p)}
                        >
                          Download
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            onClick={() => onRemovePhoto(p)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">
                No images yet.
                {isAdmin && " Use Add image to upload."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
