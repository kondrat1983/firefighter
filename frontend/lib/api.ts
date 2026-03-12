import { Game, Alert, AlertDetails, DashboardData, Feedback, APIResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Games API
  async getGames(): Promise<Game[]> {
    return this.request<Game[]>('/games');
  }

  async createGame(gameData: Partial<Game>): Promise<Game> {
    return this.request<Game>('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async getGame(id: number): Promise<Game> {
    return this.request<Game>(`/games/${id}`);
  }

  async updateGame(id: number, gameData: Partial<Game>): Promise<Game> {
    return this.request<Game>(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(id: number): Promise<void> {
    return this.request<void>(`/games/${id}`, {
      method: 'DELETE',
    });
  }

  async getGameHealth(id: number) {
    return this.request(`/games/${id}/health`);
  }

  // Alerts API
  async getAlerts(filters?: {
    status?: string;
    game_id?: number;
    limit?: number;
  }): Promise<Alert[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.game_id) params.append('game_id', filters.game_id.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/alerts?${queryString}` : '/alerts';
    
    return this.request<Alert[]>(endpoint);
  }

  async getAlert(id: number): Promise<AlertDetails> {
    return this.request<AlertDetails>(`/alerts/${id}`);
  }

  async updateAlertStatus(id: number, status: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async submitFeedback(
    alertId: number,
    action: string,
    comment?: string
  ): Promise<Feedback> {
    return this.request<Feedback>(`/alerts/${alertId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    });
  }

  // Dashboard API
  async getDashboardData(gameId?: number): Promise<DashboardData> {
    const params = gameId ? `?game_id=${gameId}` : '';
    return this.request<DashboardData>(`/dashboard${params}`);
  }

  async getSystemMetrics() {
    return this.request('/dashboard/metrics');
  }
}

export const apiClient = new APIClient();

// Utility function for handling API errors
export function handleAPIError(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
}