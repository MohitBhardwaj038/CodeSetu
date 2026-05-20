import { API_BASE as BASE_URL } from "../config.js";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  };
  const token = localStorage.getItem("codesetu_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, config);
  const data = await response.json();
  if (!response.ok) {
    const msg = data.message || (data.errors?.[0]?.msg) || "Something went wrong";
    throw new Error(msg);
  }
  return data;
}

// ── Rooms ─────────────────────────────────────────────

export async function listPublicRooms() {
  return request("/rooms", { method: "GET" });
}

export async function createRoom(payload) {
  return request("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoom(code) {
  return request(`/rooms/${code}`, { method: "GET" });
}

export async function joinRoom(code, password) {
  return request(`/rooms/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function startRoom(code) {
  return request(`/rooms/${code}/start`, { method: "POST" });
}

export async function getLeaderboard(code) {
  return request(`/rooms/${code}/leaderboard`, { method: "GET" });
}

// ── Battle Submissions ────────────────────────────────

export async function battleSubmitCode(code, problemId, languageId, userCode) {
  return request(`/rooms/${code}/problems/${problemId}/submit`, {
    method: "POST",
    body: JSON.stringify({ languageId, userCode }),
  });
}

export async function battleRunCode(problemId, languageId, code) {
  return request(`/problems/${problemId}/run-code`, {
    method: "POST",
    body: JSON.stringify({ languageId, code }),
  });
}

export async function getBattleSubmissions(code, problemId) {
  return request(`/rooms/${code}/problems/${problemId}/submissions`, {
    method: "GET",
  });
}
