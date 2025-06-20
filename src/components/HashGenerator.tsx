import React, { useState } from 'react';
import { Hash, Copy, CheckCircle, FileText, Type } from 'lucide-react';

const HashGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [isProcessing, setIsProcessing] = useState(false);

  const algorithms = [
    { name: 'SHA-1', value: 'SHA-1' },
    { name: 'SHA-256', value: 'SHA-256' },
    { name: 'SHA-384', value: 'SHA-384' },
    { name: 'SHA-512', value: 'SHA-512' },
  ];

  const generateHashes = async (data: ArrayBuffer) => {
    setIsProcessing(true);
    const newHashes: Record<string, string> = {};

    for (const algorithm of algorithms) {
      try {
        const hashBuffer = await window.crypto.subtle.digest(algorithm.value, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        newHashes[algorithm.value] = hashHex;
      } catch (error) {
        newHashes[algorithm.value] = 'Error generating hash';
      }
    }

    setHashes(newHashes);
    setIsProcessing(false);
  };

  const handleTextHash = async () => {
    if (!inputText) return;
    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);
    await generateHashes(data);
  };

  const handleFileHash = async () => {
    if (!inputFile) return;
    const data = await inputFile.arrayBuffer();
    await generateHashes(data);
  };

  const copyToClipboard = async (text: string, algorithm: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(algorithm);
    setTimeout(() => setCopied(null), 2000);
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
      <div className="bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-xl p-6 border border-orange-500/20">
        <div className="flex items-center space-x-3 mb-4">
          <Hash className="h-6 w-6 text-orange-400" />
          <h2 className="text-xl font-semibold text-white">Hash Generator</h2>
        </div>
        <p className="text-slate-300">
          Generate cryptographic hashes for text or files using various algorithms. Perfect for data integrity verification.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Input</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Input Type</label>
                <div className="flex rounded-lg border border-slate-600 bg-slate-700/50">
                  <button
                    onClick={() => setInputMode('text')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-lg transition-all flex items-center justify-center space-x-2 ${
                      inputMode === 'text'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Type className="h-4 w-4" />
                    <span>Text</span>
                  </button>
                  <button
                    onClick={() => setInputMode('file')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-lg transition-all flex items-center justify-center space-x-2 ${
                      inputMode === 'file'
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>File</span>
                  </button>
                </div>
              </div>

              {inputMode === 'text' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Text to Hash</label>
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    placeholder="Enter text to hash..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">File to Hash</label>
                  <input
                    type="file"
                    onChange={(e) => setInputFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-600 file:text-white hover:file:bg-orange-700"
                  />
                  {inputFile && (
                    <div className="mt-2 p-3 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Name:</span>
                        <span className="text-white font-mono">{inputFile.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-slate-300">Size:</span>
                        <span className="text-white">{formatFileSize(inputFile.size)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={inputMode === 'text' ? handleTextHash : handleFileHash}
                disabled={(!inputText && inputMode === 'text') || (!inputFile && inputMode === 'file') || isProcessing}
                className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white font-medium rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Hash className="h-4 w-4" />
                <span>{isProcessing ? 'Generating...' : 'Generate Hashes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-medium text-white mb-4">Hash Results</h3>
          
          {Object.keys(hashes).length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No hashes generated yet</p>
              <p className="text-sm text-slate-500 mt-2">Enter text or select a file to generate hashes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {algorithms.map((algorithm) => {
                const hash = hashes[algorithm.value];
                if (!hash) return null;

                return (
                  <div key={algorithm.value} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">{algorithm.name}</label>
                      <button
                        onClick={() => copyToClipboard(hash, algorithm.value)}
                        className="flex items-center space-x-1 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 rounded transition-all"
                      >
                        {copied === algorithm.value ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied === algorithm.value ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="bg-slate-800 rounded p-3 text-xs text-slate-300 font-mono break-all">
                      {hash}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashGenerator;
