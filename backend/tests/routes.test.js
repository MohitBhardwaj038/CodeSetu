import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

// ─────────────────────────────────────────────
// Mock: Auth Controllers
// ─────────────────────────────────────────────
const mockRegisterRequest = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'register' })
);
const mockVerifyRegisterOtp = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'register-verify' })
);
const mockLogin = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'login' })
);

// ─────────────────────────────────────────────
// Mock: User Controllers
// ─────────────────────────────────────────────
const mockGetProfile = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'profile', role: req.user.role })
);
const mockGetAllUsers = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'all-users', role: req.user.role })
);
const mockDeleteUser = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'delete-user', id: req.params.id, role: req.user.role })
);

// ─────────────────────────────────────────────
// Mock: Problem Controllers
// ─────────────────────────────────────────────
const mockGetAllProblems = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', results: 0, data: { problems: [] } })
);
const mockGetProblemBySlug = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', data: { problem: { slug: req.params.slug } } })
);
const mockCreateProblem = jest.fn((req, res) =>
  res.status(201).json({ status: 'success', data: { problem: req.body } })
);
const mockUpdateProblem = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', data: { problem: { slug: req.params.slug, ...req.body } } })
);
const mockDeleteProblem = jest.fn((req, res) =>
  res.status(204).send()
);
const mockGetAllTags = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', data: { tags: ['Array', 'DP'] } })
);
const mockGetAllCompanyTags = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', data: { companyTags: ['Google', 'Meta'] } })
);

// ─────────────────────────────────────────────
// Mock: TestCase Controllers
// ─────────────────────────────────────────────
const mockCreateTestCase = jest.fn((req, res) =>
  res.status(201).json({ status: 'success', data: { testCase: req.body } })
);
const mockCreateMultipleTestCases = jest.fn((req, res) =>
  res.status(201).json({ status: 'success', results: req.body.length, data: { testCases: req.body } })
);
const mockGetTestCasesByProblem = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', results: 0, data: { testCases: [] } })
);
const mockUpdateTestCase = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', data: { testCase: req.body } })
);
const mockDeleteTestCase = jest.fn((req, res) =>
  res.status(204).send()
);

// ─────────────────────────────────────────────
// Mock: Submission Controllers
// ─────────────────────────────────────────────
const mockCreateSubmission = jest.fn((req, res) =>
  res.status(201).json({ status: 'success', data: { submission: { ...req.body, problemId: req.params.problemId } } })
);
const mockRunCode = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', runStatus: 'Accepted', results: [] })
);
const mockGetSubmissionsByUser = jest.fn((req, res) =>
  res.status(200).json({ status: 'success', results: 0, data: { submissions: [] } })
);

// ─────────────────────────────────────────────
// Register all mocks
// ─────────────────────────────────────────────
jest.unstable_mockModule('../controllers/auth.controller.js', () => ({
  registerRequest: (req, res, next) => mockRegisterRequest(req, res, next),
  verifyRegisterOtp: (req, res, next) => mockVerifyRegisterOtp(req, res, next),
  login: (req, res, next) => mockLogin(req, res, next),
}));

jest.unstable_mockModule('../controllers/user.controller.js', () => ({
  getProfile: (req, res, next) => mockGetProfile(req, res, next),
  getAllUsers: (req, res, next) => mockGetAllUsers(req, res, next),
  deleteUser: (req, res, next) => mockDeleteUser(req, res, next),
}));

jest.unstable_mockModule('../controllers/problem.controller.js', () => ({
  getAllProblems: (req, res, next) => mockGetAllProblems(req, res, next),
  getProblemBySlug: (req, res, next) => mockGetProblemBySlug(req, res, next),
  createProblem: (req, res, next) => mockCreateProblem(req, res, next),
  updateProblem: (req, res, next) => mockUpdateProblem(req, res, next),
  deleteProblem: (req, res, next) => mockDeleteProblem(req, res, next),
  getAllTags: (req, res, next) => mockGetAllTags(req, res, next),
  getAllCompanyTags: (req, res, next) => mockGetAllCompanyTags(req, res, next),
}));

jest.unstable_mockModule('../controllers/testCase.controller.js', () => ({
  createTestCase: (req, res, next) => mockCreateTestCase(req, res, next),
  createMultipleTestCases: (req, res, next) => mockCreateMultipleTestCases(req, res, next),
  getTestCasesByProblem: (req, res, next) => mockGetTestCasesByProblem(req, res, next),
  updateTestCase: (req, res, next) => mockUpdateTestCase(req, res, next),
  deleteTestCase: (req, res, next) => mockDeleteTestCase(req, res, next),
}));

