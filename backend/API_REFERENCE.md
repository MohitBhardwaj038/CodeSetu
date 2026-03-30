# CodeSetu Backend — API Reference

Base URL: `http://localhost:<PORT>/api`

---

## Health Check

### `GET /api/health`
**Auth:** None

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-03-30T06:00:00.000Z"
}
```

---

## Auth Routes (`/api/auth`)

### `POST /api/auth/register`
**Auth:** None  
**Description:** Send OTP to email for registration

**Request Body:**
```json
{
  "name": "Lavish Garg",          // required, min 2 chars
  "email": "lavish@example.com",  // required, valid email
  "role": "user"                  // optional, "user" (default) or "admin"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to lavish@example.com. Verify within 10 minutes."
}
```

**Errors:** `400` validation failed, `409` email already registered

---

### `POST /api/auth/register/verify`
**Auth:** None  
**Description:** Verify OTP and complete registration

**Request Body:**
```json
{
  "email": "lavish@example.com",  // required, valid email
  "otp": "123456",                // required, exactly 6 digits
  "password": "mypassword"        // required, min 6 chars
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! You can now login.",
  "user": {
    "id": "665abc...",
    "name": "Lavish Garg",
    "email": "lavish@example.com",
    "role": "user"
  }
}
```

**Errors:** `400` invalid/expired OTP or validation failed

---

### `POST /api/auth/login`
**Auth:** None  
**Description:** Login with email + password, returns JWT

**Request Body:**
```json
{
  "email": "lavish@example.com",  // required
  "password": "mypassword"        // required
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "665abc...",
    "name": "Lavish Garg",
    "email": "lavish@example.com",
    "role": "user"
  }
}
```

**Errors:** `400` validation, `401` wrong password, `403` unverified, `404` not found

---

## User Routes (`/api/user`)

### `GET /api/user/profile`
**Auth:** `Bearer <token>` (any verified user)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "665abc...",
    "name": "Lavish Garg",
    "email": "lavish@example.com",
    "role": "user",
    "isVerified": true,
    "createdAt": "2026-03-30T06:00:00.000Z"
  }
}
```

**Errors:** `401` no/invalid token, `404` user not found

---

### `GET /api/user/all-users`
**Auth:** `Bearer <token>` (admin only)

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "users": [
    {
      "_id": "665abc...",
      "name": "Lavish Garg",
      "email": "lavish@example.com",
      "role": "user",
      "isVerified": true,
      "createdAt": "2026-03-30T06:00:00.000Z"
    }
  ]
}
```

**Errors:** `401` no token, `403` not admin

---

### `DELETE /api/user/:id`
**Auth:** `Bearer <token>` (admin only)

**Params:** `id` — MongoDB ObjectId of user to delete

**Response (200):**
```json
{
  "success": true,
  "message": "User lavish@example.com deleted successfully."
}
```

**Errors:** `401` no token, `403` not admin, `404` user not found

---

## Problem Routes (`/api/problems`)

### `GET /api/problems`
**Auth:** None  
**Description:** List problems with filtering, sorting, and pagination

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Results per page |
| `difficulty` | string | — | Filter: `"Easy"`, `"Medium"`, `"Hard"` |
| `tag` | string | — | Filter by topic tag (e.g. `"Array"`) |
| `search` | string | — | Search in title (case-insensitive) |
| `sortBy` | string | `"order"` | `"order"`, `"difficulty"`, `"acceptance"`, `"title"`, `"recent"` |
| `userId` | string | — | MongoDB ObjectId — if provided, adds `userProblemState` to each problem |

**Response (200):**
```json
{
  "status": "success",
  "results": 2,
  "total": 50,
  "page": 1,
  "totalPages": 3,
  "data": {
    "problems": [
      {
        "_id": "665abc...",
        "title": "Two Sum",
        "slug": "two-sum",
        "order": 1,
        "difficulty": "Easy",
        "topicTags": ["Array", "Hash Table"],
        "companyTags": ["Google", "Amazon"],
        "totalSubmissions": 1000,
        "totalAccepted": 750,
        "acceptanceRate": 75.00,
        "likes": 120,
        "dislikes": 5,
        "userProblemState": {
          "attempted": true,
          "submittedSuccessfully": true,
          "lastSubmissionStatus": "Accepted"
        }
      }
    ]
  }
}
```

---

### `GET /api/problems/tags`
**Auth:** None  
**Description:** Get all unique topic tags (for filter dropdowns)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "tags": ["Array", "Binary Search", "Dynamic Programming", "Hash Table", "String"]
  }
}
```

