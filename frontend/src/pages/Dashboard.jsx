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
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Load folders
  // -------------------------
  const loadFolders = async (parentId = null) => {
    setLoading(true);
    try {
      const data = await apiGetFolders(parentId);
      setFolders(data);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // Load files
  // -------------------------
  const loadFiles = async (folderId = null) => {
    const data = await apiGetFiles(folderId);
    setFiles(data);
  };

  // Initial load
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
    loadFolders(folder.id);
    loadFiles(folder.id);
  };

  // -------------------------
  // Go root
  // -------------------------
  const handleGoRoot = () => {
    setCurrentFolder(null);
    loadFolders(null);
    loadFiles(null);
  };

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
          <div className="text-gray-500">Shared</div>
          <div className="text-gray-500">Trash</div>
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
        {/* Breadcrumb (UNCHANGED) */}
        <div className="text-sm text-gray-500 mb-4">
          {currentFolder ? (
            <>
              <span
                className="cursor-pointer text-blue-600"
                onClick={handleGoRoot}
              >
                My Drive
              </span>
              {" / "}
              <span className="font-medium">{currentFolder.name}</span>
            </>
          ) : (
            <span className="font-medium">My Drive</span>
          )}
        </div>

        <CreateFolder onCreate={handleCreateFolder} />

        <FileUpload
          folderId={currentFolder?.id || null}
          onUploaded={() => loadFiles(currentFolder?.id || null)}
        />

        {loading ? (
          <div className="text-gray-500 mt-4">Loading folders…</div>
        ) : (
          <FolderList
            folders={folders}
            onOpenFolder={handleOpenFolder}
          />
        )}

        {/* ✅ FILE LIST — FIXED */}
        <FileList
          folderId={currentFolder?.id || null}
          files={files}
        />
      </main>
    </div>
  );
}
