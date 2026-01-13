import { useEffect, useState } from "react";
import { apiGetFiles } from "../services/api";

export default function FileList({ folderId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  async function loadFiles() {
    setLoading(true);
    try {
      const data = await apiGetFiles(folderId);
      setFiles(data);
    } catch (err) {
      console.error("Failed to load files", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-gray-500 mt-4">Loading files…</div>;
  }

  if (files.length === 0) {
    return (
      <div className="text-gray-500 mt-4">
        No files in this folder.
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="border rounded-lg p-3 bg-white shadow-sm"
        >
          <div className="font-medium truncate">{file.name}</div>
          <div className="text-xs text-gray-500">
            Uploaded file
          </div>
        </div>
      ))}
    </div>
  );
}