---

### `GET /api/problems/company-tags`
**Auth:** None  
**Description:** Get all unique company tags (for filter dropdowns)

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "companyTags": ["Amazon", "Google", "Meta", "Microsoft"]
  }
}
```

---

### `GET /api/problems/:slug`
**Auth:** None  
**Description:** Full problem detail for code editor page. Returns everything the frontend needs.

**Params:** `slug` — problem slug (e.g. `"two-sum"`)  
**Query Params:** `userId` (optional) — adds `userProblemState`

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "problem": {
      "_id": "665abc...",
      "title": "Two Sum",
      "slug": "two-sum",
      "order": 1,
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers...",
      "difficulty": "Easy",
      "topicTags": ["Array", "Hash Table"],
      "companyTags": ["Google", "Amazon"],
      "constraints": [
        "2 <= nums.length <= 10^4",
        "-10^9 <= nums[i] <= 10^9"
      ],
      "hints": [
        "Try using a hash map to store complements"
      ],
      "editorial": "The brute force approach checks every pair...",
      "likes": 120,
      "dislikes": 5,
      "totalSubmissions": 1000,
      "totalAccepted": 750,
      "acceptanceRate": 75.00,
      "examples": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "output": "[0,1]",
          "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."
        }
      ],
      "supportedLanguages": [
        { "languageId": 63, "languageName": "JavaScript (Node.js 12.14.0)" },
        { "languageId": 62, "languageName": "Java (OpenJDK 13.0.1)" },
        { "languageId": 54, "languageName": "C++ (GCC 9.2.0)" },
        { "languageId": 71, "languageName": "Python (3.8.1)" }
      ],
      "starterCode": [
        {
          "languageId": 63,
          "language": "javascript",
          "code": "function twoSum(nums, target) {\n  // Write your code here\n}"
        },
        {
          "languageId": 62,
          "language": "java",
          "code": "class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // Write your code here\n  }\n}"
        }
      ],
      "testCases": [
        {
          "input": "nums = [2,7,11,15], target = 9",
          "expectedOutput": "[0,1]",
          "explanation": "nums[0] + nums[1] = 9"
        }
      ],
      "userProblemState": {
        "attempted": true,
        "submittedSuccessfully": false,
        "lastSubmissionStatus": "Wrong Answer"
      },
      "createdAt": "2026-03-30T06:00:00.000Z",
      "updatedAt": "2026-03-30T06:00:00.000Z"
    }
  }
}
```

**Errors:** `400` invalid userId, `404` problem not found

---

## Admin Problem Routes (`/api/admin/problems`)

### `POST /api/admin/problems`
**Auth:** None (add auth middleware as needed)  
**Description:** Create a new problem

**Request Body:**
```json
{
  "title": "Two Sum",                        // required, unique
  "slug": "two-sum",                         // optional (auto-generated from title)
  "order": 1,                                // optional, default 0
  "description": "Given an array of...",     // required
  "difficulty": "Easy",                      // required: "Easy" | "Medium" | "Hard"
  "topicTags": ["Array", "Hash Table"],      // optional
  "companyTags": ["Google", "Amazon"],       // optional
  "constraints": ["2 <= nums.length <= 10^4"], // optional
  "hints": ["Use a hash map"],               // optional, max 3
  "editorial": "Brute force: O(n^2)...",     // optional
  "examples": [                              // optional, max 3
    {
      "input": "nums = [2,7,11,15], target = 9",
      "output": "[0,1]",
      "explanation": "Because nums[0] + nums[1] == 9"
    }
  ],
  "supportedLanguages": [                    // optional (defaults: JS, Java, C++, Python)
    { "languageId": 63, "languageName": "JavaScript (Node.js 12.14.0)" }
  ],
  "starterCode": [                           // optional
    {
      "languageId": 63,
      "language": "javascript",
      "code": "function twoSum(nums, target) {\n}"
    }
  ]
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": { "problem": { ...createdProblem } }
}
```

