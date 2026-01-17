const API_BASE_URL = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("token");
}

// --------------------
// AUTH
// --------------------
export async function apiLogin(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid email or password");
  }

  return response.json();
}

// --------------------
// AUTHENTICATED FETCH
// --------------------
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();
  if (!token) throw new Error("No auth token found");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API request failed");
  }

  return response.json();
}

// --------------------
// FOLDERS ✅ RESTORED
// --------------------
export function apiGetFolders(parentId = null) {
  const query = parentId === null ? "" : `?parent_id=${parentId}`;
  return fetchWithAuth(`/folders${query}`);
}

export function apiCreateFolder(name, parent_id = null) {
  return fetchWithAuth("/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parent_id }),
  });
}

// --------------------
// FILES
// --------------------
export function apiGetFiles(folder_id = null) {
  const query = folder_id === null ? "" : `?folder_id=${folder_id}`;
  return fetchWithAuth(`/files${query}`);
}

export function apiGetTrashFiles() {
  return fetchWithAuth("/files/trash");
}

export function apiRestoreFile(fileId) {
  return fetchWithAuth(`/files/${fileId}/restore`, {
    method: "POST",
  });
}

export async function apiUploadFile(file, folder_id = null) {
  const formData = new FormData();
  formData.append("file", file);

  const query = folder_id === null ? "" : `?folder_id=${folder_id}`;

  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/files/upload${query}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

// --------------------
// DOWNLOAD / PREVIEW
// --------------------
export async function apiDownloadFileBlob(fileId) {
  const token = getToken();

  const res = await fetch(`${API_BASE_URL}/files/${fileId}/download`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Download failed");
  }

  return res.blob();
}

// --------------------
// DELETE FILE
// --------------------
export function apiDeleteFile(fileId) {
  return fetchWithAuth(`/files/${fileId}`, {
    method: "DELETE",
  });
}
// --------------------
// Permanent Delete File
// --------------------
export function apiPermanentDeleteFile(id) {  
  return fetchWithAuth(`/files/${id}/permanent`, {
    method: "DELETE",
  });
}
// --------------------
// DELETE FOLDER
// --------------------   
export function apiDeleteFolder(folderId) {
  return fetchWithAuth(`/folders/${folderId}`, {
    method: "DELETE",
  });
}   

// --------------------
// RESTORE FOLDER
// --------------------
export function apiRestoreFolder(folderId) {
  return fetchWithAuth(`/folders/${folderId}/restore`, {
    method: "POST",
  });
}

// --------------------
// TRASHED FOLDERS
// --------------------
export function apiGetTrashFolders() {
  return fetchWithAuth("/folders/trash");
}

// --------------------
// Permanent Delete Folder
// --------------------
export function apiPermanentDeleteFolder(folderId) {
  return fetchWithAuth(`/folders/${folderId}/permanent`, {
    method: "DELETE",
  });
}
