import { useCallback, useEffect, useMemo, useState } from "react";
import Login from "./components/Login";
import ImageUploadModal from "./components/ImageUploadModal";
import ItemModal from "./components/ItemModal";
import ItemViewModal from "./components/ItemViewModal";
import { useAuth } from "./context/AuthContext";
import {
  createItem,
  deleteItem,
  deletePhoto,
  downloadPhoto,
  fetchMasterItems,
  updateItem,
  uploadPhotoForItem,
  type ItemInput,
  type ItemWithPhotos,
} from "./lib/api";
import { dispositionColor, dispositionLabel, DISPOSITION_OPTIONS } from "./lib/disposition";
import { photoPublicUrl } from "./lib/supabase";
import type { DispositionStatus } from "./types";
import "./App.css";

function sortKey(externalId: string | null): number {
  if (!externalId) return 999999;
  const n = parseInt(externalId, 10);
  return Number.isNaN(n) ? 999998 : n;
}

function disposalColor(method: string | null): string {
  if (!method) return "var(--muted)";
  const m = method.toLowerCase();
  if (m.includes("mullens")) return "#4a6741";
  if (m.includes("clearance") || m.includes("ebay")) return "#8b5a2b";
  if (m.includes("john")) return "#3d5a80";
  if (m.includes("michael")) return "#6b4c7a";
  return "var(--disposal)";
}

export default function App() {
  const { loading: authLoading, session, isAdmin, signOut, role } = useAuth();
  const [items, setItems] = useState<ItemWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [disposal, setDisposal] = useState("");
  const [dispositionFilter, setDispositionFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    fetchMasterItems()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session) reload();
  }, [session, reload]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return [...set].sort();
  }, [items]);

  const disposals = useMemo(() => {
    const set = new Set(items.map((i) => i.disposal_method).filter(Boolean) as string[]);
    return [...set].sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => {
        if (category && i.category !== category) return false;
        if (disposal && i.disposal_method !== disposal) return false;
        if (dispositionFilter && i.disposition_status !== dispositionFilter) return false;
        if (!q) return true;
        const hay = [
          i.external_id,
          i.category,
          i.disposal_method,
          dispositionLabel(i.disposition_status),
          i.brief_description,
          i.comments,
          i.photo_refs_raw,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => sortKey(a.external_id) - sortKey(b.external_id));
  }, [items, search, category, disposal, dispositionFilter]);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  async function handleAddItem(input: ItemInput, files?: File[]) {
    const created = await createItem(input);
    const refMatch = input.photo_refs_raw?.match(/IMG[_\s]?(\d+)/i);
    const primaryImg = refMatch ? parseInt(refMatch[1], 10) : undefined;
    if (files?.length) {
      setUploading(true);
      try {
        for (let i = 0; i < files.length; i++) {
          await uploadPhotoForItem(created.id, files[i], i === 0, i === 0 ? primaryImg : undefined);
        }
      } finally {
        setUploading(false);
      }
    }
    setAddModalOpen(false);
    setSelectedId(created.id);
    setEditing(false);
    reload();
  }

  async function handleEditItem(input: ItemInput) {
    if (!selected) return;
    await updateItem(selected.id, input);
    setEditing(false);
    reload();
  }

  async function handleDispositionChange(status: DispositionStatus) {
    if (!selected || !isAdmin) return;
    await updateItem(selected.id, { disposition_status: status });
    reload();
  }

  async function handleDeleteItem() {
    if (!selected || !confirm(`Delete item ${selected.external_id ?? ""}? This cannot be undone.`)) return;
    await deleteItem(selected.id);
    setSelectedId(null);
    setEditing(false);
    reload();
  }

  function closeViewModal() {
    setSelectedId(null);
    setEditing(false);
  }

  async function handleUpload(files: File[]) {
    if (!selected || !files.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await uploadPhotoForItem(selected.id, files[i], i === 0);
      }
      reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload failed");
      throw e;
    } finally {
      setUploading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="app app--center">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!session) return <Login />;

  if (loading && items.length === 0) {
    return (
      <div className="app app--center">
        <p className="muted">Loading inventory…</p>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="app app--center">
        <p className="error">Could not load: {error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Cragleigh Inventory</h1>
          <p className="subtitle">
            Master list
            {role === "admin" ? " · Admin" : " · View only"}
          </p>
        </div>
        <div className="header-actions">
          {isAdmin && (
            <button type="button" className="btn-primary-inline" onClick={() => { setAddModalOpen(true); setEditing(false); }}>
              + Add item
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <section className="toolbar">
        <input
          type="search"
          placeholder="Search description, category, disposal, IMG…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={disposal} onChange={(e) => setDisposal(e.target.value)}>
          <option value="">All disposal</option>
          {disposals.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={dispositionFilter} onChange={(e) => setDispositionFilter(e.target.value)}>
          <option value="">All statuses</option>
          {DISPOSITION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(search || category || disposal || dispositionFilter) && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setSearch("");
              setCategory("");
              setDisposal("");
              setDispositionFilter("");
            }}
          >
            Clear filters
          </button>
        )}
      </section>

      <main className="list list--full">
          {filtered.length === 0 ? (
            <p className="muted empty">No items match your filters.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th></th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Disposal</th>
                  <th>Status</th>
                  <th>Photo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const thumb = item.photos.find((p) => p.uploaded && p.storage_path) ?? item.photos[0];
                  const thumbUrl = thumb ? photoPublicUrl(thumb.storage_path) : null;
                  return (
                    <tr
                      key={item.id}
                      className={selectedId === item.id ? "row--active" : ""}
                      onClick={() => {
                        setSelectedId(item.id);
                        setEditing(false);
                      }}
                    >
                      <td className="num">{item.external_id ?? "—"}</td>
                      <td className="thumb-cell">
                        {thumbUrl ? <img src={thumbUrl} alt="" className="thumb" loading="lazy" /> : <span className="no-thumb">—</span>}
                      </td>
                      <td className="cat">{item.category ?? "—"}</td>
                      <td className="desc">{item.brief_description ?? "—"}</td>
                      <td>
                        <span className="disposal-badge" style={{ backgroundColor: `${disposalColor(item.disposal_method)}18`, color: disposalColor(item.disposal_method) }}>
                          {item.disposal_method ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="disposal-badge"
                          style={{
                            backgroundColor: `${dispositionColor(item.disposition_status)}18`,
                            color: dispositionColor(item.disposition_status),
                          }}
                        >
                          {dispositionLabel(item.disposition_status)}
                        </span>
                      </td>
                      <td className="photo-ref"><code>{item.photo_refs_raw ?? "—"}</code></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </main>

      <ItemViewModal
        item={selected}
        open={!!selected}
        isAdmin={isAdmin}
        categories={categories}
        disposals={disposals}
        editing={editing}
        onClose={closeViewModal}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onSaveEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onAddImage={() => setUploadModalOpen(true)}
        onDispositionChange={handleDispositionChange}
        onDownloadPhoto={(p) => downloadPhoto(p).catch((e) => alert(e.message))}
        onRemovePhoto={(p) => deletePhoto(p).then(reload).catch((e) => alert(e.message))}
      />

      <ItemModal
        open={addModalOpen}
        mode="add"
        title="Add item"
        categories={categories}
        disposals={disposals}
        onClose={() => setAddModalOpen(false)}
        onSave={handleAddItem}
      />

      {selected && (
        <ImageUploadModal
          open={uploadModalOpen}
          itemLabel={selected.external_id ?? "—"}
          uploading={uploading}
          onClose={() => setUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
}
