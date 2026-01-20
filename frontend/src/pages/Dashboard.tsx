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
  apiPermanentDeleteFile,
  apiDeleteFolder,
  apiRestoreFolder,
  apiPermanentDeleteFolder,
  apiMoveFile,
  apiRenameFolder,
  apiMoveFolder,
  apiRenameFile,
  fetchWithAuth,
} from "../services/api";

import FolderList from "../components/FolderList";
import FileList from "../components/FileList";
import CreateFolder from "../components/CreateFolder";
import FileUpload from "../components/FileUpload";
import MoveModal from "../components/MoveModal";

export default function Dashboard() {
  const { logout } = useAuth();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [view, setView] = useState("drive");

  // ✅ Move modal state
  const [moveModal, setMoveModal] = useState({
    open: false,
    type: null, // "folder" | "file"
    item: null,
  });

  // -------------------------
  // Load helpers (UNCHANGED)
  // -------------------------
  const loadFolders = async (parentId = null) => {
    setFolders(await apiGetFolders(parentId));
  };

  const loadFiles = async (folderId = null) => {
    setFiles(await apiGetFiles(folderId));
  };

  const loadTrash = async () => {
    setFolders(await fetchWithAuth("/folders/trash"));
    setFiles(await apiGetTrashFiles());
  };

  useEffect(() => {
    loadFolders(null);
    loadFiles(null);
  }, []);

  // -------------------------
  // Folder navigation (UNCHANGED)
  // -------------------------
  const handleOpenFolder = (folder) => {
    setCurrentFolder(folder);
    setBreadcrumb((prev) => [...prev, folder]);
    loadFolders(folder.id);
    loadFiles(folder.id);
  };

  const handleBreadcrumbClick = (index) => {
    const path = breadcrumb.slice(0, index + 1);
    const target = path[path.length - 1] || null;

    setBreadcrumb(path);
    setCurrentFolder(target);
    loadFolders(target?.id || null);
    loadFiles(target?.id || null);
  };

  const handleGoRoot = () => {
    setBreadcrumb([]);
    setCurrentFolder(null);
    loadFolders(null);
    loadFiles(null);
  };

  // -------------------------
  // Folder actions
  // -------------------------
  const handleCreateFolder = async (name) => {
    await apiCreateFolder(name, currentFolder?.id || null);
    loadFolders(currentFolder?.id || null);
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Delete folder "${folder.name}"?`)) return;
    await apiDeleteFolder(folder.id);
    loadFolders(currentFolder?.id || null);
  };

  const handleRestoreFolder = async (folder) => {
    await apiRestoreFolder(folder.id);
    loadTrash();
  };

  const handlePermanentDeleteFolder = async (folder) => {
    if (!window.confirm(`Permanently delete "${folder.name}"?`)) return;
    await apiPermanentDeleteFolder(folder.id);
    loadTrash();
  };

  const handleRenameFolder = async (folder, newName) => {
    if (!newName || newName === folder.name) return;
    await apiRenameFolder(folder.id, newName);
    loadFolders(currentFolder?.id || null);
  };

  const handleMoveFolder = (folder) => {
    setMoveModal({ open: true, type: "folder", item: folder });
  };

  // -------------------------
  // File actions
  // -------------------------
  const filesWithActions = files.map((f) => ({
    ...f,

    onPreview: async () => {
      const blob = await apiDownloadFileBlob(f.id);
      window.open(URL.createObjectURL(blob));
    },

    onDownload: async () => {
      const blob = await apiDownloadFileBlob(f.id);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      a.click();
    },

    onDelete: async () => {
      if (!window.confirm(`Delete "${f.name}"?`)) return;
      await apiDeleteFile(f.id);
      loadFiles(currentFolder?.id || null);
    },

    onRestore: async () => {
      await apiRestoreFile(f.id);
      loadTrash();
    },

    onPermanentDelete: async () => {
      if (!window.confirm(`Permanently delete "${f.name}"?`)) return;
      await apiPermanentDeleteFile(f.id);
      loadTrash();
    },

    onRename: async (newName) => {
      if (!newName || newName === f.name) return;
      await apiRenameFile(f.id, newName);
      loadFiles(currentFolder?.id || null);
    },

    onMove: () => {
      setMoveModal({ open: true, type: "file", item: f });
    },
  }));

  // -------------------------
  // Move confirm handler
  // -------------------------
  const handleConfirmMove = async (targetFolderId) => {
    const { type, item } = moveModal;

    if (type === "folder") {
      await apiMoveFolder(item.id, targetFolderId);
      loadFolders(currentFolder?.id || null);
    }

    if (type === "file") {
      await apiMoveFile(item.id, targetFolderId);
      loadFiles(currentFolder?.id || null);
    }

    setMoveModal({ open: false, type: null, item: null });
  };

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
<<<<<<< HEAD
=======
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

>>>>>>> 8832681 (backup: stable Folder File move, rename, preview, Delete (Soft) and Permanent Delete)
            <CreateFolder onCreate={handleCreateFolder} />
            <FileUpload
              folderId={currentFolder?.id || null}
              onUploaded={() => loadFiles(currentFolder?.id || null)}
            />

            <FolderList
              folders={folders}
              onOpenFolder={handleOpenFolder}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
              onMoveFolder={handleMoveFolder}
            />
          </>
        )}

        {view === "trash" && (
          <FolderList
            folders={folders}
            isTrash
            onRestoreFolder={handleRestoreFolder}
            onPermanentDeleteFolder={handlePermanentDeleteFolder}
          />
        )}

        <FileList files={filesWithActions} isTrash={view === "trash"} />
      </main>

      {/* ✅ MOVE MODAL */}
      <MoveModal
        open={moveModal.open}
        title={`Move ${moveModal.type}`}
        folders={folders}
        currentId={moveModal.item?.id}
        onClose={() => setMoveModal({ open: false, type: null, item: null })}
        onConfirm={handleConfirmMove}
      />
    </div>
  );
}
