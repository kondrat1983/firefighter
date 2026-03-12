'use client';

import { useState } from 'react';
import { Plus, Settings, Play, Pause, Trash2, ArrowLeft } from 'lucide-react';

export default function GamesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGame, setNewGame] = useState({
    name: '',
    aliases: '',
    patchRelease: ''
  });

  // Mock games data
  const games = [
    {
      id: 1,
      name: 'Disney Dreamlight Valley',
      aliases: ['DDV', 'Dreamlight Valley'],
      monitoring_active: true,
      current_patch_release: '2026-03-06T08:00:00Z',
      signals_today: 247,
      active_alerts: 3,
      health_score: 85
    },
    {
      id: 2,
      name: 'Fortnite',
      aliases: ['Fort', 'FN'],
      monitoring_active: true,
      current_patch_release: null,
      signals_today: 892,
      active_alerts: 1,
      health_score: 92
    },
    {
      id: 3,
      name: 'Among Us',
      aliases: ['AmongUs'],
      monitoring_active: false,
      current_patch_release: null,
      signals_today: 12,
      active_alerts: 0,
      health_score: 95
    }
  ];

  const handleAddGame = () => {
    console.log('Adding game:', newGame);
    setShowAddForm(false);
    setNewGame({ name: '', aliases: '', patchRelease: '' });
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-shadow mb-2">
              Game Management
            </h1>
            <p className="text-foreground-secondary">
              Configure games for monitoring and patch tracking
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Game
          </button>
        </div>
      </header>

      {/* Add Game Form */}
      {showAddForm && (
        <div className="mission-control-panel mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Game</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Game Name *
              </label>
              <input
                type="text"
                value={newGame.name}
                onChange={(e) => setNewGame({...newGame, name: e.target.value})}
                placeholder="Disney Dreamlight Valley"
                className="w-full bg-background-tertiary border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Aliases (comma separated)
              </label>
              <input
                type="text"
                value={newGame.aliases}
                onChange={(e) => setNewGame({...newGame, aliases: e.target.value})}
                placeholder="DDV, Dreamlight Valley"
                className="w-full bg-background-tertiary border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Current Patch Release (optional)
              </label>
              <input
                type="datetime-local"
                value={newGame.patchRelease}
                onChange={(e) => setNewGame({...newGame, patchRelease: e.target.value})}
                className="w-full bg-background-tertiary border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button 
              onClick={handleAddGame}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition-colors"
            >
              Add Game
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="bg-background-tertiary hover:bg-border text-foreground px-4 py-2 rounded font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Games List */}
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="mission-control-panel">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{game.name}</h3>
                  <div className="flex items-center gap-2">
                    {game.monitoring_active ? (
                      <span className="status-indicator bg-risk-low text-white text-xs">
                        MONITORING
                      </span>
                    ) : (
                      <span className="status-indicator bg-gray-600 text-white text-xs">
                        PAUSED
                      </span>
                    )}
                    {game.current_patch_release && (
                      <span className="status-indicator bg-primary text-white text-xs">
                        PATCH WINDOW
                      </span>
                    )}
                  </div>
                </div>
                
                {game.aliases.length > 0 && (
                  <div className="text-sm text-foreground-secondary mb-3">
                    Aliases: {game.aliases.join(', ')}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-foreground-secondary">Signals Today</div>
                    <div className="font-bold text-primary">{game.signals_today}</div>
                  </div>
                  <div>
                    <div className="text-foreground-secondary">Active Alerts</div>
                    <div className={`font-bold ${game.active_alerts > 0 ? 'text-risk-medium' : 'text-risk-low'}`}>
                      {game.active_alerts}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-secondary">Health Score</div>
                    <div className={`font-bold ${
                      game.health_score >= 90 ? 'text-risk-low' :
                      game.health_score >= 70 ? 'text-risk-medium' : 'text-risk-high'
                    }`}>
                      {game.health_score}%
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground-secondary">Last Patch</div>
                    <div className="font-mono text-xs text-foreground">
                      {game.current_patch_release 
                        ? new Date(game.current_patch_release).toLocaleDateString()
                        : 'N/A'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 text-foreground-secondary hover:text-primary transition-colors">
                  <Settings className="h-4 w-4" />
                </button>
                <button className={`p-2 transition-colors ${
                  game.monitoring_active 
                    ? 'text-risk-medium hover:text-risk-high' 
                    : 'text-risk-low hover:text-primary'
                }`}>
                  {game.monitoring_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <button className="p-2 text-foreground-secondary hover:text-risk-high transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-primary">{games.length}</div>
          <div className="text-sm text-foreground-secondary">Total Games</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-risk-low">
            {games.filter(g => g.monitoring_active).length}
          </div>
          <div className="text-sm text-foreground-secondary">Active Monitoring</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-risk-medium">
            {games.reduce((sum, g) => sum + g.active_alerts, 0)}
          </div>
          <div className="text-sm text-foreground-secondary">Total Active Alerts</div>
        </div>
      </div>
    </div>
  );
}