import { useEffect, useState } from "react";
import { fetchMullensGroupItems, type MullensGroupItem } from "../lib/api";
import { photoPublicUrl } from "../lib/supabase";
import type { MullensGroup } from "../types";
import "./ImageUploadModal.css";

type Props = {
  group: MullensGroup | null;
  open: boolean;
  onClose: () => void;
  onOpenMaster?: (externalId: string) => void;
};

export default function GroupDetailModal({ group, open, onClose, onOpenMaster }: Props) {
  const [items, setItems] = useState<MullensGroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !group) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetchMullensGroupItems(group.group_number)
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [open, group?.group_number]);

  if (!open || !group) return null;

  const groupPhotoUrl = group.storage_path ? photoPublicUrl(group.storage_path, "preview") : null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card item-view-modal group-detail-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <header className="group-detail-header">
          {groupPhotoUrl && (
            <img src={groupPhotoUrl} alt="" className="group-detail-photo" />
          )}
          <div>
            <h2 id="group-detail-title">
              Group {group.group_number}
            </h2>
            <p className="group-detail-subtitle">{group.title}</p>
            <p className="muted">
              {group.item_count} item{group.item_count === 1 ? "" : "s"} on Mullens list
            </p>
          </div>
        </header>

        {loading && <p className="muted">Loading items…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div className="group-items-table-wrap">
            <table className="table table--compact">
              <thead>
                <tr>
                  <th></th>
                  <th>Mullens #</th>
                  <th>Master #</th>
                  <th>Description</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const thumb = item.photos.find((p) => p.uploaded && p.storage_path) ?? item.photos[0];
                  const thumbUrl = thumb ? photoPublicUrl(thumb.storage_path, "thumb") : null;
                  return (
                    <tr key={item.id}>
                      <td className="thumb-cell">
                        {thumbUrl ? (
                          <img src={thumbUrl} alt="" className="thumb" loading="lazy" />
                        ) : (
                          <span className="no-thumb">—</span>
                        )}
                      </td>
                      <td className="num">{item.mullens_item_no ?? "—"}</td>
                      <td className="num">
                        {item.master_external_id ? (
                          onOpenMaster ? (
                            <button
                              type="button"
                              className="link-btn"
                              onClick={() => onOpenMaster(item.master_external_id!)}
                            >
                              {item.master_external_id}
                            </button>
                          ) : (
                            item.master_external_id
                          )
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="desc">{item.brief_description ?? "—"}</td>
                      <td className="cat">{item.category ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
