export default function FileList({ files }) {
  if (!files || files.length === 0) {
    return <div className="text-gray-500 mt-6">No files</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-4 mt-6">
      {files.map((file) => (
        <div
          key={file.id}
          className="border p-3 rounded bg-white flex justify-between items-center"
        >
          <div>
            <div className="font-medium truncate">{file.name}</div>
            <div className="text-xs text-gray-500">Uploaded file</div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => file.onPreview(file)}
              className="text-sm text-blue-600 hover:underline"
            >
              Preview
            </button>

            <button
              onClick={() => file.onDownload(file)}
              className="text-sm text-green-600 hover:underline"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
