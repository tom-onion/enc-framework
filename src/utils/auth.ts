import { v4 as uuidv4 } from 'uuid';
import { User, LoginAttempt, Session } from '../types/auth';
import { SecurityLogger } from './logger';

export class AuthManager {
  private static readonly USERS_STORAGE_KEY = 'cryptoshield_users';
  private static readonly SESSIONS_STORAGE_KEY = 'cryptoshield_sessions';
  private static readonly CURRENT_SESSION_KEY = 'cryptoshield_current_session';
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  static initializeDefaultUsers(): void {
    const existingUsers = this.getStoredUsers();
    if (existingUsers.length === 0) {
      const defaultUsers: User[] = [
        {
          id: uuidv4(),
          username: 'admin',
          email: 'admin@cryptoshield.com',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: uuidv4(),
          username: 'demo',
          email: 'demo@cryptoshield.com',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
  }

  static async login(credentials: LoginAttempt): Promise<{ success: boolean; user?: User; session?: Session; error?: string }> {
    try {
      const users = this.getStoredUsers();
      const user = users.find(u => u.username === credentials.username);

      if (!user) {
        await SecurityLogger.logLoginAttempt(credentials.username, null, false, 'User not found');
        return { success: false, error: 'Invalid username or password' };
      }

      // In a real application, you'd hash and compare passwords
      // For demo purposes, we'll use simple password validation
      const validPasswords: Record<string, string> = {
        'admin': 'admin123',
        'demo': 'demo123'
      };

      if (validPasswords[credentials.username] !== credentials.password) {
        await SecurityLogger.logLoginAttempt(credentials.username, user.id, false, 'Invalid password');
        return { success: false, error: 'Invalid username or password' };
      }

      // Create session
      const session = this.createSession(user);
      
      // Update user's last login
      user.lastLogin = new Date().toISOString();
      this.updateUser(user);

      // Log successful login
      await SecurityLogger.logLoginAttempt(credentials.username, user.id, true);

      return { success: true, user, session };

    } catch (error) {
      console.error('Login error:', error);
      await SecurityLogger.logLoginAttempt(credentials.username, null, false, 'System error');
      return { success: false, error: 'Login failed due to system error' };
    }
  }

  static logout(): void {
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      this.invalidateSession(currentSession.id);
    }
    localStorage.removeItem(this.CURRENT_SESSION_KEY);
  }

  static getCurrentUser(): User | null {
    const session = this.getCurrentSession();
    if (!session || !this.isSessionValid(session)) {
      return null;
    }

    const users = this.getStoredUsers();
    return users.find(u => u.id === session.userId) || null;
  }

  static getCurrentSession(): Session | null {
    try {
      const sessionData = localStorage.getItem(this.CURRENT_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    return session ? this.isSessionValid(session) : false;
  }

  private static createSession(user: User): Session {
    const session: Session = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.SESSION_DURATION).toISOString(),
      ipAddress: 'localhost', // Would be actual IP in production
      isActive: true
    };

    // Store session
    const sessions = this.getStoredSessions();
    sessions.push(session);
    localStorage.setItem(this.SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    localStorage.setItem(this.CURRENT_SESSION_KEY, JSON.stringify(session));

    return session;
  }

  private static isSessionValid(session: Session): boolean {
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    return session.isActive && now < expiresAt;
  }

  private static invalidateSession(sessionId: string): void {
    const sessions = this.getStoredSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].isActive = false;
      localStorage.setItem(this.SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    }
  }

  private static getStoredUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_STORAGE_KEY);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  private static getStoredSessions(): Session[] {
    try {
      const sessions = localStorage.getItem(this.SESSIONS_STORAGE_KEY);
      return sessions ? JSON.parse(sessions) : [];
    } catch {
      return [];
    }
  }

  private static updateUser(user: User): void {
    const users = this.getStoredUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = user;
      localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }

  static getAllSessions(): Session[] {
    return this.getStoredSessions().filter(s => s.isActive);
  }

  static cleanupExpiredSessions(): void {
    const sessions = this.getStoredSessions();
    const activeSessions = sessions.filter(s => this.isSessionValid(s));
    localStorage.setItem(this.SESSIONS_STORAGE_KEY, JSON.stringify(activeSessions));
  }
}
