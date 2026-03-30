const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  // Attach JWT if present
  const token = localStorage.getItem("codesetu_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg =
      data.message ||
      (data.errors && data.errors[0]?.msg) ||
      "Something went wrong. Please try again.";
    throw new Error(errorMsg);
  }

  return data;
}

// ─── Auth API ────────────────────────────────────

export async function registerRequest(name, email) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

export async function verifyOtp(email, otp, password) {
  return request("/auth/register/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}

export async function loginUser(email, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ─── User API ────────────────────────────────────

export async function getProfile() {
  return request("/user/profile", { method: "GET" });
}

// ─── Problems API ────────────────────────────────

/**
 * Fetch problems with optional filtering, sorting, pagination
 * @param {Object} params - { search, difficulty, tag, sortBy, page, limit, userId }
 */
export async function getAllProblems(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.difficulty) query.set("difficulty", params.difficulty);
  if (params.tag) query.set("tag", params.tag);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.page) query.set("page", params.page);
  if (params.limit) query.set("limit", params.limit);
  if (params.userId) query.set("userId", params.userId);

  const qs = query.toString();
  return request(`/problems${qs ? `?${qs}` : ""}`, { method: "GET" });
}

/**
 * Fetch a single problem by slug
 * @param {string} slug
 * @param {string} [userId] - optional, for userProblemState
 */
export async function getProblemBySlug(slug, userId) {
  const qs = userId ? `?userId=${userId}` : "";
  return request(`/problems/${slug}${qs}`, { method: "GET" });
}

/**
 * Get all unique topic tags for filter dropdowns
 */
export async function getTags() {
  return request("/problems/tags", { method: "GET" });
}

/**
 * Get all unique company tags for filter dropdowns
 */
export async function getCompanyTags() {
  return request("/problems/company-tags", { method: "GET" });
}

// ─── Submission API ──────────────────────────────

/**
 * Run code against visible test cases (no save)
 * @param {string} problemId
 * @param {number} languageId
 * @param {string} code
 */
export async function runCode(problemId, languageId, code) {
  return request(`/problems/${problemId}/run-code`, {
    method: "POST",
    body: JSON.stringify({ languageId, code }),
  });
}

/**
 * Submit code for grading against ALL test cases (saves submission)
 * @param {string} problemId
 * @param {number} languageId
 * @param {string} code
 * @param {string} userId
 */
export async function submitCode(problemId, languageId, code, userId) {
  return request(`/problems/${problemId}/submissions`, {
    method: "POST",
    body: JSON.stringify({ languageId, code, userId }),
  });
}

/**
 * Get user's submissions for a specific problem
 * @param {string} problemId
 * @param {string} userId
 */
export async function getUserSubmissions(problemId, userId) {
  return request(`/problems/${problemId}/submissions/${userId}`, {
    method: "GET",
  });
}
