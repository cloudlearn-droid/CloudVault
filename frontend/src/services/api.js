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
// AUTHENTICATED FETCH (FIXED)
// --------------------
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("No auth token found");
  }

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
// FOLDERS
// --------------------
export function apiGetFolders(parentId = null) {
  const query =
    parentId === null ? "" : `?parent_id=${parentId}`;
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
  const query =
    folder_id === null ? "" : `?folder_id=${folder_id}`;
  return fetchWithAuth(`/files${query}`);
}

export async function apiUploadFile(file, folder_id = null) {
  const formData = new FormData();
  formData.append("file", file);

  const query =
    folder_id === null ? "" : `?folder_id=${folder_id}`;

  return fetchWithAuth(`/files/upload${query}`, {
    method: "POST",
    body: formData,
  });
}
// --------------------
// DOWNLOAD FILE
// --------------------
export async function apiDownloadFile(fileId) {
  return fetchWithAuth(`/files/${fileId}/download`);
}
export async function apiDownloadFileBlob(fileId) {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `http://127.0.0.1:8000/files/${fileId}/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  return blob;
}
