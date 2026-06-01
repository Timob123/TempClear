import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  disabled?: boolean;
  onChange: (files: File[]) => void;
};

export default function FormImagePicker({ disabled, onChange }: Props) {
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

  useEffect(() => () => {
    stopCamera();
    previews.forEach((u) => URL.revokeObjectURL(u));
  }, [stopCamera, previews]);

  async function startCamera() {
    setCameraError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      setCameraError(e instanceof Error ? e.message : "Camera unavailable");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      addFiles([new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })]);
    }, "image/jpeg", 0.92);
  }

  function removeAt(i: number) {
    URL.revokeObjectURL(previews[i]);
    const next = queue.filter((_, idx) => idx !== i);
    setPreviews((p) => p.filter((_, idx) => idx !== i));
    syncQueue(next);
  }

  return (
    <div className="form-image-picker">
      <p className="form-image-label">Image (optional)</p>
      <div className="form-image-actions">
        <button type="button" className="btn-ghost btn-sm" disabled={disabled} onClick={() => fileRef.current?.click()}>
          Choose file
        </button>
        <button type="button" className="btn-ghost btn-sm" disabled={disabled} onClick={startCamera}>
          Take photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {cameraOn && (
        <div className="form-camera">
          <video ref={videoRef} playsInline muted />
          <button type="button" className="btn-capture btn-sm" onClick={capturePhoto}>
            Capture
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={stopCamera}>
            Done
          </button>
        </div>
      )}
      {cameraError && <p className="form-error">{cameraError}</p>}
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
