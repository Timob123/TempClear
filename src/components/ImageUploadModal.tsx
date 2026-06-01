import { useCallback, useEffect, useRef, useState } from "react";
import "./ImageUploadModal.css";

type Props = {
  itemLabel: string;
  open: boolean;
  uploading: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
};

type Mode = "choose" | "camera";

export default function ImageUploadModal({
  itemLabel,
  open,
  uploading,
  onClose,
  onUpload,
}: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [queue, setQueue] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const reset = useCallback(() => {
    stopCamera();
    setQueue([]);
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setMode("choose");
    setCameraError(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [stopCamera]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setQueue((q) => [...q, ...list]);
    setPreviews((p) => [...p, ...list.map((f) => URL.createObjectURL(f))]);
  }, []);

  async function startCamera() {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      setMode("camera");
    } catch (e) {
      setCameraError(
        e instanceof Error ? e.message : "Could not access camera. Allow permission or use Choose file."
      );
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const name = `capture-${Date.now()}.jpg`;
        const file = new File([blob], name, { type: "image/jpeg" });
        addFiles([file]);
      },
      "image/jpeg",
      0.92
    );
  }

  function removeAt(index: number) {
    setQueue((q) => q.filter((_, i) => i !== index));
    setPreviews((p) => {
      URL.revokeObjectURL(p[index]);
      return p.filter((_, i) => i !== index);
    });
  }

  async function handleUpload() {
    if (!queue.length) return;
    await onUpload(queue);
    reset();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
      <div className="modal-card upload-modal">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="upload-modal-title">Add image</h2>
        <p className="modal-sub">Item {itemLabel}</p>

        <div className="upload-tabs">
          <button type="button" className={mode === "choose" ? "active" : ""} onClick={() => { setMode("choose"); stopCamera(); }}>
            Choose file
          </button>
          <button type="button" className={mode === "camera" ? "active" : ""} onClick={startCamera}>
            Take photo
          </button>
        </div>

        {mode === "choose" && (
          <div className="upload-panel">
            <button type="button" className="btn-choose-file" onClick={() => fileRef.current?.click()}>
              Select from device
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="upload-hint">JPEG, PNG, or HEIC. Name with IMG_2394 to auto-link the number.</p>
          </div>
        )}

        {mode === "camera" && (
          <div className="upload-panel">
            {cameraError ? (
              <p className="form-error">{cameraError}</p>
            ) : (
              <>
                <div className="camera-wrap">
                  <video ref={videoRef} className="camera-video" playsInline muted />
                  {!cameraOn && <p className="muted">Starting camera…</p>}
                </div>
                <button type="button" className="btn-capture" onClick={capturePhoto} disabled={!cameraOn}>
                  Capture photo
                </button>
                <p className="upload-hint">Each capture is added below. Capture again for more angles.</p>
              </>
            )}
          </div>
        )}

        {previews.length > 0 && (
          <div className="upload-preview">
            <p className="upload-preview-label">{queue.length} image(s) ready</p>
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
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-inline"
            onClick={handleUpload}
            disabled={uploading || queue.length === 0}
          >
            {uploading ? "Uploading…" : queue.length ? `Upload ${queue.length}` : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
