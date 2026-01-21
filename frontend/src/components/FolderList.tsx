import { useState, useRef, useEffect } from "react";

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
  const [menuId, setMenuId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {folders.map((f) => (
        <div
          key={f.id}
          className={`relative border p-4 rounded bg-white transition
            hover:shadow-md hover:-translate-y-[1px]
            ${menuId === f.id ? "z-20" : ""}
          `}
        >
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
              className="border px-2 py-1 w-full rounded"
            />
          ) : (
            <div
              className={!isTrash ? "cursor-pointer select-none" : ""}
              onClick={() => !isTrash && onOpenFolder(f)}
            >
              📁 {f.name}
            </div>
          )}

          <button
            className="absolute top-2 right-2"
            onClick={(e) => {
              e.stopPropagation();
              setMenuId(menuId === f.id ? null : f.id);
            }}
          >
            ⋮
          </button>

          {menuId === f.id && (
            <div
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-2 top-8 bg-white border shadow-lg w-44 z-50 rounded flex flex-col"
            >
              {!isTrash && (
                <>
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
                  <button
                    className="menu-btn"
                    onClick={() => onRestoreFolder(f)}
                  >
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
