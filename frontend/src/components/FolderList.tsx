import { useState } from "react";

export default function FolderList({
  folders,
  onOpenFolder,
  onDeleteFolder,
  onRestoreFolder,
  onPermanentDeleteFolder,
  onRenameFolder,
  onMoveFolder,
  isTrash = false,
}) {
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {folders.map((f) => (
        <div key={f.id} className="relative border p-4 rounded bg-white">
          {editingId === f.id ? (
            <input
              value={name}
              autoFocus
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                onRenameFolder(f, name);
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onRenameFolder(f, name);
                  setEditingId(null);
                }
              }}
              className="border px-2 py-1 w-full"
            />
          ) : (
            <div
              className={!isTrash ? "cursor-pointer" : ""}
              onClick={() => !isTrash && onOpenFolder(f)}
            >
              📁 {f.name}
            </div>
          )}

          <button
            className="absolute top-2 right-2"
            onClick={() => setMenuId(menuId === f.id ? null : f.id)}
          >
            ⋮
          </button>

          {menuId === f.id && (
            <div className="absolute right-2 top-8 bg-white border shadow w-44 z-20">
              {!isTrash && (
                <>
                  <button
                    className="menu-btn"
                    onClick={() => {
                      setName(f.name);
                      setEditingId(f.id);
                      setMenuId(null);
                    }}
                  >
                    Rename
                  </button>

                  <button
                    className="menu-btn"
                    onClick={() => {
                      onMoveFolder(f);
                      setMenuId(null);
                    }}
                  >
                    Move
                  </button>

                  <button
                    className="menu-btn text-red-600"
                    onClick={() => {
                      onDeleteFolder(f);
                      setMenuId(null);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}

              {isTrash && (
                <>
                  <button className="menu-btn" onClick={() => onRestoreFolder(f)}>
                    Restore
                  </button>
                  <button
                    className="menu-btn text-red-600"
                    onClick={() => onPermanentDeleteFolder(f)}
                  >
                    Delete permanently
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
