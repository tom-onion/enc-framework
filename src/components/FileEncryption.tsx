import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, Lock, Unlock, AlertCircle } from 'lucide-react';

const FileEncryption: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ data: ArrayBuffer; filename: string; type: string } | null>(null);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateKey = async (password: string) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('cryptoshield-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  };

  const encryptFile = async (fileData: ArrayBuffer, password: string) => {
    const key = await generateKey(password);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileData
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return combined.buffer;
  };

  const decryptFile = async (encryptedData: ArrayBuffer, password: string) => {
    try {
      const key = await generateKey(password);
      const combined = new Uint8Array(encryptedData);
      
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed. Please check your password.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const processFile = async () => {
    if (!file || !password) return;

    setIsProcessing(true);
    try {
      const fileData = await file.arrayBuffer();
      
      let processedData: ArrayBuffer;
      let filename: string;
      
      if (mode === 'encrypt') {
        processedData = await encryptFile(fileData, password);
        filename = `${file.name}.encrypted`;
      } else {
        processedData = await decryptFile(fileData, password);
        filename = file.name.replace('.encrypted', '');
      }

      setResult({
        data: processedData,
        filename,
        type: mode === 'encrypt' ? 'application/octet-stream' : file.type
      });
    } catch (error) {
      console.error('File processing failed:', error);
      alert(error instanceof Error ? error.message : 'Processing failed');
    }
    setIsProcessing(false);
  };

  const downloadResult = () => {
    if (!result) return;

    const blob = new Blob([result.data], { type: result.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setPassword('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500/10 to-blue-600/10 rounded-xl p-6 border border-green-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-semibold text-white">File Encryption</h2>
        </div>
        <p className="text-slate-300">
          Encrypt or decrypt files using AES-256 encryption. Files are processed locally and never uploaded to any server.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mode</label>
                <div className="flex rounded-lg border border-slate-600 bg-slate-700/50">
                  <button
                    onClick={() => {setMode('encrypt'); resetForm();}}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-all flex items-center justify-center space-x-2 ${
                      mode === 'encrypt'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                    <span>Encrypt</span>
                  </button>
                  <button
                    onClick={() => {setMode('decrypt'); resetForm();}}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg transition-all flex items-center justify-center space-x-2 ${
                      mode === 'decrypt'
                        ? 'bg-green-600 text-white'
                        : 'text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Unlock className="h-4 w-4" />
                    <span>Decrypt</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter encryption password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {mode === 'encrypt' ? 'File to Encrypt' : 'Encrypted File'}
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={mode === 'decrypt' ? '.encrypted' : '*'}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-600 file:text-white hover:file:bg-green-700"
                  />
                </div>
              </div>

              <button
                onClick={processFile}
                disabled={!file || !password || isProcessing}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {mode === 'encrypt' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                <span>
                  {isProcessing 
                    ? 'Processing...' 
                    : `${mode === 'encrypt' ? 'Encrypt' : 'Decrypt'} File`
                  }
                </span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium text-sm">Security Notice</h4>
                <p className="text-amber-300/80 text-sm mt-1">
                  Files are processed entirely in your browser. No data is transmitted to external servers.
                  Use strong passwords for maximum security.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Info & Results */}
        <div className="space-y-6">
          {file && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-medium text-white mb-4">File Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Name:</span>
                  <span className="text-white font-mono text-sm">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Size:</span>
                  <span className="text-white">{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Type:</span>
                  <span className="text-white">{file.type || 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="text-lg font-medium text-white mb-4">
                {mode === 'encrypt' ? 'Encryption Complete' : 'Decryption Complete'}
              </h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Output File:</span>
                    <span className="text-white font-mono text-sm">{result.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Size:</span>
                    <span className="text-white">{formatFileSize(result.data.byteLength)}</span>
                  </div>
                </div>
                
                <button
                  onClick={downloadResult}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download {mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} File</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEncryption;
