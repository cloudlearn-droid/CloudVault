export default function FileList({ files, isTrash = false }) {
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

          <div className="flex gap-3 mt-2 text-sm">
            {!isTrash && (
              <>
                <button
                  onClick={() => file.onPreview(file)}
                  className="text-blue-600 hover:underline"
                >
                  Preview
                </button>

                <button
                  onClick={() => file.onDownload(file)}
                  className="text-green-600 hover:underline"
                >
                  Download
                </button>

                <button
                  onClick={() => file.onDelete(file)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </>
            )}

            {isTrash && (
              <>
                <button
                  onClick={() => file.onRestore(file)}
                  className="text-blue-600 hover:underline"
                >
                  Restore
                </button>

                <button
                  onClick={() => file.onPermanentDelete(file)}
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
