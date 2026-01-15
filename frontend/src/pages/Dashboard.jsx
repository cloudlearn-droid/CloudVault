import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetFolders,
  apiCreateFolder,
  apiGetFiles,
  apiDownloadFile,
  apiDownloadFileBlob,
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
  // Load folders
  // -------------------------
  const loadFolders = async (parentId = null) => {
    setLoadingFolders(true);
    try {
      const data = await apiGetFolders(parentId);
      setFolders(data);
    } finally {
      setLoadingFolders(false);
    }
  };

  // -------------------------
  // Load files
  // -------------------------
  const loadFiles = async (folderId = null) => {
    setLoadingFiles(true);
    try {
      const data = await apiGetFiles(folderId);
      setFiles(data);
    } finally {
      setLoadingFiles(false);
    }
  };

  // Initial load (My Drive)
  useEffect(() => {
    loadFolders(null);
    loadFiles(null);
  }, []);

  // -------------------------
  // Create folder
  // -------------------------
  const handleCreateFolder = async (name) => {
    await apiCreateFolder(name, currentFolder?.id || null);
    loadFolders(currentFolder?.id || null);
  };

  // -------------------------
  // Open folder
  // -------------------------
  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);

    setBreadcrumb((prev) => {
      const index = prev.findIndex((f) => f.id === folder.id);
      if (index !== -1) return prev.slice(0, index + 1);
      return [...prev, folder];
    });

    loadFolders(folder.id);
    loadFiles(folder.id);
  };

  // -------------------------
  // Breadcrumb navigation
  // -------------------------
  const handleBreadcrumbClick = (index) => {
    const path = breadcrumb.slice(0, index + 1);
    const target = path[path.length - 1];

    setBreadcrumb(path);
    setCurrentFolder(target);
    loadFolders(target.id);
    loadFiles(target.id);
  };

  // -------------------------
  // Go root
  // -------------------------
  const handleGoRoot = () => {
    setCurrentFolder(null);
    setBreadcrumb([]);
    loadFolders(null);
    loadFiles(null);
  };

  // -------------------------
  // PREVIEW (OLD, WORKING LOGIC) ✅
  // -------------------------
  const handlePreview = async (file) => {
    const res = await apiDownloadFile(file.id);
    window.open(res.download_url, "_blank", "noopener,noreferrer");
  };

  // -------------------------
  // DOWNLOAD (FORCE DOWNLOAD) ✅
  // -------------------------
  const handleDownload = async (file) => {
    const blob = await apiDownloadFileBlob(file.id);
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Inject handlers into files
  const filesWithActions = files.map((f) => ({
    ...f,
    onDownload: handleDownload,
    onPreview: handlePreview,
  }));

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-6">CloudVault</h2>

        <nav className="space-y-2 text-sm">
          <div
            className="font-medium cursor-pointer"
            onClick={handleGoRoot}
          >
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

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <span
            className="cursor-pointer text-blue-600"
            onClick={handleGoRoot}
          >
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
          <FolderList
            folders={folders}
            onOpenFolder={handleOpenFolder}
          />
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
