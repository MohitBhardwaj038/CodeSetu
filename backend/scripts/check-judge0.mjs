import { checkJudge0Health } from "../utils/judge0Client.js";
import env from "../utils/env.js";

console.log(`Checking Judge0 at: ${env.JUDGE0_API_URL}`);

try {
  const ok = await checkJudge0Health();
  console.log(ok ? "✅ Judge0 is working" : "❌ Judge0 health check failed");
  process.exit(ok ? 0 : 1);
} catch (err) {
  console.error("❌", err.message);
  process.exit(1);
}
