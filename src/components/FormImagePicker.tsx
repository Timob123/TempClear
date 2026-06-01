import { useCallback, useEffect, useState } from "react";

type Props = {
  disabled?: boolean;
  onChange: (files: File[]) => void;
};

export default function FormImagePicker({ disabled, onChange }: Props) {
  const [queue, setQueue] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const syncQueue = useCallback(
    (files: File[]) => {
      setQueue(files);
      onChange(files);
    },
    [onChange]
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      const next = [...queue, ...list];
      setPreviews((p) => {
        const added = list.map((f) => URL.createObjectURL(f));
        return [...p, ...added];
      });
      syncQueue(next);
    },
    [queue, syncQueue]
  );

  useEffect(
    () => () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    },
    [previews]
  );

  function removeAt(i: number) {
    URL.revokeObjectURL(previews[i]);
    const next = queue.filter((_, idx) => idx !== i);
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    syncQueue(next);
  }

  return (
    <div className="form-image-picker">
      <label className="form-image-file-label">
        <span className="form-image-label">Image (optional)</span>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={disabled}
          className="form-file-input"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {previews.length > 0 && (
        <div className="upload-thumbs">
          {previews.map((src, i) => (
            <div key={src} className="upload-thumb">
              <img src={src} alt="" />
              <button type="button" className="thumb-remove" onClick={() => removeAt(i)} aria-label="Remove">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
