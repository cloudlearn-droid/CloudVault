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
  const query = parentId ? `?parent_id=${parentId}` : "";
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
// FILES (Architecture B)
// --------------------
export function apiGetFiles(folder_id = null) {
  const query = folder_id ? `?folder_id=${folder_id}` : "";
  return fetchWithAuth(`/files${query}`);
}
