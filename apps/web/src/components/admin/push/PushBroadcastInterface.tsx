"use client";

import { useState } from 'react';
import { 
  Bell,
  Users,
  BarChart3,
  Send,
  Eye,
  ChevronDown,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BroadcastTarget {
  id: string;
  label: string;
  enabled: boolean;
  count?: number;
}

interface ModeratorSession {
  userName: string;
  trustScore: string;
  safetyLiftedPercent: number;
  nudityAudioScore: number;
  recentChat: string;
}

export function PushBroadcastInterface() {
  const [activeTab, setActiveTab] = useState<'flaggo-date' | 'redirect-users' | 'jeriep'>('flaggo-date');
  const [targets, setTargets] = useState<BroadcastTarget[]>([
    { id: 'resolved-tags', label: 'Tuge resolved tags', enabled: true },
    { id: 'low-trust', label: 'Low Trust users', enabled: false },
    { id: 'quarantined', label: 'Recently quarantined', enabled: false },
  ]);
  
  const [analyticsProgress, setAnalyticsProgress] = useState(65);
  const [moderatorSession] = useState<ModeratorSession>({
    userName: 'Erenzians Flairs',
    trustScore: 'Level score | Eked 1:1',
    safetyLiftedPercent: 82,
    nudityAudioScore: 25,
    recentChat: 'Seersolan creepy, let\'s meet privately.'
  });

  const toggleTarget = (id: string) => {
    setTargets(targets.map(t => 
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  };

  // Mock chart data for Coming Rate
  const chartData = [
    { time: '9AM', value: 20 },
    { time: '10AM', value: 45 },
    { time: '11AM', value: 60 },
    { time: '12PM', value: 75 },
    { time: '1PM', value: 85 },
    { time: '2PM', value: 95 },
    { time: '3PM', value: 110 },
    { time: '4PM', value: 125 },
    { time: '5PM', value: 145 },
    { time: '6PM', value: 160 },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Left Sidebar - Date/Category Selector */}
      <div className="w-56 bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="space-y-4">
          <button className="w-full rounded-xl bg-slate-700/80 border border-slate-600 p-4 text-left hover:bg-slate-700">
            <h3 className="text-lg font-bold text-white">Parge Date</h3>
            <p className="text-xs text-slate-400 mt-1">61 Gammy</p>
          </button>

          <div className="pt-4 space-y-3 border-t border-slate-700">
            <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
              <Bell size={20} className="text-slate-400" />
            </button>
            <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
              <Users size={20} className="text-slate-400" />
            </button>
            <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
              <BarChart3 size={20} className="text-slate-400" />
            </button>
            <button className="w-full p-2 rounded-lg hover:bg-slate-700/50 flex items-center justify-center">
              <Shield size={20} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Push Broadcast</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white flex items-center gap-2">
                <Eye size={16} />
                Preview
              </button>
              <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm text-slate-900 font-semibold flex items-center gap-2">
                <Send size={16} />
                Send Broadcast
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('flaggo-date')}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'flaggo-date'
                  ? "text-white border-amber-400"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              )}
            >
              Flaggo Date
            </button>
            <button
              onClick={() => setActiveTab('redirect-users')}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'redirect-users'
                  ? "text-white border-amber-400"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              )}
            >
              Redirect Users
            </button>
            <button
              onClick={() => setActiveTab('jeriep')}
              className={cn(
                "px-4 py-3 text-sm font-semibold transition-colors border-b-2",
                activeTab === 'jeriep'
                  ? "text-white border-amber-400"
                  : "text-slate-400 border-transparent hover:text-slate-300"
              )}
            >
              Jeriep
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-6 p-6">
            {/* Left Column - Targeting */}
            <div className="space-y-6">
              {/* Target Flagged Users */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={18} className="text-amber-400" />
                  <h3 className="text-base font-bold text-white">Target Flagged Users</h3>
                </div>
                
                <div className="space-y-3">
                  {targets.map((target) => (
                    <label 
                      key={target.id}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={target.enabled}
                        onChange={() => toggleTarget(target.id)}
                        className="w-4 h-4 rounded border-slate-500 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800"
                      />
                      <span className="text-sm text-slate-200">{target.label}</span>
                      {target.count && (
                        <span className="ml-auto text-xs text-slate-400">{target.count}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* AnalyVACs Section */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
                <h3 className="text-base font-bold text-white mb-4">AnalyVACs</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Out breed mat</span>
                    <span className="text-slate-300">Denmann 98 1.00</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                        style={{ width: `${analyticsProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>0%</span>
                      <span>{analyticsProgress}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm text-slate-900 font-semibold">
                      Regatons
                    </button>
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white">
                      Spaden Eris
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Broadcast Preview */}
            <div className="space-y-6">
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-white">Rust Broadcast Moderation Preview</h3>
                  <button className="text-xs text-amber-400 hover:text-amber-300">
                    Lipertices Urs
                  </button>
                </div>

                {/* CC / Broadcast Options */}
                <div className="flex items-center gap-4 mb-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300">
                    <AlertTriangle size={12} />
                    CC
                  </button>
                  <span className="text-xs text-slate-400">1 hour broadcast command</span>
                  <button className="ml-auto px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white flex items-center gap-1">
                    Volcan <ChevronDown size={12} />
                  </button>
                </div>

                {/* Coming Rate Chart */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-300">Coming Rate</h4>
                    <button className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1">
                      7 Mat <ChevronDown size={12} />
                    </button>
                  </div>

                  {/* Chart */}
                  <div className="relative h-48">
                    <svg className="w-full h-full" viewBox="0 0 400 180">
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100].map((percent) => (
                        <line
                          key={percent}
                          x1="0"
                          y1={180 - (percent * 1.8)}
                          x2="400"
                          y2={180 - (percent * 1.8)}
                          stroke="#334155"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      ))}

                      {/* Line Chart */}
                      <polyline
                        points={chartData.map((d, i) => 
                          `${(i / (chartData.length - 1)) * 380 + 10},${180 - (d.value / maxValue * 160)}`
                        ).join(' ')}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                      />

                      {/* Data points */}
                      {chartData.map((d, i) => (
                        <circle
                          key={i}
                          cx={(i / (chartData.length - 1)) * 380 + 10}
                          cy={180 - (d.value / maxValue * 160)}
                          r="3"
                          fill="#f59e0b"
                        />
                      ))}
                    </svg>

                    {/* X-axis labels */}
                    <div className="flex justify-between mt-2 px-2">
                      {['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6M'].map((time) => (
                        <span key={time} className="text-xs text-slate-500">{time}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Moderator */}
      <div className="w-80 bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h3 className="font-bold text-white">Moderator</h3>
          <button className="p-1 hover:bg-slate-700 rounded">
            <ChevronDown size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-slate-400 mb-3">Reveling Session</h4>
            
            {/* User Info */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                EF
              </div>
              <div className="flex-1">
                <h5 className="font-semibold text-white">{moderatorSession.userName}</h5>
                <p className="text-xs text-slate-400">{moderatorSession.trustScore}</p>
              </div>
              <button className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded">
                <AlertTriangle size={14} className="text-amber-400" />
              </button>
            </div>

            {/* Safety Scores */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-white">Safety lifted</span>
                <span className="ml-auto text-lg font-bold text-green-400">
                  {moderatorSession.safetyLiftedPercent}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-white">Nudity Audio score</span>
                <span className="ml-auto text-lg font-bold text-amber-400">
                  {moderatorSession.nudityAudioScore}%
                </span>
              </div>
            </div>

            {/* Recent Chat */}
            <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300">{moderatorSession.recentChat}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white flex items-center justify-between">
                <span>Solat</span>
                <span className="text-xs text-slate-400">Premelement Osiris</span>
              </button>
              <button className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white">
                Se onguard nac Ogu root
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
