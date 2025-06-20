import React, { useState, useEffect } from 'react';
import { Key, Download, Upload, Plus, Trash2, Copy, CheckCircle } from 'lucide-react';

interface KeyPair {
  id: string;
  name: string;
  algorithm: string;
  created: string;
  publicKey: string;
  privateKey?: string;
}

const KeyManager: React.FC = () => {
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'RSA' | 'ECDSA'>('RSA');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    const savedKeys = localStorage.getItem('cryptoshield_keys');
    if (savedKeys) {
      setKeyPairs(JSON.parse(savedKeys));
    }
  };

  const saveKeys = (keys: KeyPair[]) => {
    localStorage.setItem('cryptoshield_keys', JSON.stringify(keys));
    setKeyPairs(keys);
  };

  const generateKeyPair = async () => {
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    try {
      let keyPair;
      if (selectedAlgorithm === 'RSA') {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256',
          },
          true,
          ['encrypt', 'decrypt']
        );
      } else {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: 'P-256',
          },
          true,
          ['sign', 'verify']
        );
      }

      const publicKey = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKey)));
      const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKey)));

      const newKey: KeyPair = {
        id: crypto.randomUUID(),
        name: newKeyName,
        algorithm: selectedAlgorithm,
        created: new Date().toISOString(),
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      };

      const updatedKeys = [...keyPairs, newKey];
      saveKeys(updatedKeys);
      setNewKeyName('');
    } catch (error) {
      console.error('Key generation failed:', error);
    }
    setIsGenerating(false);
  };

  const deleteKey = (id: string) => {
    const updatedKeys = keyPairs.filter(key => key.id !== id);
    saveKeys(updatedKeys);
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(`${type}`);
    setTimeout(() => setCopied(null), 2000);
  };

  const exportKey = (key: KeyPair) => {
    const keyData = {
      name: key.name,
      algorithm: key.algorithm,
      created: key.created,
      publicKey: key.publicKey,
      privateKey: key.privateKey,
    };

    const blob = new Blob([JSON.stringify(keyData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key.name}_keypair.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-600/10 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <Key className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">Key Management</h2>
        </div>
        <p className="text-slate-300">
          Generate, store, and manage cryptographic key pairs. Keys are stored locally in your browser.
        </p>
      </div>

      {/* Key Generation */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Generate New Key Pair</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Key Name</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., My Personal Key"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Algorithm</label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as 'RSA' | 'ECDSA')}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="RSA">RSA-2048</option>
              <option value="ECDSA">ECDSA-P256</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateKeyPair}
              disabled={!newKeyName.trim() || isGenerating}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <h3 className="text-lg font-medium text-white mb-4">Stored Key Pairs ({keyPairs.length})</h3>
        
        {keyPairs.length === 0 ? (
          <div className="text-center py-8">
            <Key className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No key pairs generated yet</p>
            <p className="text-sm text-slate-500 mt-2">Generate your first key pair to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {keyPairs.map((key) => (
              <div key={key.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium">{key.name}</h4>
                    <p className="text-sm text-slate-400">
                      {key.algorithm} • Created {new Date(key.created).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportKey(key)}
                      className="p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-600 rounded-lg transition-all"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">Public Key</label>
                      <button
                        onClick={() => copyToClipboard(key.publicKey, `${key.name}-public`)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 rounded transition-all"
                      >
                        {copied === `${key.name}-public` ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied === `${key.name}-public` ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono break-all">
                      {key.publicKey.substring(0, 100)}...
                    </div>
                  </div>
                  
                  {key.privateKey && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-slate-300">Private Key</label>
                        <button
                          onClick={() => copyToClipboard(key.privateKey!, `${key.name}-private`)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 rounded transition-all"
                        >
                          {copied === `${key.name}-private` ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copied === `${key.name}-private` ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="bg-slate-800 rounded p-2 text-xs text-slate-300 font-mono break-all">
                        {key.privateKey.substring(0, 100)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeyManager;
