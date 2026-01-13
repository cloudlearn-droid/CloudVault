export default function FolderList({ folders = [], onOpenFolder }) {
  if (!Array.isArray(folders) || folders.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No folders found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => onOpenFolder(folder)}
          className="cursor-pointer bg-white border rounded p-4 hover:bg-gray-50"
        >
          📁 {folder.name}
        </div>
      ))}
    </div>
  );
}
