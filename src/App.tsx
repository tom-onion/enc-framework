import React, { useState, useEffect } from 'react';
import { Shield, Key, Lock, Hash, FileText, Download, Upload, LogOut, Activity } from 'lucide-react';
import EncryptionMode from './components/EncryptionMode';
import KeyManager from './components/KeyManager';
import FileEncryption from './components/FileEncryption';
import HashGenerator from './components/HashGenerator';
import SecurityLogs from './components/SecurityLogs';
import LoginForm from './components/LoginForm';
import { AuthManager } from './utils/auth';
import { User } from './types/auth';

function App() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Initialize default users and check authentication
    AuthManager.initializeDefaultUsers();
    AuthManager.cleanupExpiredSessions();
    
    const user = AuthManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    const user = AuthManager.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    AuthManager.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('encrypt');
  };

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  const tabs = [
    { id: 'encrypt', label: 'Encryption', icon: Lock },
    { id: 'keys', label: 'Key Management', icon: Key },
    { id: 'files', label: 'File Encryption', icon: FileText },
    { id: 'hash', label: 'Hash Generator', icon: Hash },
    { id: 'logs', label: 'Security Logs', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CryptoShield</h1>
                <p className="text-sm text-slate-400">Advanced Encryption Framework</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Secure
                </div>
                <span className="text-slate-300 text-sm">
                  Welcome, <span className="font-medium text-white">{currentUser?.username}</span>
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-3 border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'encrypt' && <EncryptionMode />}
        {activeTab === 'keys' && <KeyManager />}
        {activeTab === 'files' && <FileEncryption />}
        {activeTab === 'hash' && <HashGenerator />}
        {activeTab === 'logs' && <SecurityLogs />}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              © 2025 CryptoShield. Built with Web Crypto API for maximum security.
            </p>
            <div className="flex items-center space-x-4 text-slate-400 text-sm">
              <span>AES-256 • RSA-2048 • SHA-256</span>
              <span>•</span>
              <span>Session: {AuthManager.getCurrentSession()?.id.substring(0, 8)}...</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
