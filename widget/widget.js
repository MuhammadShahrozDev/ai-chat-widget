/**
 * AI Chat Widget v2.2 — Techxaone
 * Auto language detection, no dropdown
 */

(function() {
    'use strict';
    
    const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    const API_URL = window.AI_CHAT_API 
        || (script ? new URL(script.src).origin : 'http://localhost:8000');
    
    const CONFIG = {
        title: window.AI_CHAT_TITLE || 'Techxaone Support',
        greeting: window.AI_CHAT_GREETING || 'Hi! 👋 How may I help you today?',
        color: window.AI_CHAT_COLOR || '#0d9488',
        accent: window.AI_CHAT_ACCENT || '#f59e0b',
        botName: window.AI_CHAT_BOT_NAME || 'Techxaone',
        voiceEnabled: window.AI_CHAT_VOICE !== false,
        defaultLang: window.AI_CHAT_LANG || 'en-US',
    };
    
    // ============ CREATE HOST ============
    const host = document.createElement('div');
    host.id = 'aichat-widget-host';
    host.style.cssText = 'all:initial;position:fixed;bottom:0;right:0;z-index:2147483647;';
    document.body.appendChild(host);
    
    const shadow = host.attachShadow({ mode: 'open' });
    
    // ============ STYLES + HTML ============
    shadow.innerHTML = `
    <style>
        :host, * { box-sizing: border-box; }
        
        .aichat-root {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            position: fixed;
            bottom: 24px;
            right: 24px;
        }
        
        .aichat-toggle {
            width: 60px; height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 24px rgba(13, 148, 136, 0.45);
            transition: transform 0.25s ease;
            position: relative; padding: 0; outline: none;
        }
        .aichat-toggle:hover { transform: scale(1.08); }
        .aichat-toggle svg { width: 26px; height: 26px; position: relative; z-index: 1; }
        .aichat-toggle::before {
            content: '';
            position: absolute; inset: 0; border-radius: 50%;
            background: ${CONFIG.accent}; opacity: 0.5;
            animation: aichat-pulse 2.2s ease-out infinite;
        }
        @keyframes aichat-pulse {
            0% { opacity: 0.4; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        .aichat-icon-close { display: none; }
        .aichat-open .aichat-icon-chat { display: none; }
        .aichat-open .aichat-icon-close { display: block; }
        
        .aichat-panel {
            position: absolute;
            bottom: 80px; right: 0;
            width: 400px; height: 640px;
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
            display: flex; flex-direction: column;
            overflow: hidden;
            opacity: 0; transform: translateY(20px) scale(0.94);
            pointer-events: none;
            transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.4,0,0.2,1);
            transform-origin: bottom right;
        }
        .aichat-open .aichat-panel {
            opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
        }
        
        .aichat-header {
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white; padding: 16px 20px;
            display: flex; align-items: center; gap: 12px;
            flex-shrink: 0;
        }
        .aichat-avatar {
            width: 40px; height: 40px; border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .aichat-avatar svg { width: 22px; height: 22px; }
        .aichat-header-text { flex: 1; min-width: 0; }
        .aichat-title {
            font-weight: 600; font-size: 15px; margin-bottom: 3px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .aichat-status {
            font-size: 12px; opacity: 0.92;
            display: flex; align-items: center; gap: 6px;
        }
        .aichat-dot {
            width: 8px; height: 8px; background: #4ade80;
            border-radius: 50%; box-shadow: 0 0 8px #4ade80;
        }
        
        .aichat-messages {
            flex: 1; overflow-y: auto; padding: 20px;
            background: #f8fafc;
            display: flex; flex-direction: column; gap: 12px;
        }
        .aichat-messages::-webkit-scrollbar { width: 6px; }
        .aichat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        
        .aichat-msg { display: flex; max-width: 88%; animation: aichat-fade 0.3s ease; }
        @keyframes aichat-fade {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .aichat-msg-bot { align-self: flex-start; }
        .aichat-msg-user { align-self: flex-end; }
        
        .aichat-bubble {
            padding: 11px 15px; border-radius: 16px;
            word-wrap: break-word; white-space: pre-wrap;
            font-size: 14px; line-height: 1.5;
        }
        .aichat-msg-bot .aichat-bubble {
            background: #ffffff; color: #0f172a;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .aichat-msg-user .aichat-bubble {
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white; border-bottom-right-radius: 4px;
            box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
        }
        
        .aichat-speak-btn {
            background: transparent; border: none;
            color: #0d9488; cursor: pointer;
            padding: 4px; margin-top: 4px;
            display: inline-flex; align-items: center; gap: 3px;
            opacity: 0.7;
            transition: opacity 0.2s;
            font-size: 11px;
            font-weight: 500;
        }
        .aichat-speak-btn:hover { opacity: 1; }
        .aichat-speak-btn svg { width: 14px; height: 14px; }
        .aichat-speak-btn.aichat-speaking { opacity: 1; color: #dc2626; }
        .aichat-speak-btn.aichat-paused { opacity: 1; color: #f59e0b; }
        
        .aichat-typing { display: flex; gap: 4px; padding: 14px 18px; }
        .aichat-typing span {
            width: 8px; height: 8px; background: #94a3b8;
            border-radius: 50%; animation: aichat-bounce 1.4s infinite ease-in-out;
        }
        .aichat-typing span:nth-child(1) { animation-delay: -0.32s; }
        .aichat-typing span:nth-child(2) { animation-delay: -0.16s; }
        .aichat-typing span:nth-child(3) { animation-delay: 0s; }
        @keyframes aichat-bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }
        
        .aichat-input-area {
            display: flex; gap: 8px; padding: 12px 16px;
            background: #ffffff; border-top: 1px solid #e2e8f0;
            align-items: flex-end; flex-shrink: 0;
        }
        .aichat-input {
            flex: 1;
            border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 10px 14px; font-size: 14px; font-family: inherit;
            resize: none; outline: none; max-height: 100px;
            transition: border-color 0.2s;
            line-height: 1.4; color: #0f172a; background: #ffffff;
        }
        .aichat-input:focus { border-color: ${CONFIG.color}; box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12); }
        .aichat-input::placeholder { color: #94a3b8; }
        
        .aichat-btn {
            width: 40px; height: 40px; border-radius: 10px;
            background: ${CONFIG.color}; color: white;
            border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0; transition: all 0.2s; padding: 0;
        }
        .aichat-btn:hover { background: #0f766e; transform: scale(1.05); }
        .aichat-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .aichat-btn svg { width: 18px; height: 18px; }
        
        .aichat-mic {
            background: #f1f5f9; color: #64748b;
            border: 1px solid #e2e8f0;
        }
        .aichat-mic:hover { background: #e2e8f0; color: #475569; }
        .aichat-mic.aichat-listening {
            background: #ef4444; color: white;
            animation: aichat-mic-pulse 1.4s ease-out infinite;
        }
        @keyframes aichat-mic-pulse {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
            100% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        }
        
        .aichat-footer {
            text-align: center; padding: 8px;
            font-size: 11px; color: #64748b;
            background: #ffffff; border-top: 1px solid #e2e8f0;
            flex-shrink: 0;
        }
        .aichat-footer strong { color: ${CONFIG.color}; }
        
        @media (max-width: 480px) {
            .aichat-root { bottom: 16px; right: 16px; }
            .aichat-panel {
                width: calc(100vw - 32px);
                height: calc(100vh - 120px);
                max-height: 640px;
            }
            .aichat-toggle { width: 56px; height: 56px; }
        }
    </style>
    
    <div class="aichat-root">
        <button class="aichat-toggle" aria-label="Open chat">
            <svg class="aichat-icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg class="aichat-icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        
        <div class="aichat-panel">
            <div class="aichat-header">
                <div class="aichat-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                    </svg>
                </div>
                <div class="aichat-header-text">
                    <div class="aichat-title">${CONFIG.title}</div>
                    <div class="aichat-status">
                        <span class="aichat-dot"></span> Online
                    </div>
                </div>
            </div>
            
            <div class="aichat-messages"></div>
            
            <div class="aichat-input-area">
                <textarea class="aichat-input" placeholder="Type your message..." rows="1"></textarea>
                ${CONFIG.voiceEnabled ? `
                <button class="aichat-btn aichat-mic" aria-label="Voice input" title="Click to speak">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                </button>
                ` : ''}
                <button class="aichat-btn aichat-send" aria-label="Send">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
            
            <div class="aichat-footer">
                Powered by <strong>${CONFIG.botName}</strong>
            </div>
        </div>
    </div>
    `;
    
    // ============ ELEMENTS ============
    const root = shadow.querySelector('.aichat-root');
    const toggle = shadow.querySelector('.aichat-toggle');
    const messages = shadow.querySelector('.aichat-messages');
    const input = shadow.querySelector('.aichat-input');
    const sendBtn = shadow.querySelector('.aichat-send');
    const micBtn = shadow.querySelector('.aichat-mic');
    
    // ============ STATE ============
    let isOpen = false;
    let sessionId = null;
    let isTyping = false;
    let hasGreeted = false;
    let recognition = null;
    let isListening = false;
    let lastDetectedLang = CONFIG.defaultLang;
    
    let currentSpeakBtn = null;
    let currentUtterance = null;
    let isPaused = false;
    
    // ============ LANGUAGE AUTO-DETECTION ============
    function detectLanguage(text) {
        if (!text) return 'en-US';
        
        // Arabic / Urdu range
        if (/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text)) {
            return 'ur-PK';
        }
        // Devanagari (Hindi)
        if (/[\u0900-\u097F]/.test(text)) {
            return 'hi-IN';
        }
        // Chinese
        if (/[\u4E00-\u9FFF]/.test(text)) {
            return 'zh-CN';
        }
        // Japanese
        if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
            return 'ja-JP';
        }
        // Korean
        if (/[\uAC00-\uD7AF]/.test(text)) {
            return 'ko-KR';
        }
        // Russian / Cyrillic
        if (/[\u0400-\u04FF]/.test(text)) {
            return 'ru-RU';
        }
        // Spanish
        if (/[áéíóúñ¿¡]/i.test(text)) {
            return 'es-ES';
        }
        // French
        if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) {
            return 'fr-FR';
        }
        // Default: English
        return 'en-US';
    }
    
    // ============ VOICE ICONS ============
    const ICONS = {
        speaker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
        pause: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>`,
        play: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`
    };
    
    const LABELS = { speaker: 'Listen', pause: 'Pause', play: 'Resume' };
    
    function updateSpeakBtn(btn, state) {
        if (!btn) return;
        btn.innerHTML = ICONS[state] + `<span>${LABELS[state]}</span>`;
        btn.className = 'aichat-speak-btn';
        if (state === 'pause') btn.classList.add('aichat-speaking');
        if (state === 'play') btn.classList.add('aichat-paused');
        btn.title = LABELS[state];
    }
    
    function resetSpeakBtn(btn) {
        if (!btn) return;
        updateSpeakBtn(btn, 'speaker');
    }
    
    // ============ VOICES LOADING ============
    let voicesCache = [];
    
    function loadVoices() {
        return new Promise((resolve) => {
            if (typeof window.speechSynthesis === 'undefined') { resolve([]); return; }
            let v = window.speechSynthesis.getVoices();
            if (v.length) { voicesCache = v; resolve(v); return; }
            window.speechSynthesis.onvoiceschanged = () => {
                v = window.speechSynthesis.getVoices();
                voicesCache = v;
                resolve(v);
            };
            setTimeout(() => {
                if (!voicesCache.length) {
                    voicesCache = window.speechSynthesis.getVoices();
                    resolve(voicesCache);
                }
            }, 1500);
        });
    }
    
    function findVoice(voices, lang) {
        const code = lang.split('-')[0].toLowerCase();
        const full = lang.toLowerCase().replace('_', '-');
        
        let v = voices.find(x => x.lang.toLowerCase() === full);
        if (v) return v;
        v = voices.find(x => x.lang.toLowerCase().startsWith(code + '-'));
        if (v) return v;
        v = voices.find(x => x.lang.toLowerCase().startsWith(code));
        if (v) return v;
        
        // Fallbacks
        if (code === 'ur') {
            v = voices.find(x => x.lang.toLowerCase().startsWith('hi'));
            if (v) return v;
        }
        if (code === 'ur' || code === 'hi') {
            v = voices.find(x => x.lang.toLowerCase() === 'en-in');
            if (v) return v;
        }
        return null;
    }
    
    // ============ SPEAK WITH PAUSE/RESUME ============
    async function speak(text, btn) {
        if (!('speechSynthesis' in window)) {
            alert('Voice output is not supported on this browser.');
            return;
        }
        
        // Same button → pause/resume/stop
        if (currentSpeakBtn === btn) {
            if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
                window.speechSynthesis.pause();
                isPaused = true;
                updateSpeakBtn(btn, 'play');
                return;
            }
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
                isPaused = false;
                updateSpeakBtn(btn, 'pause');
                return;
            }
            window.speechSynthesis.cancel();
            resetSpeakBtn(btn);
            currentSpeakBtn = null;
            currentUtterance = null;
            isPaused = false;
            return;
        }
        
        // Different button → stop old, start new
        if (currentSpeakBtn) {
            window.speechSynthesis.cancel();
            resetSpeakBtn(currentSpeakBtn);
        }
        
        currentSpeakBtn = btn;
        isPaused = false;
        
        const voices = voicesCache.length ? voicesCache : await loadVoices();
        
        // Auto-detect language from text
        const detectedLang = detectLanguage(text);
        lastDetectedLang = detectedLang;
        
        // Clean text
        const cleanText = text
            .replace(/\*\*/g, '')
            .replace(/#{1,6}\s/g, '')
            .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
            .trim();
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = detectedLang;
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        const voice = findVoice(voices, detectedLang);
        if (voice) utterance.voice = voice;
        
        utterance.onend = () => {
            if (currentSpeakBtn === btn) {
                resetSpeakBtn(btn);
                currentSpeakBtn = null;
                currentUtterance = null;
                isPaused = false;
            }
        };
        
        utterance.onerror = (e) => {
            console.warn('Speech error:', e);
            if (currentSpeakBtn === btn) {
                resetSpeakBtn(btn);
                currentSpeakBtn = null;
                currentUtterance = null;
                isPaused = false;
            }
        };
        
        currentUtterance = utterance;
        updateSpeakBtn(btn, 'pause');
        
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    }
    
    // ============ SPEECH RECOGNITION ============
    function initRecognition() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return null;
        
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = false;
        // Use last detected language from conversation
        rec.lang = lastDetectedLang || CONFIG.defaultLang;
        
        rec.onstart = () => {
            isListening = true;
            if (micBtn) micBtn.classList.add('aichat-listening');
        };
        
        rec.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            sendMessage(transcript);
        };
        
        rec.onerror = (event) => {
            console.warn('Recognition error:', event.error);
            isListening = false;
            if (micBtn) micBtn.classList.remove('aichat-listening');
        };
        
        rec.onend = () => {
            isListening = false;
            if (micBtn) micBtn.classList.remove('aichat-listening');
        };
        
        return rec;
    }
    
    // ============ HELPERS ============
    function addMessage(role, text, options = {}) {
        const msg = document.createElement('div');
        msg.className = 'aichat-msg aichat-msg-' + role;
        
        const bubble = document.createElement('div');
        bubble.className = 'aichat-bubble';
        bubble.textContent = text;
        msg.appendChild(bubble);
        
        if (role === 'bot' && 'speechSynthesis' in window && !options.skipSpeak) {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'aichat-speak-btn';
            updateSpeakBtn(speakBtn, 'speaker');
            speakBtn.addEventListener('click', () => speak(text, speakBtn));
            bubble.appendChild(speakBtn);
        }
        
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return { bubble, messageEl: msg };
    }
    
    function showTyping() {
        const msg = document.createElement('div');
        msg.className = 'aichat-msg aichat-msg-bot';
        msg.innerHTML = '<div class="aichat-bubble aichat-typing"><span></span><span></span><span></span></div>';
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return msg;
    }
    
    // ============ SEND MESSAGE ============
    async function sendMessage(text) {
        text = (text || '').trim();
        if (!text || isTyping) return;
        
        // Detect language from user input
        lastDetectedLang = detectLanguage(text);
        
        // Stop ongoing speech
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (currentSpeakBtn) resetSpeakBtn(currentSpeakBtn);
            currentSpeakBtn = null;
            currentUtterance = null;
            isPaused = false;
        }
        
        addMessage('user', text);
        input.value = '';
        input.style.height = 'auto';
        isTyping = true;
        sendBtn.disabled = true;
        
        const typingEl = showTyping();
        
        try {
            const res = await fetch(API_URL + '/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, session_id: sessionId })
            });
            
            if (!res.ok) throw new Error('HTTP ' + res.status);
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let botBubble = null;
            let fullResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const events = buffer.split('\n\n');
                buffer = events.pop();
                
                for (const evt of events) {
                    if (!evt.startsWith('data: ')) continue;
                    
                    let data;
                    try { data = JSON.parse(evt.slice(6)); }
                    catch (e) { continue; }
                    
                    if (data.type === 'session') sessionId = data.session_id;
                    else if (data.type === 'chunk') {
                        if (!botBubble) {
                            typingEl.remove();
                            botBubble = addMessage('bot', '', { skipSpeak: true }).bubble;
                        }
                        botBubble.textContent += data.content;
                        fullResponse += data.content;
                        messages.scrollTop = messages.scrollHeight;
                    }
                    else if (data.type === 'error') {
                        if (!botBubble) { typingEl.remove(); addMessage('bot', '⚠️ ' + data.message); }
                    }
                    else if (data.type === 'done') {
                        if (!botBubble) { typingEl.remove(); addMessage('bot', '(no response)'); }
                        else {
                            const speakBtn = document.createElement('button');
                            speakBtn.className = 'aichat-speak-btn';
                            updateSpeakBtn(speakBtn, 'speaker');
                            speakBtn.addEventListener('click', () => speak(fullResponse, speakBtn));
                            botBubble.appendChild(speakBtn);
                        }
                    }
                }
            }
        } catch (err) {
            typingEl.remove();
            addMessage('bot', '⚠️ Connection error. Please try again.');
        } finally {
            isTyping = false;
            sendBtn.disabled = false;
        }
    }
    
    // ============ TOGGLE ============
    toggle.addEventListener('click', () => {
        isOpen = !isOpen;
        root.classList.toggle('aichat-open', isOpen);
        
        if (isOpen) {
            if (!hasGreeted) {
                hasGreeted = true;
                setTimeout(() => addMessage('bot', CONFIG.greeting), 350);
            }
            setTimeout(() => input.focus(), 400);
        }
    });
    
    // ============ INPUT HANDLERS ============
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input.value);
        }
    });
    
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    });
    
    sendBtn.addEventListener('click', () => sendMessage(input.value));
    
    // ============ MIC ============
    if (micBtn && CONFIG.voiceEnabled) {
        micBtn.addEventListener('click', () => {
            if (isListening) {
                if (recognition) recognition.stop();
                return;
            }
            
            if (!recognition) recognition = initRecognition();
            
            if (!recognition) {
                alert('Voice input is not supported on this browser. Please use Chrome, Edge, or Safari.');
                return;
            }
            
            // Use last detected language
            recognition.lang = lastDetectedLang || CONFIG.defaultLang;
            
            try { recognition.start(); } catch (e) {}
        });
    }
    
    // ============ PRELOAD VOICES ============
    if ('speechSynthesis' in window) loadVoices();
    
    // ============ ESC TO CLOSE ============
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) toggle.click();
    });
    
})();