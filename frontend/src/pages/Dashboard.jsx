import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetFolders,
  apiCreateFolder,
  apiGetFiles,
  apiDownloadFileBlob,
  apiDeleteFile,
} from "../services/api";

import FolderList from "../components/FolderList";
import FileList from "../components/FileList";
import CreateFolder from "../components/CreateFolder";
import FileUpload from "../components/FileUpload";

export default function Dashboard() {
  const { logout } = useAuth();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // -------------------------
  // Load folders & files
  // -------------------------
  const loadFolders = async (parentId = null) => {
    setLoadingFolders(true);
    try {
      setFolders(await apiGetFolders(parentId));
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadFiles = async (folderId = null) => {
    setLoadingFiles(true);
    try {
      setFiles(await apiGetFiles(folderId));
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadFolders(null);
    loadFiles(null);
  }, []);

  // -------------------------
  // Folder actions
  // -------------------------
  const handleCreateFolder = async (name) => {
    await apiCreateFolder(name, currentFolder?.id || null);
    loadFolders(currentFolder?.id || null);
  };

  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumb((prev) => [...prev, folder]);
    loadFolders(folder.id);
    loadFiles(folder.id);
  };

  const handleBreadcrumbClick = (index) => {
    const path = breadcrumb.slice(0, index + 1);
    const target = path[path.length - 1];

    setBreadcrumb(path);
    setCurrentFolder(target);
    loadFolders(target.id);
    loadFiles(target.id);
  };

  const handleGoRoot = () => {
    setCurrentFolder(null);
    setBreadcrumb([]);
    loadFolders(null);
    loadFiles(null);
  };

  // -------------------------
  // FILE ACTIONS (FINAL, STABLE)
  // -------------------------
  const handlePreview = async (file) => {
    const blob = await apiDownloadFileBlob(file.id);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (file) => {
    const blob = await apiDownloadFileBlob(file.id);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    await apiDeleteFile(file.id);
    loadFiles(currentFolder?.id || null);
  };

  const filesWithActions = files.map((f) => ({
    ...f,
    onPreview: handlePreview,
    onDownload: handleDownload,
    onDelete: handleDelete,
  }));

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-6">CloudVault</h2>

        <nav className="space-y-2 text-sm">
          <div className="font-medium cursor-pointer" onClick={handleGoRoot}>
            My Drive
          </div>
        </nav>

        <button
          onClick={logout}
          className="mt-10 text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <div className="text-sm text-gray-500 mb-4">
          <span className="cursor-pointer text-blue-600" onClick={handleGoRoot}>
            My Drive
          </span>

          {breadcrumb.map((folder, index) => (
            <span key={folder.id}>
              {" / "}
              <span
                className="cursor-pointer text-blue-600"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {folder.name}
              </span>
            </span>
          ))}
        </div>

        <CreateFolder onCreate={handleCreateFolder} />

        <FileUpload
          folderId={currentFolder?.id || null}
          onUploaded={() => loadFiles(currentFolder?.id || null)}
        />

        {loadingFolders ? (
          <div className="text-gray-500 mt-4">Loading folders…</div>
        ) : (
          <FolderList folders={folders} onOpenFolder={handleOpenFolder} />
        )}

        {loadingFiles ? (
          <div className="text-gray-500 mt-6">Loading files…</div>
        ) : (
          <FileList files={filesWithActions} />
        )}
      </main>
    </div>
  );
}
