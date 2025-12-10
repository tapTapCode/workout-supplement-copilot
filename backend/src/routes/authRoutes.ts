import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, isDatabaseConfigured } from '../db/connection';

const router = Router();

/**
 * Sign up endpoint - Create new user with email and password
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    });
  }

  if (!password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
      },
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters',
      },
    });
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'JWT_SECRET not configured',
      },
    });
  }

  try {
    let userId: string;

    // If database is configured, create user with password hash
    if (isDatabaseConfigured()) {
      try {
        // Check if user already exists
        const existingUsers = await query<{ id: string }>(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUsers.length > 0) {
          return res.status(409).json({
            error: {
              code: 'USER_EXISTS',
              message: 'User with this email already exists',
            },
          });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create new user with UUID and password hash
        const newUser = await query<{ id: string }>(
          'INSERT INTO users (id, email, password_hash) VALUES (uuid_generate_v4(), $1, $2) RETURNING id',
          [email, passwordHash]
        );
        userId = newUser[0].id;
      } catch (dbError) {
        console.error('Database error during signup:', dbError);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create user',
          },
        });
      }
    } else {
      // Database not configured, generate UUID client-side (demo mode)
      console.warn('Database not configured, using demo mode');
      userId = uuidv4();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: userId,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      jwtSecret
    );

    res.status(201).json({
      data: {
        token,
        user: {
          id: userId,
          email,
        },
      },
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create user',
      },
    });
  }
});

/**
 * Login endpoint - Authenticate user with email and password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    });
  }

  if (!password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required',
      },
    });
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'JWT_SECRET not configured',
      },
    });
  }

  try {
    let userId: string;
    let userEmail: string = email;

    // If database is configured, validate password
    if (isDatabaseConfigured()) {
      try {
        // Find user by email
        const users = await query<{ id: string; password_hash: string | null }>(
          'SELECT id, password_hash FROM users WHERE email = $1',
          [email]
        );

        if (users.length === 0) {
          return res.status(401).json({
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          });
        }

        const user = users[0];
        userId = user.id;

        // Check if user has a password hash (new signup) or is legacy user (no password)
        if (user.password_hash) {
          // Validate password
          const isValidPassword = await bcrypt.compare(password, user.password_hash);
          if (!isValidPassword) {
            return res.status(401).json({
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
              },
            });
          }
        } else {
          // Legacy user without password - allow login for backward compatibility
          // In production, you might want to force password reset
          console.warn(`Legacy user ${email} logged in without password`);
        }
      } catch (dbError) {
        console.error('Database error during login:', dbError);
        return res.status(500).json({
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to authenticate user',
          },
        });
      }
    } else {
      // Database not configured, generate UUID client-side (demo mode)
      console.warn('Database not configured, using demo mode');
      userId = uuidv4();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: userId,
        email: userEmail,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      jwtSecret
    );

    res.json({
      data: {
        token,
        user: {
          id: userId,
          email: userEmail,
        },
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to authenticate user',
      },
    });
  }
});

/**
 * Demo authentication endpoint (backward compatibility)
 * In production, this would integrate with Supabase Auth
 */
router.post('/demo', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email is required',
      },
    });
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'JWT_SECRET not configured',
      },
    });
  }

  try {
    let userId: string;

    // If database is configured, create or get user with proper UUID
    if (isDatabaseConfigured()) {
      try {
        // Try to find existing user by email
        const existingUsers = await query<{ id: string }>(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUsers.length > 0) {
          // Use existing user's UUID
          userId = existingUsers[0].id;
        } else {
          // Create new user with UUID (no password for demo)
          const newUser = await query<{ id: string }>(
            'INSERT INTO users (id, email) VALUES (uuid_generate_v4(), $1) RETURNING id',
            [email]
          );
          userId = newUser[0].id;
        }
      } catch (dbError) {
        // If database query fails (e.g., table doesn't exist), generate UUID client-side
        console.warn('Database user lookup failed, using generated UUID:', dbError);
        userId = uuidv4();
      }
    } else {
      // Database not configured, generate UUID client-side
      userId = uuidv4();
    }

    // Generate a demo JWT token with proper UUID
    const token = jwt.sign(
      {
        sub: userId, // Use UUID instead of demo-user-{timestamp}
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      },
      jwtSecret
    );

    res.json({
      data: {
        token,
        user: {
          id: userId,
          email,
        },
      },
    });
  } catch (error) {
    console.error('Error in demo auth:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create demo user',
      },
    });
  }
});

export default router;

