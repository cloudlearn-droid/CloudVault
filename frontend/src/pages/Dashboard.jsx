import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetFolders,
  apiCreateFolder,
  apiDeleteFolder,
  apiRestoreFolder,
  apiPermanentDeleteFolder,
  apiGetFiles,
  apiGetTrashFiles,
  apiGetTrashFolders,
  apiRestoreFile,
  apiPermanentDeleteFile,
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
  const [view, setView] = useState("drive");

  // -------------------------
  // Loaders
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

  const loadTrash = async () => {
    setView("trash");
    setCurrentFolder(null);
    setBreadcrumb([]);
    setLoadingFolders(true);
    setLoadingFiles(true);

    try {
      const [trashFolders, trashFiles] = await Promise.all([
        apiGetTrashFolders(),
        apiGetTrashFiles(),
      ]);
      setFolders(trashFolders);
      setFiles(trashFiles);
    } finally {
      setLoadingFolders(false);
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

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    await apiDeleteFolder(folder.id);
    loadFolders(currentFolder?.id || null);
    loadFiles(currentFolder?.id || null);
  };

  const handleRestoreFolder = async (folder) => {
    await apiRestoreFolder(folder.id);
    loadTrash();
  };

  const handlePermanentDeleteFolder = async (folder) => {
    if (
      !window.confirm(
        `Permanently delete folder "${folder.name}" and all its contents?`
      )
    )
      return;

    await apiPermanentDeleteFolder(folder.id);
    loadTrash();
  };

  // -------------------------
  // File actions
  // -------------------------
  const handlePreview = async (file) => {
    const blob = await apiDownloadFileBlob(file.id);
    window.open(URL.createObjectURL(blob), "_blank");
  };

  const handleDownload = async (file) => {
    const blob = await apiDownloadFileBlob(file.id);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    await apiDeleteFile(file.id);
    loadFiles(currentFolder?.id || null);
  };

  const handleRestore = async (file) => {
    await apiRestoreFile(file.id);
    loadTrash();
  };

  const handlePermanentDelete = async (file) => {
    if (
      !window.confirm(
        `Permanently delete "${file.name}"? This cannot be undone.`
      )
    )
      return;

    await apiPermanentDeleteFile(file.id);
    loadTrash();
  };

  const filesWithActions = files.map((f) => ({
    ...f,
    onPreview: handlePreview,
    onDownload: handleDownload,
    onDelete: handleDelete,
    onRestore: handleRestore,
    onPermanentDelete: handlePermanentDelete,
  }));

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-6">CloudVault</h2>

        <nav className="space-y-2 text-sm">
          <div className="cursor-pointer" onClick={() => {
            setView("drive");
            loadFolders(null);
            loadFiles(null);
          }}>
            My Drive
          </div>

          <div className="cursor-pointer text-red-600" onClick={loadTrash}>
            Trash
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
        {view === "drive" && (
          <>
            <CreateFolder onCreate={handleCreateFolder} />
            <FileUpload
              folderId={currentFolder?.id || null}
              onUploaded={() => loadFiles(currentFolder?.id || null)}
            />

            {!loadingFolders && (
              <FolderList
                folders={folders}
                onOpenFolder={handleOpenFolder}
                onDeleteFolder={handleDeleteFolder}
              />
            )}
          </>
        )}

        {view === "trash" && (
          <>
            {!loadingFolders && (
              <FolderList
                folders={folders}
                isTrash={true}
                onRestoreFolder={handleRestoreFolder}
                onPermanentDeleteFolder={handlePermanentDeleteFolder}
              />
            )}
          </>
        )}

        {!loadingFiles && (
          <FileList files={filesWithActions} isTrash={view === "trash"} />
        )}
      </main>
    </div>
  );
}