jest.unstable_mockModule('../controllers/submission.controller.js', () => ({
  createSubmission: (req, res, next) => mockCreateSubmission(req, res, next),
  run: (req, res, next) => mockRunCode(req, res, next),
  getSubmissionsByUser: (req, res, next) => mockGetSubmissionsByUser(req, res, next),
}));

jest.unstable_mockModule('../middleware/authMiddleware.js', () => {
  const protect = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
    }

    const token = header.split(' ')[1];
    req.user = {
      _id: '507f191e810c19729de860ea',
      role: token === 'admin-token' ? 'admin' : 'user',
      email: token === 'admin-token' ? 'admin@example.com' : 'user@example.com',
    };
    next();
  };

  const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: `Access denied. This route is restricted to: ${roles.join(', ')}.` });
    }
    next();
  };

  return { protect, authorize };
});

// ─────────────────────────────────────────────
// Import routes AFTER mocks are set up
// ─────────────────────────────────────────────
const { default: authRoutes } = await import('../routes/auth.route.js');
const { default: userRoutes } = await import('../routes/user.route.js');
const { default: problemRoutes } = await import('../routes/problem.route.js');
const { default: testCaseRoutes } = await import('../routes/testCase.route.js');
const { default: submissionRoutes } = await import('../routes/submission.route.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api', problemRoutes);
  app.use('/api', testCaseRoutes);
  app.use('/api', submissionRoutes);
  return app;
};

