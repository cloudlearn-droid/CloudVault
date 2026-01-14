export default function FileList({ files }) {
  if (!files.length) {
    return <div className="text-gray-500 mt-6">No files</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {files.map((file) => (
        <div
          key={file.id}
          className="border p-3 rounded bg-white"
        >
          <div className="font-medium">{file.name}</div>
          <div className="text-xs text-gray-500">
            Uploaded file
          </div>
        </div>
      ))}
    </div>
  );
}
