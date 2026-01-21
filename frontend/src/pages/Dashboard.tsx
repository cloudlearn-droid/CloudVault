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
  apiRestoreFile,
  apiDownloadFileBlob,
  apiDeleteFile,
  apiPermanentDeleteFile,
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
  const [view, setView] = useState<"drive" | "trash">("drive");

  const [moveModal, setMoveModal] = useState({
    open: false,
    type: null as "folder" | "file" | null,
    item: null as any,
  });

  const loadFolders = async (parentId = null) =>
    setFolders(await apiGetFolders(parentId));

  const loadFiles = async (folderId = null) =>
    setFiles(await apiGetFiles(folderId));

  const loadTrash = async () => {
    setFolders(await fetchWithAuth("/folders/trash"));
    setFiles(await apiGetTrashFiles());
  };

  useEffect(() => {
    loadFolders(null);
    loadFiles(null);
  }, []);

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
    onMove: () => setMoveModal({ open: true, type: "file", item: f }),
  }));

  const isEmpty =
    folders.length === 0 && files.length === 0;

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-6">CloudVault</h2>

        <nav className="space-y-2 text-sm">
          <div
            className={`cursor-pointer px-2 py-1 rounded transition ${
              view === "drive" ? "bg-blue-100 text-blue-700" : ""
            }`}
            onClick={() => {
              setView("drive");
              handleGoRoot();
            }}
          >
            My Drive
          </div>

          <div
            className={`cursor-pointer px-2 py-1 rounded transition ${
              view === "trash" ? "bg-red-100 text-red-700" : "text-red-600"
            }`}
            onClick={() => {
              setView("trash");
              loadTrash();
            }}
          >
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
            <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
              <span
                className="cursor-pointer text-blue-600 hover:underline"
                onClick={handleGoRoot}
              >
                My Drive
              </span>
              {breadcrumb.map((folder, index) => (
                <span key={folder.id} className="flex items-center gap-2">
                  <span className="text-gray-400">›</span>
                  <span
                    className="cursor-pointer text-blue-600 hover:underline"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {folder.name}
                  </span>
                </span>
              ))}
            </div>

            <CreateFolder onCreate={async (name) => {
              await apiCreateFolder(name, currentFolder?.id || null);
              loadFolders(currentFolder?.id || null);
            }} />

            <FileUpload
              folderId={currentFolder?.id || null}
              onUploaded={() => loadFiles(currentFolder?.id || null)}
            />

            {isEmpty ? (
              <div className="text-center text-gray-500 mt-20">
                📂 <br />
                This folder is empty<br />
                Upload files or create a folder
              </div>
            ) : (
              <>
                <FolderList
                  folders={folders}
                  onOpenFolder={handleOpenFolder}
                  onDeleteFolder={async (f) => {
                    await apiDeleteFolder(f.id);
                    loadFolders(currentFolder?.id || null);
                  }}
                  onRenameFolder={async (f, n) => {
                    await apiRenameFolder(f.id, n);
                    loadFolders(currentFolder?.id || null);
                  }}
                  onMoveFolder={(f) =>
                    setMoveModal({ open: true, type: "folder", item: f })
                  }
                />

                <FileList files={filesWithActions} isTrash={false} />
              </>
            )}
          </>
        )}

        {view === "trash" && (
          <>
            {isEmpty ? (
              <div className="text-center text-gray-500 mt-20">
                🗑️ <br />
                Trash is empty
              </div>
            ) : (
              <>
                <FolderList
                  folders={folders}
                  isTrash
                  onRestoreFolder={async (f) => {
                    await apiRestoreFolder(f.id);
                    loadTrash();
                  }}
                  onPermanentDeleteFolder={async (f) => {
                    await apiPermanentDeleteFolder(f.id);
                    loadTrash();
                  }}
                />

                <FileList files={filesWithActions} isTrash />
              </>
            )}
          </>
        )}
      </main>

      <MoveModal
        open={moveModal.open}
        title={`Move ${moveModal.type}`}
        folders={folders}
        currentId={moveModal.item?.id}
        onClose={() =>
          setMoveModal({ open: false, type: null, item: null })
        }
        onConfirm={async (targetFolderId) => {
          if (moveModal.type === "folder") {
            await apiMoveFolder(moveModal.item.id, targetFolderId);
            loadFolders(currentFolder?.id || null);
          }
          if (moveModal.type === "file") {
            await apiMoveFile(moveModal.item.id, targetFolderId);
            loadFiles(currentFolder?.id || null);
          }
          setMoveModal({ open: false, type: null, item: null });
        }}
      />
    </div>
  );
}
