import { useEffect, useState } from "react";

export default function MoveModal({
  open,
  title,
  folders,
  currentId,
  onClose,
  onConfirm,
}) {
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (open) setSelectedId(null);
  }, [open]);

  if (!open) return null;

  const renderTree = (parentId = null, level = 0) =>
    folders
      .filter((f) => f.parent_id === parentId)
      .map((f) => (
        <div key={f.id} style={{ paddingLeft: level * 16 }}>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              disabled={f.id === currentId}
              checked={selectedId === f.id}
              onChange={() => setSelectedId(f.id)}
            />
            📁 {f.name}
          </label>

          {renderTree(f.id, level + 1)}
        </div>
      ));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-96 p-4">
        <h3 className="font-semibold mb-3">{title}</h3>

        <div className="border rounded p-2 max-h-64 overflow-auto text-sm">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="radio"
              checked={selectedId === null}
              onChange={() => setSelectedId(null)}
            />
            📂 Root
          </label>

          {renderTree(null)}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded text-sm"
          >
            Cancel
          </button>

          <button
            onClick={() => onConfirm(selectedId)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Move
          </button>
        </div>
      </div>
    </div>
  );
}
