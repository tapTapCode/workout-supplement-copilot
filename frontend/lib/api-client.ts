import type {
  ApiResponse,
  PaginatedResponse,
  Workout,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  CopilotRecommendation,
  CopilotRecommendRequest,
  WorkoutSchedule,
} from '@workout-copilot/shared';
import { API_ENDPOINTS, STORAGE_KEYS, PAGINATION } from './constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Read response text once (can only be read once)
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let text: string;
      let data: unknown;
      
      try {
        text = await response.text();
        
        // Handle empty responses
        if (!text || text.trim() === '') {
          if (!response.ok) {
            return {
              error: {
                code: 'EMPTY_RESPONSE',
                message: `Server returned empty response. Status: ${response.status}`,
              },
            };
          }
          data = {};
        } else if (isJson) {
          try {
            data = JSON.parse(text);
          } catch {
            return {
              error: {
                code: 'PARSE_ERROR',
                message: `Invalid JSON response from server. Status: ${response.status}. Response: ${text.substring(0, 200)}`,
              },
            };
          }
        } else {
          // Non-JSON response
          return {
            error: {
              code: 'INVALID_RESPONSE',
              message: `Server returned non-JSON response. Status: ${response.status}. ${text.substring(0, 100)}`,
            },
          };
        }
      } catch (readError) {
        // Failed to read response body
        return {
          error: {
            code: 'READ_ERROR',
            message: `Failed to read response. Status: ${response.status}. ${readError instanceof Error ? readError.message : 'Unknown error'}`,
          },
        };
      }

      if (!response.ok) {
        // Type guard for error response
        interface ErrorResponse {
          error?: {
            code?: string;
            message?: string;
            details?: unknown;
          };
        }
        const errorData = data as ErrorResponse;
        
        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          // Clear invalid token
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          }
          return {
            error: {
              code: errorData.error?.code || 'UNAUTHORIZED',
              message: errorData.error?.message || 'Authentication required. Please sign in.',
            },
          };
        }

        return {
          error: {
            code: errorData.error?.code || 'UNKNOWN_ERROR',
            message: errorData.error?.message || `Request failed with status ${response.status}`,
            details: errorData.error?.details && typeof errorData.error.details === 'object' 
              ? (errorData.error.details as Record<string, unknown>)
              : undefined,
          },
        };
      }

      return { data: data as T };
    } catch (error) {
      // Handle network errors and other fetch failures
      let errorMessage = 'Network error occurred';
      const errorCode = 'NETWORK_ERROR';
      
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          errorMessage = `Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running on port 3001.`;
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = `Failed to connect to backend. Check if the server is running at ${API_BASE_URL}`;
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        error: {
          code: errorCode,
          message: errorMessage,
        },
      };
    }
  }

  // Workout endpoints
  async getWorkouts(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<ApiResponse<PaginatedResponse<Workout>>> {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    return this.request<PaginatedResponse<Workout>>(
      `${API_ENDPOINTS.WORKOUTS.LIST}?page=${page}&limit=${safeLimit}`
    );
  }

  async getWorkout(id: string): Promise<ApiResponse<Workout>> {
    return this.request<Workout>(API_ENDPOINTS.WORKOUTS.DETAIL(id));
  }

  async createWorkout(data: CreateWorkoutRequest): Promise<ApiResponse<Workout>> {
    return this.request<Workout>(API_ENDPOINTS.WORKOUTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkout(id: string, data: UpdateWorkoutRequest): Promise<ApiResponse<Workout>> {
    return this.request<Workout>(API_ENDPOINTS.WORKOUTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkout(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(API_ENDPOINTS.WORKOUTS.DELETE(id), {
      method: 'DELETE',
    });
  }

  // Copilot endpoints
  async getRecommendation(
    request: CopilotRecommendRequest
  ): Promise<ApiResponse<{ recommendation: CopilotRecommendation }>> {
    return this.request<{ recommendation: CopilotRecommendation }>(API_ENDPOINTS.COPILOT.RECOMMEND, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getRecommendations(
    page: number = PAGINATION.DEFAULT_PAGE,
    limit: number = PAGINATION.DEFAULT_LIMIT
  ): Promise<ApiResponse<PaginatedResponse<CopilotRecommendation>>> {
    const safeLimit = Math.min(limit, PAGINATION.MAX_LIMIT);
    return this.request<PaginatedResponse<CopilotRecommendation>>(
      `${API_ENDPOINTS.COPILOT.RECOMMENDATIONS}?page=${page}&limit=${safeLimit}`
    );
  }

  async getRecommendationById(id: string): Promise<ApiResponse<CopilotRecommendation>> {
    return this.request<CopilotRecommendation>(API_ENDPOINTS.COPILOT.RECOMMENDATION(id));
  }

  // Schedule endpoints
  async scheduleWorkout(
    workoutId: string,
    dayOfWeek: number,
    timeOfDay?: string
  ): Promise<ApiResponse<{ schedule: WorkoutSchedule }>> {
    return this.request<{ schedule: WorkoutSchedule }>(API_ENDPOINTS.WORKOUTS.SCHEDULE(workoutId), {
      method: 'POST',
      body: JSON.stringify({
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
      }),
    });
  }

  async getWorkoutSchedules(): Promise<ApiResponse<{ schedules: WorkoutSchedule[] }>> {
    return this.request<{ schedules: WorkoutSchedule[] }>(API_ENDPOINTS.WORKOUTS.SCHEDULES);
  }
}

export const apiClient = new ApiClient();

