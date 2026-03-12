'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Clock, Filter } from 'lucide-react';

export default function AlertsPage() {
  const [filter, setFilter] = useState('all');

  // Mock alerts data
  const alerts = [
    {
      id: 123,
      game: 'Disney Dreamlight Valley',
      type: 'progression',
      status: 'new',
      confidence: 0.84,
      mention_count: 15,
      source_count: 3,
      triggered_at: '2026-03-06T09:25:00Z',
      title: 'Cannot pick up Saucery Extract in Jailbreak quest'
    },
    {
      id: 124,
      game: 'Disney Dreamlight Valley',
      type: 'crash',
      status: 'investigating',
      confidence: 0.92,
      mention_count: 8,
      source_count: 2,
      triggered_at: '2026-03-06T10:15:00Z',
      title: 'Game crashes when entering Castle area'
    },
    {
      id: 125,
      game: 'Disney Dreamlight Valley',
      type: 'connectivity',
      status: 'new',
      confidence: 0.76,
      mention_count: 12,
      source_count: 2,
      triggered_at: '2026-03-06T11:02:00Z',
      title: 'Multiplayer connection issues after patch'
    },
    {
      id: 126,
      game: 'Fortnite',
      type: 'connectivity',
      status: 'confirmed',
      confidence: 0.89,
      mention_count: 45,
      source_count: 4,
      triggered_at: '2026-03-06T08:30:00Z',
      title: 'Login servers experiencing high latency'
    },
    {
      id: 127,
      game: 'Overwatch 2',
      type: 'exploit',
      status: 'investigating',
      confidence: 0.67,
      mention_count: 23,
      source_count: 3,
      triggered_at: '2026-03-06T07:45:00Z',
      title: 'Potential wallhack exploit in competitive mode'
    }
  ];

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-status-new';
      case 'investigating': return 'bg-status-investigating';
      case 'confirmed': return 'bg-status-confirmed';
      default: return 'bg-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'crash': return 'text-risk-critical';
      case 'progression': return 'text-risk-high';
      case 'connectivity': return 'text-risk-medium';
      case 'exploit': return 'text-risk-high';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-shadow mb-2">
              ALERT CENTER
            </h1>
            <p className="text-foreground-secondary">
              Mission Control • Active Threat Assessment
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-foreground-secondary" />
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className="bg-background-secondary border border-border rounded px-3 py-1 text-sm text-foreground"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </div>
            <div className="text-right">
              <div className="text-sm text-foreground-secondary">Active Alerts</div>
              <div className="text-xl font-bold text-primary">
                {filteredAlerts.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Link 
            key={alert.id}
            href={`/alerts/${alert.id}`}
            className="block"
          >
            <div className="mission-control-panel hover:border-primary/50 transition-all cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header Row */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`status-indicator ${getStatusColor(alert.status)} text-white`}>
                      {alert.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-mono text-foreground-secondary">
                      #{alert.id}
                    </span>
                    <span className={`text-sm font-medium ${getTypeColor(alert.type)}`}>
                      {alert.type.toUpperCase()}
                    </span>
                    <span className="text-sm text-foreground-secondary">
                      {alert.game}
                    </span>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-2 text-xs text-foreground-muted">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.triggered_at).toLocaleString()}
                    </div>
                  </div>

                  {/* Alert Title */}
                  <h3 className="text-lg font-medium text-foreground mb-3">
                    {alert.title}
                  </h3>

                  {/* Metrics Row */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-foreground-secondary">
                        {alert.mention_count} mentions
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-risk-medium rounded-full"></div>
                      <span className="text-foreground-secondary">
                        {alert.source_count} sources
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.confidence > 0.8 ? 'bg-risk-low' :
                        alert.confidence > 0.6 ? 'bg-risk-medium' : 'bg-risk-high'
                      }`}></div>
                      <span className="text-foreground-secondary">
                        {Math.round(alert.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Summary Stats */}
      <footer className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-primary">
            {alerts.length}
          </div>
          <div className="text-sm text-foreground-secondary">Total Alerts</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-status-new">
            {alerts.filter(a => a.status === 'new').length}
          </div>
          <div className="text-sm text-foreground-secondary">New</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-status-investigating">
            {alerts.filter(a => a.status === 'investigating').length}
          </div>
          <div className="text-sm text-foreground-secondary">Investigating</div>
        </div>
        <div className="mission-control-panel text-center">
          <div className="text-2xl font-bold text-status-confirmed">
            {alerts.filter(a => a.status === 'confirmed').length}
          </div>
          <div className="text-sm text-foreground-secondary">Confirmed</div>
        </div>
      </footer>
    </div>
  );
}