import { useState } from "react";

export default function FileUpload({ folderId, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://127.0.0.1:8000/files/upload${
          folderId ? `?folder_id=${folderId}` : ""
        }`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Upload failed");
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
      <input
        type="file"
        disabled={uploading}
        onChange={handleChange}
      />
      {uploading && (
        <div className="text-sm text-gray-500 mt-2">
          Uploading…
        </div>
      )}
    </div>
  );
}
