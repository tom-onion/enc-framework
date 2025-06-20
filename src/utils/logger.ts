import { v4 as uuidv4 } from 'uuid';
import { LoginLog, User } from '../types/auth';

export class SecurityLogger {
  private static readonly LOG_STORAGE_KEY = 'cryptoshield_security_logs';
  private static readonly MAX_LOG_ENTRIES = 10000;

  static async logLoginAttempt(
    username: string,
    userId: string | null,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    try {
      const logEntry: LoginLog = {
        id: uuidv4(),
        username,
        userId: userId || 'unknown',
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionId: success ? uuidv4() : 'none',
        loginStatus: success ? 'success' : 'failed',
        failureReason: success ? undefined : failureReason,
        location: await this.getLocationInfo(),
        deviceInfo: this.parseDeviceInfo(navigator.userAgent)
      };

      await this.saveLogEntry(logEntry);
      
      // Also log to console for development
      console.log(`[SECURITY LOG] ${success ? 'SUCCESS' : 'FAILED'} login attempt:`, {
        username,
        timestamp: logEntry.timestamp,
        ip: logEntry.ipAddress,
        reason: failureReason
      });

    } catch (error) {
      console.error('Failed to log login attempt:', error);
      // Fallback logging to ensure we don't lose critical security events
      this.fallbackLog(username, success, failureReason);
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      // In a real application, this would be handled by the backend
      // For demo purposes, we'll simulate getting IP from various sources
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      // Fallback to local IP detection methods
      return this.getLocalIP();
    }
  }

  private static getLocalIP(): string {
    // Simulate local IP detection
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }

  private static async getLocationInfo() {
    try {
      // In production, you'd use a proper geolocation service
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        timezone,
        country: 'Unknown',
        city: 'Unknown'
      };
    } catch {
      return undefined;
    }
  }

  private static parseDeviceInfo(userAgent: string) {
    const browser = this.getBrowserInfo(userAgent);
    const os = this.getOSInfo(userAgent);
    const device = this.getDeviceInfo(userAgent);

    return { browser, os, device };
  }

  private static getBrowserInfo(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private static getOSInfo(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private static getDeviceInfo(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Tablet')) return 'Tablet';
    return 'Desktop';
  }

  private static async saveLogEntry(logEntry: LoginLog): Promise<void> {
    try {
      const existingLogs = this.getStoredLogs();
      const updatedLogs = [logEntry, ...existingLogs];

      // Maintain maximum log entries to prevent storage overflow
      if (updatedLogs.length > this.MAX_LOG_ENTRIES) {
        updatedLogs.splice(this.MAX_LOG_ENTRIES);
      }

      // Store in multiple formats for redundancy
      localStorage.setItem(this.LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
      
      // Also store as CSV for easy export
      this.saveAsCSV(updatedLogs);
      
    } catch (error) {
      console.error('Failed to save log entry:', error);
      throw new Error('Log storage failed');
    }
  }

  private static saveAsCSV(logs: LoginLog[]): void {
    try {
      const csvHeader = 'ID,Username,UserID,IP Address,Timestamp,Session ID,Status,Failure Reason,Browser,OS,Device\n';
      const csvRows = logs.map(log => 
        `"${log.id}","${log.username}","${log.userId}","${log.ipAddress}","${log.timestamp}","${log.sessionId}","${log.loginStatus}","${log.failureReason || ''}","${log.deviceInfo.browser}","${log.deviceInfo.os}","${log.deviceInfo.device}"`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      localStorage.setItem(`${this.LOG_STORAGE_KEY}_csv`, csvContent);
    } catch (error) {
      console.warn('Failed to save CSV format:', error);
    }
  }

  private static fallbackLog(username: string, success: boolean, reason?: string): void {
    const fallbackEntry = {
      timestamp: new Date().toISOString(),
      username,
      success,
      reason,
      userAgent: navigator.userAgent
    };
    
    const fallbackLogs = JSON.parse(localStorage.getItem('cryptoshield_fallback_logs') || '[]');
    fallbackLogs.unshift(fallbackEntry);
    localStorage.setItem('cryptoshield_fallback_logs', JSON.stringify(fallbackLogs.slice(0, 100)));
  }

  static getStoredLogs(): LoginLog[] {
    try {
      const logs = localStorage.getItem(this.LOG_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  static exportLogsAsJSON(): string {
    const logs = this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  static exportLogsAsCSV(): string {
    return localStorage.getItem(`${this.LOG_STORAGE_KEY}_csv`) || '';
  }

  static clearLogs(): void {
    localStorage.removeItem(this.LOG_STORAGE_KEY);
    localStorage.removeItem(`${this.LOG_STORAGE_KEY}_csv`);
    localStorage.removeItem('cryptoshield_fallback_logs');
  }

  static getLogStats() {
    const logs = this.getStoredLogs();
    const totalAttempts = logs.length;
    const successfulLogins = logs.filter(log => log.loginStatus === 'success').length;
    const failedLogins = logs.filter(log => log.loginStatus === 'failed').length;
    
    const uniqueUsers = new Set(logs.map(log => log.username)).size;
    const uniqueIPs = new Set(logs.map(log => log.ipAddress)).size;
    
    const recentActivity = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logTime > oneDayAgo;
    }).length;

    return {
      totalAttempts,
      successfulLogins,
      failedLogins,
      uniqueUsers,
      uniqueIPs,
      recentActivity,
      successRate: totalAttempts > 0 ? (successfulLogins / totalAttempts * 100).toFixed(1) : '0'
    };
  }
}

