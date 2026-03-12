// Core types for the Firefighter application

export interface Game {
  id: number;
  name: string;
  aliases: string[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
  current_patch_release?: string;
  monitoring_active: boolean;
}

export interface GameHealth {
  overall_score: number;
  crash_risk: number;
  progression_risk: number;
  exploit_risk: number;
  connectivity_risk: number;
  sentiment_score: number;
}

export interface Alert {
  id: number;
  game_id: number;
  type: AlertType;
  status: AlertStatus;
  confidence: number;
  mention_count: number;
  source_count: number;
  ai_summary?: string;
  suggested_title?: string;
  suggested_investigations: string[];
  triggered_at: string;
  resolved_at?: string;
}

export interface AlertDetails extends Alert {
  evidence: Evidence[];
  timeline: TimelineEvent[];
}

export interface Evidence {
  source: SourceType;
  content: string;
  timestamp: string;
  url?: string;
  author?: string;
}

export interface TimelineEvent {
  time: string;
  event: string;
  alert_id?: number;
  count?: number;
}

export interface PatchMonitoring {
  active: boolean;
  time_since_release: string;
  risk_index: number;
  alerts_count: number;
}

export interface DashboardData {
  game_health: GameHealth;
  active_alerts: Alert[];
  patch_monitoring: PatchMonitoring;
  signal_timeline: TimelineEvent[];
}

export interface Feedback {
  id: number;
  alert_id: number;
  action: FeedbackAction;
  comment?: string;
  created_at: string;
}

// Enums
export type AlertType = 'crash' | 'progression' | 'exploit' | 'connectivity' | 'sentiment';
export type AlertStatus = 'new' | 'investigating' | 'confirmed' | 'false_alarm' | 'known_issue';
export type SourceType = 'reddit' | 'steam' | 'twitter' | 'facebook';
export type FeedbackAction = 'confirm' | 'false_alarm' | 'needs_investigation';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// UI Component Props
export interface AlertCardProps {
  alert: Alert;
  onClick?: () => void;
}

export interface GameHealthPanelProps {
  health: GameHealth;
  className?: string;
}

export interface PatchMonitorProps {
  monitoring: PatchMonitoring;
  className?: string;
}

// WebSocket message types
export interface WSMessage {
  type: 'alert_created' | 'alert_updated' | 'health_updated' | 'signal_received';
  data: any;
  timestamp: string;
}

// API Response types
export interface APIResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface APIError {
  detail: string;
  code?: string;
}