**Errors:** `400` slug exists or validation failed

---

### `PATCH /api/admin/problems/:slug`
**Auth:** None (add auth middleware as needed)  
**Description:** Update any fields on an existing problem

**Params:** `slug` — current slug of the problem  
**Request Body:** Any subset of the fields from create (all optional)

**Response (200):**
```json
{
  "status": "success",
  "data": { "problem": { ...updatedProblem } }
}
```

**Errors:** `404` problem not found

---

### `DELETE /api/admin/problems/:slug`
**Auth:** None (add auth middleware as needed)

**Params:** `slug` — slug of the problem to delete

**Response:** `204 No Content`

**Errors:** `404` problem not found

---

## TestCase Routes (`/api/admin`)

### `POST /api/admin/problems/:problemId/testcases`
**Description:** Create a single test case for a problem

**Params:** `problemId` — MongoDB ObjectId

**Request Body:**
```json
{
  "input": "nums = [2,7,11,15], target = 9",  // required
  "expectedOutput": "[0,1]",                   // required
  "isHidden": false,                           // optional, default true
  "explanation": "nums[0]+nums[1]=9"           // optional
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "testCase": {
      "_id": "665def...",
      "problemId": "665abc...",
      "input": "nums = [2,7,11,15], target = 9",
      "expectedOutput": "[0,1]",
      "isHidden": false,
      "explanation": "nums[0]+nums[1]=9"
    }
  }
}
```

**Errors:** `404` problem not found

---

### `POST /api/admin/problems/:problemId/testcases/bulk`
**Description:** Create multiple test cases at once

**Params:** `problemId` — MongoDB ObjectId

**Request Body:** Array of test case objects
```json
[
  { "input": "[1,2]", "expectedOutput": "3", "isHidden": false },
  { "input": "[4,5]", "expectedOutput": "9", "isHidden": true }
]
```

**Response (201):**
```json
{
  "status": "success",
  "results": 2,
  "data": { "testCases": [ ...insertedTestCases ] }
}
```

**Errors:** `400` invalid input, `404` problem not found

---

### `GET /api/admin/problems/:problemId/testcases`
**Description:** Get all test cases for a problem (including hidden)

**Params:** `problemId` — MongoDB ObjectId

**Response (200):**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "testCases": [
      {
        "_id": "665def...",
        "problemId": "665abc...",
        "input": "[1,2,3]",
        "expectedOutput": "6",
        "isHidden": true,
        "explanation": ""
      }
    ]
  }
}
```

---

### `PATCH /api/admin/testCases/:id`
**Description:** Update a test case

**Params:** `id` — MongoDB ObjectId of the test case

**Request Body:** Any subset:
```json
{
  "input": "[2,3]",
  "expectedOutput": "5",
  "isHidden": true,
  "explanation": "updated"
}
```

**Response (200):**
```json
{
  "status": "success",
  "data": { "testCase": { ...updatedTestCase } }
}
```

**Errors:** `404` test case not found

---

### `DELETE /api/admin/testCases/:id`
**Params:** `id` — MongoDB ObjectId

**Response:** `204 No Content` (also removes reference from Problem.testCases)

**Errors:** `404` test case not found

---

## Submission Routes (`/api/problems`)

### `POST /api/problems/:problemId/run-code`
**Auth:** None  
**Description:** Run user code against **visible** (non-hidden) test cases only. Does NOT save a submission.

**Params:** `problemId` — MongoDB ObjectId

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) { ... }",  // required
  "languageId": 63                                    // required (Judge0 language ID)
}
```

