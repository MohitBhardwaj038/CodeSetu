import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

const mockRegisterRequest = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'register' })
);
const mockVerifyRegisterOtp = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'register-verify' })
);
const mockLogin = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'login' })
);

const mockGetProfile = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'profile', role: req.user.role })
);
const mockGetAllUsers = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'all-users', role: req.user.role })
);
const mockDeleteUser = jest.fn((req, res) =>
  res.status(200).json({ success: true, route: 'delete-user', id: req.params.id, role: req.user.role })
);

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

const { default: authRoutes } = await import('../routes/auth.route.js');
const { default: userRoutes } = await import('../routes/user.route.js');

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  return app;
};

describe('Route tests: auth + user', () => {
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
      expect(res.body.success).toBe(true);
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
      expect(res.body.success).toBe(true);
      expect(mockVerifyRegisterOtp).toHaveBeenCalledTimes(1);
    });

    test('calls controller for valid OTP verification payload', async () => {
      const res = await request(app).post('/api/auth/register/verify').send({
        email: 'lavish@example.com',
        otp: '123456',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockVerifyRegisterOtp).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/login', () => {
    test('routes requests to controller', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'lavish@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    test('calls controller for valid login payload', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'lavish@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/user/profile', () => {
    test('returns 401 without bearer token', async () => {
      const res = await request(app).get('/api/user/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(mockGetProfile).not.toHaveBeenCalled();
    });

    test('returns 200 with valid user token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockGetProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/user/all-users', () => {
    test('returns 403 for non-admin token', async () => {
      const res = await request(app)
        .get('/api/user/all-users')
        .set('Authorization', 'Bearer user-token');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockGetAllUsers).not.toHaveBeenCalled();
    });

    test('returns 200 for admin token', async () => {
      const res = await request(app)
        .get('/api/user/all-users')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
    });
  });

  describe('DELETE /api/user/:id', () => {
    test('returns 401 without bearer token', async () => {
      const res = await request(app).delete('/api/user/507f191e810c19729de860ea');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    test('returns 200 for admin token', async () => {
      const res = await request(app)
        .delete('/api/user/507f191e810c19729de860ea')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    });
  });
});