// ═══════════════════════════════════════════════
// AUTH ROUTE TESTS
// ═══════════════════════════════════════════════
describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('routes requests to controller', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'bad' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockRegisterRequest).toHaveBeenCalledTimes(1);
    });

    test('calls controller for valid payload', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Lavish',
        email: 'lavish@example.com',
        role: 'user',
      });
      expect(res.status).toBe(200);
      expect(mockRegisterRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/register/verify', () => {
    test('routes requests to controller', async () => {
      const res = await request(app).post('/api/auth/register/verify').send({
        email: 'lavish@example.com',
        otp: '12',
        password: '123',
      });
      expect(res.status).toBe(200);
      expect(mockVerifyRegisterOtp).toHaveBeenCalledTimes(1);
    });

    test('calls controller for valid OTP verification payload', async () => {
      const res = await request(app).post('/api/auth/register/verify').send({
        email: 'lavish@example.com',
        otp: '123456',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(mockVerifyRegisterOtp).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/login', () => {
    test('routes requests to controller', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'lavish@example.com' });
      expect(res.status).toBe(200);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    test('calls controller for valid login payload', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'lavish@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════
// USER ROUTE TESTS
// ═══════════════════════════════════════════════
describe('User Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    test('returns 401 without bearer token', async () => {
      const res = await request(app).get('/api/user/profile');
      expect(res.status).toBe(401);
      expect(mockGetProfile).not.toHaveBeenCalled();
    });

    test('returns 200 with valid user token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer user-token');
      expect(res.status).toBe(200);
      expect(mockGetProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/user/all-users', () => {
    test('returns 403 for non-admin token', async () => {
      const res = await request(app)
        .get('/api/user/all-users')
        .set('Authorization', 'Bearer user-token');
      expect(res.status).toBe(403);
      expect(mockGetAllUsers).not.toHaveBeenCalled();
    });

    test('returns 200 for admin token', async () => {
      const res = await request(app)
        .get('/api/user/all-users')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/user/:id', () => {
    test('returns 401 without bearer token', async () => {
      const res = await request(app).delete('/api/user/507f191e810c19729de860ea');
      expect(res.status).toBe(401);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    test('returns 200 for admin token', async () => {
      const res = await request(app)
        .delete('/api/user/507f191e810c19729de860ea')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════
// PROBLEM ROUTE TESTS
// ═══════════════════════════════════════════════
describe('Problem Routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /api/problems', () => {
    test('returns 200 and calls getAllProblems controller', async () => {
      const res = await request(app).get('/api/problems');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockGetAllProblems).toHaveBeenCalledTimes(1);
    });

    test('passes query params through to controller', async () => {
      const res = await request(app).get('/api/problems?difficulty=Easy&tag=Array&page=2');
      expect(res.status).toBe(200);
      expect(mockGetAllProblems).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/problems/tags', () => {
    test('returns all unique topic tags', async () => {
      const res = await request(app).get('/api/problems/tags');
      expect(res.status).toBe(200);
      expect(res.body.data.tags).toEqual(['Array', 'DP']);
      expect(mockGetAllTags).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/problems/company-tags', () => {
    test('returns all unique company tags', async () => {
      const res = await request(app).get('/api/problems/company-tags');
      expect(res.status).toBe(200);
      expect(res.body.data.companyTags).toEqual(['Google', 'Meta']);
      expect(mockGetAllCompanyTags).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/problems/:slug', () => {
    test('returns 200 and calls getProblemBySlug controller', async () => {
      const res = await request(app).get('/api/problems/two-sum');
      expect(res.status).toBe(200);
      expect(res.body.data.problem.slug).toBe('two-sum');
      expect(mockGetProblemBySlug).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/admin/problems', () => {
    test('creates a new problem and returns 201', async () => {
      const body = {
        title: 'Two Sum',
        description: 'Find two indices...',
        difficulty: 'Easy',
        topicTags: ['Array', 'Hash Table'],
      };
      const res = await request(app).post('/api/admin/problems').send(body);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(mockCreateProblem).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/admin/problems/:slug', () => {
    test('updates a problem and returns 200', async () => {
      const res = await request(app)
        .patch('/api/admin/problems/two-sum')
        .send({ difficulty: 'Medium' });
      expect(res.status).toBe(200);
      expect(res.body.data.problem.slug).toBe('two-sum');
      expect(mockUpdateProblem).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/admin/problems/:slug', () => {
    test('deletes a problem and returns 204', async () => {
      const res = await request(app).delete('/api/admin/problems/two-sum');
      expect(res.status).toBe(204);
      expect(mockDeleteProblem).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════
// TEST CASE ROUTE TESTS
// ═══════════════════════════════════════════════
describe('TestCase Routes', () => {
  let app;
  const problemId = '507f191e810c19729de860ea';

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /api/admin/problems/:problemId/testcases', () => {
    test('creates a test case and returns 201', async () => {
      const body = { input: '[1,2,3]', expectedOutput: '6', isHidden: false };
      const res = await request(app).post(`/api/admin/problems/${problemId}/testcases`).send(body);
      expect(res.status).toBe(201);
      expect(mockCreateTestCase).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/admin/problems/:problemId/testcases/bulk', () => {
    test('creates multiple test cases and returns 201', async () => {
      const body = [
        { input: '[1,2]', expectedOutput: '3', isHidden: false },
        { input: '[4,5]', expectedOutput: '9', isHidden: true },
      ];
      const res = await request(app).post(`/api/admin/problems/${problemId}/testcases/bulk`).send(body);
      expect(res.status).toBe(201);
      expect(mockCreateMultipleTestCases).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/admin/problems/:problemId/testcases', () => {
    test('returns test cases for a problem', async () => {
      const res = await request(app).get(`/api/admin/problems/${problemId}/testcases`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockGetTestCasesByProblem).toHaveBeenCalledTimes(1);
    });
  });

  describe('PATCH /api/admin/testCases/:id', () => {
    test('updates a test case and returns 200', async () => {
      const res = await request(app)
        .patch(`/api/admin/testCases/${problemId}`)
        .send({ input: '[2,3]', expectedOutput: '5' });
      expect(res.status).toBe(200);
      expect(mockUpdateTestCase).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/admin/testCases/:id', () => {
    test('deletes a test case and returns 204', async () => {
      const res = await request(app).delete(`/api/admin/testCases/${problemId}`);
      expect(res.status).toBe(204);
      expect(mockDeleteTestCase).toHaveBeenCalledTimes(1);
    });
  });
});

// ═══════════════════════════════════════════════
// SUBMISSION ROUTE TESTS
// ═══════════════════════════════════════════════
describe('Submission Routes', () => {
  let app;
  const problemId = '507f191e810c19729de860ea';
  const userId = '507f191e810c19729de860eb';

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /api/problems/:problemId/submissions', () => {
    test('creates a submission and returns 201', async () => {
      const body = { code: 'function twoSum() {}', languageId: 63, userId };
      const res = await request(app).post(`/api/problems/${problemId}/submissions`).send(body);
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(mockCreateSubmission).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/problems/:problemId/run-code', () => {
    test('runs code against visible test cases and returns results', async () => {
      const body = { code: 'function twoSum() {}', languageId: 63 };
      const res = await request(app).post(`/api/problems/${problemId}/run-code`).send(body);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockRunCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/problems/:problemId/submissions/:userId', () => {
    test('returns submissions for a specific user on a problem', async () => {
      const res = await request(app).get(`/api/problems/${problemId}/submissions/${userId}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(mockGetSubmissionsByUser).toHaveBeenCalledTimes(1);
    });
  });
});
