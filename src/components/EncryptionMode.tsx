import React, { useState } from 'react';
import { Shield, Copy, Eye, EyeOff, CheckCircle } from 'lucide-react';

const EncryptionMode: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [algorithm, setAlgorithm] = useState<'AES' | 'RSA'>('AES');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateKey = async (password: string, algorithm: string) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    if (algorithm === 'AES') {
      return window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('salt'),
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }
    return null;
  };

  const encryptAES = async (text: string, password: string) => {
    const encoder = new TextEncoder();
    const key = await generateKey(password, 'AES');
    if (!key) return '';

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  };

  const decryptAES = async (encryptedText: string, password: string) => {
    try {
      const key = await generateKey(password, 'AES');
      if (!key) return '';

      const combined = new Uint8Array(
        atob(encryptedText)
          .split('')
          .map((char) => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      return 'Decryption failed. Please check your password and encrypted text.';
    }
  };

  const handleProcess = async () => {
    if (!inputText || !password) return;

    setIsProcessing(true);
    try {
      let result = '';
      if (algorithm === 'AES') {
        result = mode === 'encrypt' 
          ? await encryptAES(inputText, password)
          : await decryptAES(inputText, password);
      }
      setOutputText(result);
    } catch (error) {
      setOutputText('Error occurred during processing.');
    }
    setIsProcessing(false);
  };

  const copyToClipboard = async () => {
    if (outputText) {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 rounded-xl p-6 border border-blue-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Text Encryption</h2>
        </div>
        <p className="text-slate-300">
          Encrypt or decrypt text using industry-standard algorithms. Your data is processed locally and never leaves your device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mode</label>
              <div className="flex rounded-lg border border-slate-600 bg-slate-700/50">
                <button
                  onClick={() => setMode('encrypt')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-all ${
                    mode === 'encrypt'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Encrypt
                </button>
                <button
                  onClick={() => setMode('decrypt')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg transition-all ${
                    mode === 'decrypt'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Decrypt
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Algorithm</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'AES' | 'RSA')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="AES">AES-256-GCM</option>
                <option value="RSA" disabled>RSA-2048 (Coming Soon)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter encryption password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!inputText || !password || isProcessing}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? 'Processing...' : `${mode === 'encrypt' ? 'Encrypt' : 'Decrypt'} Text`}
            </button>
          </div>
        </div>

        {/* Input/Output */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {mode === 'encrypt' ? 'Plain Text' : 'Encrypted Text'}
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={mode === 'encrypt' ? 'Enter text to encrypt...' : 'Enter encrypted text to decrypt...'}
            />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                {mode === 'encrypt' ? 'Encrypted Text' : 'Decrypted Text'}
              </label>
              {outputText && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all"
                >
                  {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              )}
            </div>
            <textarea
              value={outputText}
              readOnly
              className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
              placeholder="Output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionMode;
