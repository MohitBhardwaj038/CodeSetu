import axios from "axios";
import env from "./env.js";
import ApiError from "./apiError.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getBatchUrl() {
  const url = env.JUDGE0_API_URL?.trim();
  if (!url) {
    throw new ApiError(
      "Judge0 is not configured. Set JUDGE0_API_URL in backend/.env",
      503
    );
  }
  return url.replace(/\/$/, "");
}

function getSingleSubmissionUrl() {
  return getBatchUrl().replace(/\/batch$/, "");
}

function wrapJudge0Error(err) {
  if (err instanceof ApiError) throw err;

  const code = err.code;
  if (code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ECONNRESET") {
    throw new ApiError(
      "Code runner (Judge0) is unreachable. Start Docker Desktop and run: docker compose up -d — or use JUDGE0_API_URL=https://ce.judge0.com/submissions/batch",
      503
    );
  }

  if (err.response?.status === 503 || err.response?.status === 502) {
    throw new ApiError(
      "Judge0 is temporarily unavailable. Try again in a few seconds.",
      503
    );
  }

  throw err;
}

/**
 * POST a batch of submissions to Judge0.
 * @returns {Array<{token: string}>}
 */
export async function submitBatch(submissions, { wait = false } = {}) {
  const url = `${getBatchUrl()}?base64_encoded=false${wait ? "&wait=false" : ""}`;

  try {
    const { data } = await axios.post(
      url,
      { submissions },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000,
      }
    );

    const list = Array.isArray(data) ? data : [data];
    const tokens = list.map((item) => item?.token).filter(Boolean);

    if (tokens.length === 0) {
      throw new ApiError("Judge0 returned no submission tokens", 502);
    }

    return tokens;
  } catch (err) {
    wrapJudge0Error(err);
  }
}

/**
 * Poll batch endpoint until all submissions finish (status id > 2).
 */
export async function pollBatchResults(
  tokens,
  { intervalMs = 800, maxWaitMs = 45000 } = {}
) {
  const tokenStr = tokens.join(",");
  const url = `${getBatchUrl()}?tokens=${tokenStr}&base64_encoded=false`;
  const started = Date.now();

  try {
    while (Date.now() - started < maxWaitMs) {
      const { data } = await axios.get(url, { timeout: 30000 });
      const submissions = data?.submissions ?? data;

      if (!Array.isArray(submissions) || submissions.length === 0) {
        throw new ApiError("Invalid response from Judge0", 502);
      }

      const stillRunning = submissions.some((s) => s.status?.id <= 2);
      if (!stillRunning) {
        return submissions;
      }

      await delay(intervalMs);
    }

    throw new ApiError("Code execution timed out. Try again.", 504);
  } catch (err) {
    wrapJudge0Error(err);
  }
}

/**
 * Poll each token via single-submission endpoint (used for Run).
 */
export async function pollSingleResults(tokens) {
  const base = getSingleSubmissionUrl();
  const results = [];

  try {
    for (const token of tokens) {
      const started = Date.now();
      let finished = false;

      while (Date.now() - started < 45000) {
        const { data } = await axios.get(`${base}/${token}?base64_encoded=false`, {
          timeout: 30000,
        });

        if (data.status?.id > 2) {
          results.push(data);
          finished = true;
          break;
        }
        await delay(300);
      }

      if (!finished) {
        throw new ApiError("Code execution timed out. Try again.", 504);
      }
    }

    return results;
  } catch (err) {
    wrapJudge0Error(err);
  }
}

/** Health check — useful on server startup */
export async function checkJudge0Health() {
  const base = getSingleSubmissionUrl().replace(/\/submissions$/, "");
  const { status } = await axios.get(`${base}/languages`, { timeout: 10000 });
  return status === 200;
}
