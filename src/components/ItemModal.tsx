import { useEffect, useState } from "react";
import ItemForm, { type GeneratedIds } from "./ItemForm";
import { fetchCategoryOptions, fetchNextMasterIds } from "../lib/api";
import type { Item } from "../types";
import type { ItemInput } from "../lib/api";
import "./ImageUploadModal.css";

type Props = {
  open: boolean;
  title: string;
  mode: "add" | "edit";
  initial?: Item | null;
  categories: string[];
  disposals: string[];
  onClose: () => void;
  onSave: (input: ItemInput, files?: File[]) => Promise<void>;
};

export default function ItemModal({
  open,
  title,
  mode,
  initial,
  categories = [],
  disposals = [],
  onClose,
  onSave,
}: Props) {
  const [generatedIds, setGeneratedIds] = useState<GeneratedIds | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(categories ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setGeneratedIds(null);
      return;
    }
    setCategoryOptions(categories ?? []);
    setLoading(true);
    fetchCategoryOptions()
      .then((opts) => setCategoryOptions(Array.isArray(opts) ? opts : []))
      .catch(() => setCategoryOptions(categories ?? []));

    if (mode === "add") {
      fetchNextMasterIds()
        .then(setGeneratedIds)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [open, mode, categories]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="item-modal-title">
      <div className="modal-card item-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="item-modal-title">{title}</h2>
        <p className="modal-sub">Master inventory list</p>
        {loading && mode === "add" ? (
          <p className="muted">Generating item number…</p>
        ) : (
          <ItemForm
            key={mode === "add" ? generatedIds?.photoRef : initial?.id}
            mode={mode}
            initial={initial}
            categories={categoryOptions}
            disposals={disposals}
            generatedIds={generatedIds ?? undefined}
            onSave={onSave}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}
