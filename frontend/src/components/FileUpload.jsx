import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function FileUpload({ folderId, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    try {
      setUploading(true);
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch(
          `http://127.0.0.1:8000/files/upload${
            folderId ? `?folder_id=${folderId}` : ""
          }`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            body: formData,
          }
        );
      }
      onUploaded?.();
    } finally {
      setUploading(false);
    }
  }, [folderId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  });

  return (
    <div className="my-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all duration-200
        ${
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-105"
            : "border-gray-300 bg-white hover:bg-gray-50"
        }
        ${uploading ? "animate-pulse opacity-70" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600 text-sm">
          {uploading
            ? "Uploading files…"
            : "Drag & drop files here, or click to select"}
        </p>
      </div>
    </div>
  );
}