**Response (200):**
```json
{
  "status": "success",
  "runStatus": "Accepted",
  "results": [
    {
      "input": "nums = [2,7,11,15], target = 9",
      "expectedOutput": "[0,1]",
      "actualOutput": "[0,1]",
      "status": "Accepted",
      "time": 45.2,
      "memory": 9200
    },
    {
      "input": "nums = [3,2,4], target = 6",
      "expectedOutput": "[1,2]",
      "actualOutput": "[1,2]",
      "status": "Accepted",
      "time": 38.1,
      "memory": 9100
    }
  ]
}
```

**Errors:** `400` missing fields, `404` no visible test cases

---

### `POST /api/problems/:problemId/submissions`
**Auth:** None  
**Description:** Submit code for grading against **all** test cases (hidden + visible). Saves the submission and updates problem stats.

**Params:** `problemId` — MongoDB ObjectId

**Request Body:**
```json
{
  "code": "function twoSum(nums, target) { ... }",  // required
  "languageId": 63,                                   // required
  "userId": "665abc..."                               // required (MongoDB ObjectId)
}
```

**Response (201):**
```json
{
  "status": "success",
  "data": {
    "submission": {
      "_id": "665ghi...",
      "userId": "665abc...",
      "problemId": "665def...",
      "language": "63",
      "code": "function twoSum(nums, target) { ... }",
      "status": "Accepted",
      "executionTimeMs": 45.2,
      "memoryUsedKb": 9200,
      "failedTestCase": null,
      "createdAt": "2026-03-30T06:00:00.000Z"
    },
    "userProblemState": {
      "attempted": true,
      "submittedSuccessfully": true,
      "lastSubmissionStatus": "Accepted"
    }
  }
}
```

If failed:
```json
{
  "data": {
    "submission": {
      "status": "Wrong Answer",
      "failedTestCase": {
        "input": "nums = [3,2,4], target = 6",
        "expectedOutput": "[1,2]",
        "actualOutput": "[0,2]"
      }
    },
    "userProblemState": {
      "attempted": true,
      "submittedSuccessfully": false,
      "lastSubmissionStatus": "Wrong Answer"
    }
  }
}
```

**Possible statuses:** `"Accepted"`, `"Wrong Answer"`, `"Runtime Error"`, `"Time Limit Exceeded"`, `"Pending"`

**Errors:** `400` missing fields, `404` no test cases

---

### `GET /api/problems/:problemId/submissions/:userId`
**Auth:** None  
**Description:** Get all submissions for a specific user on a specific problem (user can only see their own)

**Params:**
- `problemId` — MongoDB ObjectId
- `userId` — MongoDB ObjectId

**Response (200):**
```json
{
  "status": "success",
  "results": 3,
  "data": {
    "submissions": [
      {
        "_id": "665ghi...",
        "userId": "665abc...",
        "problemId": {
          "_id": "665def...",
          "title": "Two Sum",
          "slug": "two-sum",
          "difficulty": "Easy"
        },
        "language": "63",
        "status": "Accepted",
        "executionTimeMs": 45.2,
        "memoryUsedKb": 9200,
        "createdAt": "2026-03-30T06:00:00.000Z"
      }
    ]
  }
}
```

> **Note:** `code` and `failedTestCase` fields are excluded from this listing response for performance.

---

## Judge0 Language IDs Reference

| ID | Language |
|----|----------|
| 63 | JavaScript (Node.js 12.14.0) |
| 62 | Java (OpenJDK 13.0.1) |
| 54 | C++ (GCC 9.2.0) |
| 71 | Python (3.8.1) |
| 52 | C++ (GCC 7.4.0) |
| 53 | C++ (GCC 8.3.0) |
| 76 | C++ (Clang 7.0.1) |
| 91 | Java (JDK 17.0.6) |
