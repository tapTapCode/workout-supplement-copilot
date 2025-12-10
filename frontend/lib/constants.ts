/**
 * Frontend constants
 */

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/api/auth/signup',
    LOGIN: '/api/auth/login',
    DEMO: '/api/auth/demo',
  },
  WORKOUTS: {
    LIST: '/api/workouts',
    DETAIL: (id: string) => `/api/workouts/${id}`,
    CREATE: '/api/workouts',
    UPDATE: (id: string) => `/api/workouts/${id}`,
    DELETE: (id: string) => `/api/workouts/${id}`,
    SCHEDULE: (id: string) => `/api/workouts/${id}/schedule`,
    SCHEDULES: '/api/workouts/schedules/all',
  },
  COPILOT: {
    RECOMMEND: '/api/copilot/recommend',
    RECOMMENDATIONS: '/api/copilot/recommendations',
    RECOMMENDATION: (id: string) => `/api/copilot/recommendations/${id}`,
  },
  SUPPLEMENTS: {
    LIST: '/api/supplements',
    DETAIL: (id: string) => `/api/supplements/${id}`,
    COMPLIANCE: (id: string) => `/api/supplements/${id}/compliance`,
  },
  COMPLIANCE: {
    INGREDIENT: (name: string) => `/api/compliance/ingredient/${encodeURIComponent(name)}`,
    VERIFY: '/api/compliance/verify',
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

