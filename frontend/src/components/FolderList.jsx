export default function FolderList({
  folders,
  onOpenFolder,
  onDeleteFolder,
  onRestoreFolder,
  onPermanentDeleteFolder,
  isTrash = false,
}) {
  if (!folders.length) {
    return <div className="text-gray-500 mt-4">No folders</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => !isTrash && onOpenFolder(folder)}
          className="border p-4 rounded hover:bg-gray-50 flex justify-between items-center"
        >
          <span className="cursor-pointer">📁 {folder.name}</span>

          <div className="flex gap-3 text-sm">
            {!isTrash && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolder(folder);
                }}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            )}

            {isTrash && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestoreFolder(folder);
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Restore
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermanentDeleteFolder(folder);
                  }}
                  className="text-red-700 hover:underline"
                >
                  Delete Forever
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
