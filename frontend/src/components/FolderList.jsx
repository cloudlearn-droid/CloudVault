export default function FolderList({ folders, onOpenFolder }) {
  if (!folders.length) {
    return <div className="text-gray-500 mt-4">No folders</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => onOpenFolder(folder)}
          className="border p-4 rounded cursor-pointer hover:bg-gray-50"
        >
          📁 {folder.name}
        </div>
      ))}
    </div>
  );
}
