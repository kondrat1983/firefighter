'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, Clock, Plus } from 'lucide-react';
import { demoFetch } from '@/lib/demoFetch';
import AlertsModal from '@/components/AlertsModal';
import AddGameModal, { CustomGame } from '@/components/AddGameModal';

const CUSTOM_GAMES_KEY = 'ff_custom_games';

// API Types
interface Game {
  id: number;
  name: string;
  health_score: number;
  active_alerts: number;
  signals_today: number;
  monitoring_active: boolean;
}

interface Alert {
  id: number;
  type: string;
  title: string;
  confidence: number;
  mention_count: number;
  source_count: number;
  sources: string[];
  triggered_at: number;
  status: string;
  game_id?: number;
  game?: string;
}

interface Signal {
  timestamp: number;
  type: string;
  message: string;
  severity: string;
  game_id: number;
  source?: string;
}

// API Client
class FirefighterAPI {
  async fetchGames(): Promise<Game[]> {
    try {
      const data = await demoFetch<{ games: Game[] }>('/api/games');
      return data.games || [];
    } catch (error) {
      console.error('Failed to fetch games:', error);
      return [];
    }
  }

  async fetchAlerts(): Promise<Alert[]> {
    try {
      const data = await demoFetch<{ alerts: Alert[] }>('/api/alerts');
      return data.alerts || [];
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  }

  async fetchSignals(): Promise<Signal[]> {
    try {
      const data = await demoFetch<{ signals: Signal[] }>('/api/signals');
      return data.signals || [];
    } catch (error) {
      console.error('Failed to fetch signals:', error);
      return [];
    }
  }

  async fetchHealth() {
    try {
      return await demoFetch('/api/stats');
    } catch (error) {
      console.error('Failed to fetch health:', error);
      return null;
    }
  }

  async fetchStreams(): Promise<any[]> {
    try {
      const data = await demoFetch<{ streams: any[] }>('/api/streams');
      return data.streams || [];
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      return [];
    }
  }

  async fetchSourcesStatus(): Promise<any[]> {
    try {
      const data = await demoFetch<{ sources: any[] }>('/api/sources/status');
      return data.sources || [];
    } catch (error) {
      console.error('Failed to fetch sources status:', error);
      return [];
    }
  }

  async fetchSteamReviews(game?: string): Promise<any> {
    try {
      return await demoFetch('/api/stats');
    } catch (error) {
      console.error('Failed to fetch Steam reviews:', error);
      return null;
    }
  }
}

const api = new FirefighterAPI();

// Game Widget Component - DEFCON Style! 🎮
function GameWidget({ game }: { game: any }) {
  const getStatusClass = (health: number, alerts: number) => {
    if (alerts > 2 || health < 50) return 'status-critical';
    if (alerts > 0 || health < 80) return 'status-warning';
    return 'status-healthy';
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-risk-low border-risk-low';
    if (health >= 70) return 'text-risk-medium border-risk-medium';
    return 'text-risk-high border-risk-high';
  };

  return (
    <Link
      href={`/games/${game.id}`}
      className={`game-widget block ${getStatusClass(game.health_score, game.active_alerts)} hover:border-primary/60 hover:scale-[1.01] transition-all duration-150`}
    >
      {/* Scanning Line for Critical Alerts */}
      {game.active_alerts > 2 && (
        <div className="scanning-line text-risk-critical"></div>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">{game.name}</h3>
          <div className="status-text text-foreground-secondary">
            {game.monitoring_active ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
        
        {/* Health Radar */}
        <div className={`health-radar ${getHealthColor(game.health_score)}`}>
          {game.active_alerts > 0 && (
            <div className="scanning-line text-current"></div>
          )}
          <span className="relative z-10 text-sm">{game.health_score}%</span>
        </div>
      </div>

      {/* Alerts Bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`status-dot ${
            game.active_alerts === 0 ? 'bg-risk-low' :
            game.active_alerts <= 2 ? 'bg-risk-medium' : 'bg-risk-critical'
          }`}></div>
          <span className="status-text text-foreground">
            {game.active_alerts} ALERTS
          </span>
        </div>
        <div className="flex-1 h-px bg-border opacity-50"></div>
        <div className="status-text text-foreground-secondary animate-data-flow">
          {game.signals_today} SIG
        </div>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="text-center">
          <div className="text-foreground-secondary">CRASH</div>
          <div className="font-mono text-primary">12%</div>
        </div>
        <div className="text-center">
          <div className="text-foreground-secondary">PROG</div>
          <div className="font-mono text-risk-medium">8%</div>
        </div>
        <div className="text-center">
          <div className="text-foreground-secondary">CONN</div>
          <div className="font-mono text-risk-low">3%</div>
        </div>
        <div className="text-center">
          <div className="text-foreground-secondary">SENT</div>
          <div className="font-mono text-risk-low">72%</div>
        </div>
      </div>

      {/* Patch Status */}
      {game.current_patch_release && (
        <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-primary">
            PATCH WINDOW: {game.id === 1 ? '4h' : game.id === 4 ? '3h' : '2h'}
          </span>
        </div>
      )}
    </Link>
  );
}

// ── Custom game widget (user-added, with initializing animation) ──────────
function CustomGameWidget({ game, onRemove }: { game: CustomGame; onRemove: (id: string) => void }) {
  const [phase, setPhase]       = useState<CustomGame['phase']>(game.phase);
  const [health, setHealth]     = useState(game.health_score);
  const [signals, setSignals]   = useState(game.signals_today);

  useEffect(() => {
    if (phase === 'initializing') {
      const t1 = setTimeout(() => setPhase('scanning'), 1800);
      return () => clearTimeout(t1);
    }
    if (phase === 'scanning') {
      const t2 = setTimeout(() => {
        setPhase('monitoring');
        setHealth(Math.floor(Math.random() * 20) + 78); // 78–97
        setSignals(Math.floor(Math.random() * 120) + 20);
      }, 2200);
      return () => clearTimeout(t2);
    }
  }, [phase]);

  const isReady = phase === 'monitoring';

  return (
    <div className="game-widget relative group border border-primary/30 hover:border-primary/60 hover:scale-[1.01] transition-all duration-150">
      {/* Remove button */}
      <button
        onClick={() => onRemove(game.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-foreground-muted hover:text-risk-high p-0.5 rounded z-10"
        title="Remove game"
      >
        ✕
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pr-5">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">{game.name}</h3>
          <div className={`status-text ${
            phase === 'initializing' ? 'text-risk-medium' :
            phase === 'scanning'     ? 'text-primary' :
                                       'text-risk-low'
          }`}>
            {phase === 'initializing' ? 'INITIALIZING…' :
             phase === 'scanning'     ? 'SCANNING…' :
                                        'ONLINE'}
          </div>
        </div>

        {/* Health ring or spinner */}
        <div className={`health-radar ${
          !isReady                  ? 'border-primary/40 text-primary' :
          health >= 90              ? 'text-risk-low border-risk-low' :
          health >= 70              ? 'text-risk-medium border-risk-medium' :
                                      'text-risk-high border-risk-high'
        }`}>
          {!isReady ? (
            <span className="relative z-10 text-xs animate-pulse">···</span>
          ) : (
            <span className="relative z-10 text-sm">{health}%</span>
          )}
        </div>
      </div>

      {/* Progress / stats */}
      {!isReady ? (
        <div className="space-y-2">
          <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-primary transition-all duration-1000 ${
                phase === 'initializing' ? 'w-1/3' : 'w-2/3'
              }`}
            />
          </div>
          <p className="text-xs text-foreground-muted">
            {phase === 'initializing'
              ? 'Connecting to data sources…'
              : `Scanning ${game.platform} reviews & community feeds…`}
          </p>
          <p className="text-[10px] text-foreground-muted font-mono">
            {game.platform} · App {game.app_id}
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="status-dot bg-risk-low"></div>
              <span className="status-text text-foreground">0 ALERTS</span>
            </div>
            <div className="flex-1 h-px bg-border opacity-50"></div>
            <div className="status-text text-foreground-secondary animate-data-flow">
              {signals} SIG
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="text-center">
              <div className="text-foreground-secondary">CRASH</div>
              <div className="font-mono text-risk-low">0%</div>
            </div>
            <div className="text-center">
              <div className="text-foreground-secondary">PROG</div>
              <div className="font-mono text-risk-low">0%</div>
            </div>
            <div className="text-center">
              <div className="text-foreground-secondary">CONN</div>
              <div className="font-mono text-risk-low">0%</div>
            </div>
            <div className="text-center">
              <div className="text-foreground-secondary">SENT</div>
              <div className="font-mono text-risk-low">—</div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-[10px] text-foreground-muted font-mono">
              {game.platform} · App {game.app_id} · added just now
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Alert type config ────────────────────────────────────
const ALERT_TYPE_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  crash:        { label: 'CRSH', bg: 'bg-red-500/20',    text: 'text-red-400',    dot: 'bg-red-400' },
  progression:  { label: 'PROG', bg: 'bg-amber-500/20',  text: 'text-amber-400',  dot: 'bg-amber-400' },
  connectivity: { label: 'CONN', bg: 'bg-blue-500/20',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  sentiment:    { label: 'SENT', bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
};
const defaultAlertCfg = { label: 'ALRT', bg: 'bg-primary/20', text: 'text-primary', dot: 'bg-primary' };
const getAlertTypeCfg = (t: string) => ALERT_TYPE_CFG[t?.toLowerCase()] ?? defaultAlertCfg;

function AlertsPanel() {
  const [alerts, setAlerts]       = useState<Alert[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await api.fetchAlerts();
      setAlerts(data);
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  // Show top 8 by confidence
  const topAlerts = [...alerts]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);

  return (
    <>
      <div className="mission-control-panel h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-shadow flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-status-new" />
            Live Alerts
          </h2>
          <div className="text-sm text-foreground-secondary">
            {alerts.length} active
          </div>
        </div>

        {/* Compact rows */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-foreground-secondary text-sm">
              No active alerts · All systems nominal
            </div>
          ) : (
            <div className="space-y-0.5 max-h-96 overflow-y-auto custom-scrollbar">
              {topAlerts.map((alert) => {
                const cfg = getAlertTypeCfg(alert.type);
                return (
                  <div
                    key={alert.id}
                    className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-background-tertiary transition-colors cursor-default"
                  >
                    {/* Severity dot */}
                    <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${cfg.dot} ${
                      alert.status === 'new' ? 'animate-pulse' : ''
                    }`} />

                    {/* Type badge */}
                    <span className={`flex-shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>

                    {/* Title + game */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground truncate leading-tight">
                        {alert.title}
                      </div>
                      {alert.game && (
                        <div className="text-[10px] text-foreground-muted truncate leading-tight">
                          {alert.game}
                        </div>
                      )}
                    </div>

                    {/* Confidence */}
                    <span className={`flex-shrink-0 text-[10px] font-mono ${
                      alert.confidence > 0.8 ? 'text-risk-low' :
                      alert.confidence > 0.6 ? 'text-risk-medium' : 'text-risk-high'
                    }`}>
                      {Math.round(alert.confidence * 100)}%
                    </span>

                    {/* Investigate arrow — appears on hover */}
                    <Link
                      href={`/alerts/${alert.id}`}
                      className="flex-shrink-0 text-[11px] text-primary hover:text-primary-light opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium"
                    >
                      →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* View all footer */}
        {alerts.length > 8 && (
          <div className="flex-shrink-0 pt-3 mt-2 border-t border-border">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full text-xs text-primary hover:text-primary-light transition-colors py-1 flex items-center justify-center gap-1"
            >
              View all {alerts.length} alerts →
            </button>
          </div>
        )}
        {alerts.length > 0 && alerts.length <= 8 && (
          <div className="flex-shrink-0 pt-3 mt-2 border-t border-border">
            <button
              onClick={() => setModalOpen(true)}
              className="w-full text-xs text-foreground-muted hover:text-primary transition-colors py-1 flex items-center justify-center gap-1"
            >
              View details ↗
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <AlertsModal alerts={alerts} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}


function SignalTimelinePanel() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSignals = async () => {
      setLoading(true);
      const data = await api.fetchSignals();
      setSignals(data);
      setLoading(false);
    };

    loadSignals();
    
    // Refresh signals every 20 seconds
    const interval = setInterval(loadSignals, 20000);
    return () => clearInterval(interval);
  }, []);

  // Format signals for display
  const timelineData = signals
    .map(signal => ({
      timestamp: signal.timestamp,
      time: new Date(signal.timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      event: signal.message,
      type: signal.type,
      severity: signal.severity,
      source: signal.source,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="mission-control-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-shadow flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Signal Timeline
        </h2>
        <div className="text-xs text-foreground-secondary">
          Last 2 hours
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {timelineData.map((item, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 text-xs font-mono text-foreground-secondary w-12">
              {item.time}
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
              item.severity === 'critical' ? 'bg-risk-critical animate-pulse' :
              item.severity === 'high'     ? 'bg-risk-high' :
              item.severity === 'medium'   ? 'bg-risk-medium' :
              item.severity === 'info'     ? 'bg-primary' :
              'bg-risk-low'
            }`} />
            <div className="flex-1 text-sm min-w-0">
              <span className={`text-foreground ${item.source === 'steam' ? 'text-blue-400' : ''}`}>
                {item.event}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SonarRadarPanel() {
  const [scanAngle, setScanAngle] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScanAngle(prev => (prev + 2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Alert blips на радаре
  const alertBlips = [
    { id: 1, game: 'DDV', alerts: 3, angle: 45, distance: 60, severity: 'high' },
    { id: 2, game: 'Fortnite', alerts: 1, angle: 120, distance: 40, severity: 'medium' },
    { id: 3, game: 'Among Us', alerts: 0, angle: 200, distance: 30, severity: 'low' },
    { id: 4, game: 'OW2', alerts: 2, angle: 300, distance: 70, severity: 'medium' }
  ];

  const getBlipColor = (severity: string, alerts: number) => {
    if (alerts === 0) return 'bg-risk-low';
    if (alerts > 2 || severity === 'high') return 'bg-risk-critical';
    return 'bg-risk-medium';
  };

  const getBlipPosition = (angle: number, distance: number) => {
    const radian = (angle * Math.PI) / 180;
    const x = 50 + (distance * Math.cos(radian)) / 2;
    const y = 50 + (distance * Math.sin(radian)) / 2;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="mission-control-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-shadow flex items-center gap-2">
          ⚡ THREAT RADAR
        </h2>
        <div className="text-xs text-foreground-secondary font-mono">
          SCANNING... {Math.round(scanAngle)}°
        </div>
      </div>
      
      {/* Круглый Сонар */}
      <div className="relative w-full aspect-square max-w-sm mx-auto">
        
        {/* Основной круг радара */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 bg-gradient-radial from-primary/5 to-transparent">
          
          {/* Концентрические круги */}
          <div className="absolute inset-4 rounded-full border border-primary/20"></div>
          <div className="absolute inset-8 rounded-full border border-primary/15"></div>
          <div className="absolute inset-12 rounded-full border border-primary/10"></div>
          
          {/* Центральная точка */}
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          
          {/* Вращающаяся линия сканирования */}
          <div 
            className="absolute top-1/2 left-1/2 w-0.5 bg-gradient-to-t from-primary to-transparent transform-gpu origin-bottom"
            style={{ 
              height: '50%', 
              transform: `translate(-50%, -100%) rotate(${scanAngle}deg)`,
              filter: 'drop-shadow(0 0 4px currentColor)'
            }}
          ></div>
          
          {/* След от сканирования */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{ 
              background: `conic-gradient(from ${scanAngle}deg, transparent 0deg, rgba(59, 130, 246, 0.1) 30deg, transparent 60deg)`,
            }}
          ></div>
          
          {/* Alert Blips */}
          {alertBlips.map((blip) => {
            const position = getBlipPosition(blip.angle, blip.distance);
            const isVisible = Math.abs(scanAngle - blip.angle) < 45 || Math.abs(scanAngle - blip.angle + 360) < 45 || Math.abs(scanAngle - blip.angle - 360) < 45;
            
            return (
              <div
                key={blip.id}
                className={`absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${
                  isVisible ? 'opacity-100' : 'opacity-30'
                } ${getBlipColor(blip.severity, blip.alerts)} group cursor-pointer`}
                style={{ left: position.x, top: position.y }}
              >
                {/* Пульс для критических алертов */}
                {blip.alerts > 2 && (
                  <div className="absolute inset-0 rounded-full bg-risk-critical animate-ping"></div>
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-background-primary border border-border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="font-bold text-foreground">{blip.game}</div>
                  <div className="text-foreground-secondary">{blip.alerts} alerts</div>
                </div>
              </div>
            );
          })}
          
          {/* Координатная сетка */}
          <div className="absolute top-0 left-1/2 text-xs text-primary/60 transform -translate-x-1/2 -translate-y-full">N</div>
          <div className="absolute bottom-0 left-1/2 text-xs text-primary/60 transform -translate-x-1/2 translate-y-full">S</div>
          <div className="absolute left-0 top-1/2 text-xs text-primary/60 transform -translate-x-full -translate-y-1/2">W</div>
          <div className="absolute right-0 top-1/2 text-xs text-primary/60 transform translate-x-full -translate-y-1/2">E</div>
        </div>
      </div>
      
      {/* Radar Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="text-risk-critical font-bold">{alertBlips.filter(b => b.alerts > 2).length}</div>
          <div className="text-foreground-secondary">CRITICAL</div>
        </div>
        <div className="text-center">
          <div className="text-risk-medium font-bold">{alertBlips.filter(b => b.alerts > 0 && b.alerts <= 2).length}</div>
          <div className="text-foreground-secondary">WARNING</div>
        </div>
        <div className="text-center">
          <div className="text-risk-low font-bold">{alertBlips.filter(b => b.alerts === 0).length}</div>
          <div className="text-foreground-secondary">NOMINAL</div>
        </div>
      </div>
    </div>
  );
}

function LiveStreamPanel() {
  const [currentStream, setCurrentStream] = useState(0);
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStreams = async () => {
      setLoading(true);
      const data = await api.fetchStreams();
      if (data.length > 0) {
        setStreams(data.slice(0, 8)); // Top 8 streams
      }
      setLoading(false);
    };

    loadStreams();
    
    // Refresh streams every 2 minutes
    const interval = setInterval(loadStreams, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (streams.length > 0) {
      const interval = setInterval(() => {
        setCurrentStream(prev => (prev + 1) % streams.length);
      }, 8000); // Переключение каждые 8 сек
      return () => clearInterval(interval);
    }
  }, [streams.length]);

  const stream = streams[currentStream];

  if (loading) {
    return (
      <div className="mission-control-panel">
        <div className="flex items-center justify-center py-8">
          <div className="text-foreground-secondary">Loading streams...</div>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="mission-control-panel">
        <div className="flex items-center justify-center py-8">
          <div className="text-foreground-secondary">No live streams available</div>
        </div>
      </div>
    );
  }

  // Thumbnail: YouTube CDN works for both YT and Twitch demo entries
  const thumbUrl = stream.video_id
    ? `https://i.ytimg.com/vi/${stream.video_id}/hqdefault.jpg`
    : null;

  const watchUrl = stream.platform === 'Twitch'
    ? `https://www.twitch.tv/${stream.streamer?.toLowerCase().replace(/\s/g, '')}`
    : stream.video_id
      ? `https://www.youtube.com/watch?v=${stream.video_id}`
      : '#';

  return (
    <div className="mission-control-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-shadow flex items-center gap-2">
          📹 LIVE STREAMS
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-foreground-secondary font-mono">
            {streams.length} ACTIVE
          </span>
        </div>
      </div>

      {/* Thumbnail card — no iframe, no ads */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative rounded-lg overflow-hidden mb-4 aspect-video bg-gray-900 group cursor-pointer"
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={stream.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            {stream.thumbnail || '🎮'}
          </div>
        )}

        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-red-600/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <div className="w-0 h-0 border-l-[18px] border-l-white border-y-[11px] border-y-transparent ml-1" />
          </div>
        </div>

        {/* Live badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-bold text-white">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Viewers */}
        <div className="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs text-white">
          👥 {typeof stream.viewers === 'number' ? stream.viewers.toLocaleString() : stream.viewers}
        </div>

        {/* Platform + Game badges */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="bg-primary/90 px-2 py-0.5 rounded text-xs font-bold text-white">
            {stream.platform}
          </span>
          <span className="bg-black/70 px-2 py-0.5 rounded text-xs text-white truncate max-w-[55%] text-right">
            {stream.game}
          </span>
        </div>
      </a>

      {/* Stream Info */}
      <div className="mb-4">
        <div className="font-bold text-foreground text-sm leading-snug line-clamp-2">{stream.title}</div>
        <div className="text-xs text-foreground-secondary mt-0.5">by {stream.streamer}</div>
      </div>

      {/* Stream Selector — scrollable row, fixed width buttons */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {streams.map((s, index) => (
          <button
            key={s.id}
            onClick={() => setCurrentStream(index)}
            className={`flex-shrink-0 w-20 p-1.5 text-xs rounded border transition-all ${
              currentStream === index
                ? 'border-primary bg-primary/20 text-primary'
                : 'border-border bg-background-tertiary text-foreground-secondary hover:border-primary/50'
            }`}
          >
            <div className="truncate font-medium text-[10px] leading-tight">{s.game.split(' ')[0]}</div>
            <div className="text-[10px] opacity-60 mt-0.5">{typeof s.viewers === 'number' ? s.viewers.toLocaleString() : s.viewers}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const SOURCE_META: Record<string, { icon: string; color: string; label: string }> = {
  steam:   { icon: '⚙️', color: 'border-blue-500',   label: 'Steam Reviews' },
  reddit:  { icon: '🔴', color: 'border-orange-500', label: 'Reddit' },
  twitter: { icon: '🐦', color: 'border-cyan-500',   label: 'Twitter / X' },
};

function SocialMediaFeedsPanel() {
  const [sources, setSources] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.fetchSourcesStatus();
      setSources(data);
    };
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const liveSources = sources.length > 0 ? sources : [
    { platform: 'steam',   name: 'Steam Reviews', status: 'pending', signals_cached: 0, last_signal: '…', activity: 'low' },
    { platform: 'reddit',  name: 'Reddit',        status: 'pending', signals_cached: 0, last_signal: '—', activity: 'offline' },
    { platform: 'twitter', name: 'Twitter / X',   status: 'offline', signals_cached: 0, last_signal: '—', activity: 'offline' },
  ];

  const liveCount = liveSources.filter(s => s.status === 'live').length;

  return (
    <div className="mission-control-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-shadow flex items-center gap-2">
          📡 SOURCE FEEDS
        </h2>
        <div className="text-xs text-foreground-secondary">
          {liveCount}/{liveSources.length} LIVE
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {liveSources.map((feed) => {
          const meta = SOURCE_META[feed.platform] ?? { icon: '📡', color: 'border-border', label: feed.name };
          const isLive = feed.status === 'live';
          const isOffline = feed.status === 'offline';
          return (
            <div
              key={feed.platform}
              className={`relative bg-background-tertiary border ${meta.color} rounded-lg p-3 transition-all group ${isOffline ? 'opacity-50' : ''}`}
            >
              {/* Activity dot */}
              <div className="absolute top-3 right-3">
                <div className={`w-2 h-2 rounded-full ${
                  isOffline            ? 'bg-foreground-muted' :
                  feed.activity === 'high'   ? 'bg-risk-high animate-pulse' :
                  feed.activity === 'medium' ? 'bg-risk-medium' :
                  isLive               ? 'bg-risk-low' :
                                         'bg-risk-medium animate-pulse'
                }`} />
              </div>

              <div className="flex items-center gap-3">
                <div className="text-2xl">{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{meta.label}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-mono ${
                      isLive    ? 'text-risk-low' :
                      isOffline ? 'text-foreground-muted' :
                                  'text-risk-medium'
                    }`}>
                      {feed.status.toUpperCase()}
                    </span>
                    {isLive && (
                      <span className="text-xs text-foreground-secondary">
                        {feed.signals_cached} signals · {feed.last_signal}
                      </span>
                    )}
                    {isOffline && (
                      <span className="text-xs text-foreground-muted">not configured</span>
                    )}
                    {!isLive && !isOffline && (
                      <span className="text-xs text-foreground-muted">loading…</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground-secondary">Feed Status</span>
          <span className={`font-mono ${liveCount > 0 ? 'text-risk-low' : 'text-risk-medium'}`}>
            {liveCount > 0 ? `${liveCount} SOURCE${liveCount > 1 ? 'S' : ''} LIVE` : 'INITIALIZING'}
          </span>
        </div>
      </div>
    </div>
  );
}


export default function Dashboard() {
  const [currentTime, setCurrentTime]   = useState<Date | null>(null);
  const [games, setGames]               = useState<Game[]>([]);
  const [loading, setLoading]           = useState(true);
  const [apiStatus, setApiStatus]       = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [customGames, setCustomGames]   = useState<CustomGame[]>([]);
  const [showAddGame, setShowAddGame]   = useState(false);

  // Load custom games from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_GAMES_KEY);
      if (stored) setCustomGames(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  function handleAddGame(game: CustomGame) {
    setCustomGames(prev => {
      const updated = [...prev, game];
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function handleRemoveGame(id: string) {
    setCustomGames(prev => {
      const updated = prev.filter(g => g.id !== id);
      localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  useEffect(() => {
    // Set initial time on client
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setLoading(true);
        setApiStatus('connecting');
        const data = await api.fetchGames();
        setGames(data);
        setApiStatus('connected');
      } catch (error) {
        console.error('Failed to load games:', error);
        setApiStatus('error');
      } finally {
        setLoading(false);
      }
    };

    loadGames();
    
    // Refresh games data every 60 seconds
    const interval = setInterval(loadGames, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-shadow mb-2">
              FIREFIGHTER
            </h1>
            <p className="text-foreground-secondary">
              Mission Control • QA Intelligence Dashboard
            </p>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <Link href="/" className="text-sm text-primary hover:text-primary-light transition-colors">
                Dashboard
              </Link>
              <Link href="/alerts" className="text-sm text-foreground-secondary hover:text-primary transition-colors">
                Alerts
              </Link>
            </nav>
            <div className="flex items-center gap-6">
              {/* API Status */}
              <div className="text-right">
                <div className="text-sm text-foreground-secondary">API Status</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    apiStatus === 'connected' ? 'bg-risk-low animate-pulse' :
                    apiStatus === 'connecting' ? 'bg-risk-medium animate-pulse' :
                    'bg-risk-critical animate-pulse'
                  }`}></div>
                  <span className={`text-xs font-mono ${
                    apiStatus === 'connected' ? 'text-risk-low' :
                    apiStatus === 'connecting' ? 'text-risk-medium' :
                    'text-risk-critical'
                  }`}>
                    {apiStatus === 'connected' ? 'CONNECTED' :
                     apiStatus === 'connecting' ? 'CONNECTING' :
                     'ERROR'}
                  </span>
                </div>
              </div>
              
              {/* System Time */}
              <div className="text-right">
                <div className="text-sm text-foreground-secondary">System Time</div>
                <div className="text-xl font-mono text-primary">
                  {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* DEFCON Mission Control Grid */}
      <div className="space-y-8">

        {/* Submarine-Style Sonar Radar - TOP SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <SonarRadarPanel />
          </div>
          <div className="lg:col-span-3">
            {/* Game Widgets Grid */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-shadow text-foreground">THREAT ASSESSMENT GRID</h2>
              <div className="flex-1 border-gradient"></div>
              <div className="text-xs font-mono text-primary mr-2">
                {games.filter(g => g.monitoring_active).length + customGames.length}/{games.length + customGames.length} ONLINE
              </div>
              <button
                onClick={() => setShowAddGame(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 hover:border-primary/70 text-primary text-xs font-medium transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Add game
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <GameWidget key={game.id} game={game} />
              ))}
              {customGames.map((game) => (
                <CustomGameWidget key={game.id} game={game} onRemove={handleRemoveGame} />
              ))}
            </div>
          </div>
        </section>

        {/* Command & Control Panels */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Alerts */}
          <div className="lg:col-span-1">
            <AlertsPanel />
          </div>
          
          {/* Signal Timeline */}
          <div className="lg:col-span-1">
            <SignalTimelinePanel />
          </div>
          
          {/* Live Streams */}
          <div className="lg:col-span-1">
            <LiveStreamPanel />
          </div>
          
          {/* Source Feeds */}
          <div className="lg:col-span-1">
            <SocialMediaFeedsPanel />
          </div>
        </section>

      </div>

      {/* Status Bar */}
      <footer className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-background-secondary border border-border rounded-lg">
          <Activity className="h-4 w-4 text-risk-low animate-pulse" />
          <span className="text-sm text-foreground-secondary">
            System Operational • Last Update: {currentTime ? currentTime.toLocaleTimeString() : '--:--:--'}
          </span>
        </div>
      </footer>

      {/* Add Game Modal */}
      {showAddGame && (
        <AddGameModal
          onAdd={handleAddGame}
          onClose={() => setShowAddGame(false)}
        />
      )}
    </div>
  );
}