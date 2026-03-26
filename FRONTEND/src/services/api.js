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
    // Extract the most useful error message
    const errorMsg =
      data.message ||
      (data.errors && data.errors[0]?.msg) ||
      "Something went wrong. Please try again.";
    throw new Error(errorMsg);
  }

  return data;
}

// ─── Auth API ────────────────────────────────────

/**
 * Step 1: Send registration OTP
 * @param {string} name
 * @param {string} email
 */
export async function registerRequest(name, email) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

/**
 * Step 2: Verify OTP and set password
 * @param {string} email
 * @param {string} otp
 * @param {string} password
 */
export async function verifyOtp(email, otp, password) {
  return request("/auth/register/verify", {
    method: "POST",
    body: JSON.stringify({ email, otp, password }),
  });
}

/**
 * Login with email and password → returns JWT
 * @param {string} email
 * @param {string} password
 */
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
