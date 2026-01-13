import { useState } from "react";

export default function FileUpload({ folderId, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const token = localStorage.getItem("token");

      const formData = new FormData();
      formData.append("file", file);
      if (folderId !== null) {
        formData.append("folder_id", folderId);
      }

      const res = await fetch("http://127.0.0.1:8000/files/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      alert("Upload successful");
      onUploaded?.();
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      onUploaded?.();
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="my-4">
      <input type="file" disabled={uploading} onChange={handleFileChange} />
      {uploading && (
        <div className="text-sm text-gray-500 mt-2">
          Uploading…
        </div>
      )}
    </div>
  );
}
