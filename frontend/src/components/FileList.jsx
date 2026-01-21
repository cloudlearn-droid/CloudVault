import { useState, useRef, useEffect } from "react";

export default function FileList({ files, isTrash }) {
  const [menuId, setMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const menuRef = useRef(null);

  // ✅ Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {files.map((f) => (
        <div
          key={f.id}
          className={`relative border p-3 rounded bg-white transition
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
                f.onRename(name);
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  f.onRename(name);
                  setEditingId(null);
                }
              }}
              className="border px-2 py-1 w-full rounded"
            />
          ) : (
            <div className="truncate select-none">{f.name}</div>
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
                  <button className="menu-btn" onClick={f.onPreview}>
                    Preview
                  </button>
                  <button className="menu-btn" onClick={f.onDownload}>
                    Download
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
                  <button className="menu-btn" onClick={f.onMove}>
                    Move
                  </button>
                  <button
                    className="menu-btn text-red-600"
                    onClick={f.onDelete}
                  >
                    Delete
                  </button>
                </>
              )}

              {isTrash && (
                <>
                  <button className="menu-btn" onClick={f.onRestore}>
                    Restore
                  </button>
                  <button
                    className="menu-btn text-red-600"
                    onClick={f.onPermanentDelete}
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
