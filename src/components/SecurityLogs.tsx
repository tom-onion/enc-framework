import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2, RefreshCw, Calendar, Users, Globe, Activity } from 'lucide-react';
import { SecurityLogger } from '../utils/logger';
import { LoginLog } from '../types/auth';

const SecurityLogs: React.FC = () => {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LoginLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filter, searchTerm]);

  const loadLogs = () => {
    const storedLogs = SecurityLogger.getStoredLogs();
    setLogs(storedLogs);
  };

  const loadStats = () => {
    const logStats = SecurityLogger.getLogStats();
    setStats(logStats);
  };

  const applyFilters = () => {
    let filtered = logs;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(log => log.loginStatus === filter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm) ||
        log.deviceInfo.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.deviceInfo.os.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = (format: 'json' | 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'json') {
      content = SecurityLogger.exportLogsAsJSON();
      filename = `security-logs-${timestamp}.json`;
      mimeType = 'application/json';
    } else {
      content = SecurityLogger.exportLogsAsCSV();
      filename = `security-logs-${timestamp}.csv`;
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all security logs? This action cannot be undone.')) {
      SecurityLogger.clearLogs();
      loadLogs();
      loadStats();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
          Success
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
          Failed
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500/10 to-orange-600/10 rounded-xl p-6 border border-red-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-red-400" />
          <h2 className="text-xl font-semibold text-white">Security Logs</h2>
        </div>
        <p className="text-slate-300">
          Monitor and analyze all login attempts and security events. All data is stored locally and encrypted.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalAttempts || 0}</p>
              <p className="text-sm text-slate-400">Total Attempts</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.successfulLogins || 0}</p>
              <p className="text-sm text-slate-400">Successful Logins</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Globe className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.uniqueIPs || 0}</p>
              <p className="text-sm text-slate-400">Unique IPs</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-orange-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.recentActivity || 0}</p>
              <p className="text-sm text-slate-400">Last 24h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'failed')}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Attempts</option>
                <option value="success">Successful Only</option>
                <option value="failed">Failed Only</option>
              </select>
            </div>
            
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => { loadLogs(); loadStats(); }}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => exportLogs('json')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>JSON</span>
            </button>
            
            <button
              onClick={() => exportLogs('csv')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            
            <button
              onClick={clearLogs}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Device Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Session ID
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No logs found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {log.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(log.loginStatus)}
                      {log.failureReason && (
                        <div className="text-xs text-red-400 mt-1">{log.failureReason}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div>{log.deviceInfo.browser} on {log.deviceInfo.os}</div>
                      <div className="text-xs text-slate-400">{log.deviceInfo.device}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                      {log.sessionId !== 'none' ? log.sessionId.substring(0, 8) + '...' : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredLogs.length > 0 && (
        <div className="text-center text-slate-400 text-sm">
          Showing {filteredLogs.length} of {logs.length} log entries
        </div>
      )}
    </div>
  );
};

export default SecurityLogs;
