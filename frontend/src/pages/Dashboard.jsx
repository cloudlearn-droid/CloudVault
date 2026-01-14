import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetFolders,
  apiCreateFolder,
  apiGetFiles,
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
  const [loading, setLoading] = useState(false);

  // -------------------------
  // Load folders
  // -------------------------
  const loadFolders = async (parentId = null) => {
    try {
      const data = await apiGetFolders(parentId);
      setFolders(data);
    } catch (e) {
      console.error("Folder load failed:", e.message);
      setFolders([]);
    }
  };

  // -------------------------
  // Load files
  // -------------------------
  const loadFiles = async (folderId = null) => {
    try {
      const data = await apiGetFiles(folderId);
      setFiles(data);
    } catch (e) {
      console.error("File load failed:", e.message);
      setFiles([]);
    }
  };

  // -------------------------
  // Initial load (TOKEN SAFE)
  // -------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
  // Breadcrumb click
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

  return (
    <div className="flex h-screen bg-gray-100">
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
          onUploaded={() =>
            loadFiles(currentFolder?.id || null)
          }
        />

        <FolderList
          folders={folders}
          onOpenFolder={handleOpenFolder}
        />

        <FileList files={files} />
      </main>
    </div>
  );
}
