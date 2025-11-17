'use client';

import { useState, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const router = useRouter();

  const checkLogin = () => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      if (!isLoggedIn) {
        onClick={checkLogin};
        return false;
      }
      return true;
    }
    return false;
  };

  const handleInputFocus = () => {
    checkLogin();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checkLogin() && prompt.trim()) {
      router.push('/builder');
    }
  };

  const handleSuggestion = () => {
    checkLogin();
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-neutral-100 px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-neutral-900 font-bold text-2xl">31Labs</div>
            <span className="text-neutral-500 text-xs">BETA*</span>
          </div>
          <button onClick={() => router.push('/dashboard')} className="bg-[#ff5436] hover:bg-[#ff5436]/90 text-white rounded-full px-4 py-2 h-auto flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Open Agent Studio
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center px-8" style={{ minHeight: 'calc(100vh - 73px)' }}>
        <div className="w-full max-w-3xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2a2a2a] rounded-2xl mb-6 shadow-lg">
              <span className="text-4xl text-[rgb(255,54,23)]">⚡︎</span>
            </div>
            <h1 className="text-neutral-900 mb-3 text-4xl">Start Vibe Selling Today</h1>
            <p className="text-neutral-500 font-medium max-w-[75%] mx-auto text-[14px]">Build all-in-one brand agents that sell, provide customer support, book demos, post on social media and run ad campaigns — with just prompts.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-[#2a2a2a] rounded-3xl p-2 shadow-2xl">
              <div className="flex items-end gap-2">
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onFocus={handleInputFocus} placeholder="Sell anything with your business agent" rows={1} className="flex-1 bg-transparent border-none text-white placeholder:text-neutral-500 px-6 py-4 rounded-2xl resize-none focus:outline-none min-h-[56px] max-h-[200px]" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }}} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                <button type="submit" disabled={!prompt.trim()} className="bg-[#ff5436] hover:bg-[#ff6b52] disabled:bg-neutral-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button onClick={handleSuggestion} className="px-6 py-2 bg-white hover:bg-neutral-50 text-neutral-500 font-medium rounded-full text-sm border border-neutral-200">Build an eCommerce Agent</button>
            <button onClick={handleSuggestion} className="px-6 py-2 bg-white hover:bg-neutral-50 text-neutral-500 font-medium rounded-full text-sm border border-neutral-200">Build Business Page Agent</button>
            <button onClick={handleSuggestion} className="px-6 py-2 bg-white hover:bg-neutral-50 text-neutral-500 font-medium rounded-full text-sm border border-neutral-200">Build Personal Page Agent</button>
          </div>
        </div>
      </div>
    </div>
  );
}