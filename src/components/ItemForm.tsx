import { FormEvent, useEffect, useState } from "react";
import FormImagePicker from "./FormImagePicker";
import { DISPOSITION_OPTIONS } from "../lib/disposition";
import type { DispositionStatus, Item } from "../types";
import type { ItemInput } from "../lib/api";

export type GeneratedIds = {
  itemNumber: string;
  imgNumber: number;
  photoRef: string;
};

type Props = {
  mode: "add" | "edit";
  initial?: Item | null;
  categories?: string[];
  disposals?: string[];
  generatedIds?: GeneratedIds;
  onSave: (input: ItemInput, files?: File[]) => Promise<void>;
  onCancel: () => void;
};

const NEW_OPTION = "__new__";

export default function ItemForm({
  mode,
  initial,
  categories = [],
  disposals = [],
  generatedIds,
  onSave,
  onCancel,
}: Props) {
  const categoryList = categories ?? [];
  const disposalList = disposals ?? [];
  const isAdd = mode === "add";

  const [externalId, setExternalId] = useState(initial?.external_id ?? generatedIds?.itemNumber ?? "");
  const [categoryKey, setCategoryKey] = useState(initial?.category ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [disposalKey, setDisposalKey] = useState(initial?.disposal_method ?? "");
  const [newDisposal, setNewDisposal] = useState("");
  const [dispositionStatus, setDispositionStatus] = useState<DispositionStatus>(
    initial?.disposition_status ?? "at_cragleigh"
  );
  const [description, setDescription] = useState(initial?.brief_description ?? "");
  const [photoRefs, setPhotoRefs] = useState(initial?.photo_refs_raw ?? generatedIds?.photoRef ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdd && generatedIds) {
      setExternalId(generatedIds.itemNumber);
      setPhotoRefs(generatedIds.photoRef);
    }
  }, [isAdd, generatedIds]);

  function resolveCategory(): string {
    if (categoryKey === NEW_OPTION) return newCategory.trim();
    return categoryKey.trim();
  }

  function resolveDisposal(): string {
    if (disposalKey === NEW_OPTION) return newDisposal.trim();
    return disposalKey.trim();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cat = resolveCategory();
    if (!cat) {
      setError("Please select a category");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const hasPhoto = photoRefs.trim() || pendingFiles.length > 0;
      await onSave(
        {
          external_id: externalId.trim() || null,
          category: cat || null,
          disposal_method: resolveDisposal() || null,
          disposition_status: dispositionStatus,
          brief_description: description.trim() || null,
          photo_refs_raw: photoRefs.trim() || null,
          catalog_status: hasPhoto ? "catalogued" : "missing_photo",
        },
        isAdd ? pendingFiles : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setBusy(false);
    }
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Item #
          <input
            value={externalId}
            onChange={(e) => setExternalId(e.target.value)}
            readOnly={isAdd}
            className={isAdd ? "readonly-field" : ""}
          />
        </label>
        <label>
          Photo ref
          <input
            value={photoRefs}
            onChange={(e) => setPhotoRefs(e.target.value)}
            readOnly={isAdd}
            className={isAdd ? "readonly-field" : ""}
          />
        </label>
        <label className="span-2">
          Category
          <select
            value={categoryKey}
            onChange={(e) => setCategoryKey(e.target.value)}
            required
          >
            <option value="">Select category…</option>
            {categoryList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_OPTION}>+ Add new category…</option>
          </select>
        </label>
        {categoryKey === NEW_OPTION && (
          <label className="span-2">
            New category name
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Glassware" />
          </label>
        )}
        <label className="span-2">
          Disposal
          <select value={disposalKey} onChange={(e) => setDisposalKey(e.target.value)}>
            <option value="">Select disposal…</option>
            {disposalList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
            <option value={NEW_OPTION}>+ Add new…</option>
          </select>
        </label>
        {disposalKey === NEW_OPTION && (
          <label className="span-2">
            New disposal
            <input value={newDisposal} onChange={(e) => setNewDisposal(e.target.value)} placeholder="Mullens" />
          </label>
        )}
        <label className="span-2">
          Status (taken / removed / etc.)
          <select
            value={dispositionStatus}
            onChange={(e) => setDispositionStatus(e.target.value as DispositionStatus)}
          >
            {(DISPOSITION_OPTIONS ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
        </label>
      </div>

      {isAdd && (
        <FormImagePicker disabled={busy} onChange={setPendingFiles} />
      )}

      {error && <p className="form-error">{error}</p>}
      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary-inline" disabled={busy}>
          {busy ? "Saving…" : isAdd ? "Add item" : "Save"}
        </button>
      </div>
    </form>
  );
}
