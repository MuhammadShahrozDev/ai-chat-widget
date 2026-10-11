/**
 * AI Chat Widget — Techxaone
 * Embed: <script src="https://your-server.com/widget.js"></script>
 */

(function() {
    'use strict';
    
    // ============ CONFIG ============
    const script = document.currentScript || document.querySelector('script[src*="widget.js"]');
    const API_URL = window.AI_CHAT_API 
        || (script ? new URL(script.src).origin : 'http://localhost:8000');
    
    const CONFIG = {
        title: window.AI_CHAT_TITLE || 'AI Assistant',
        greeting: window.AI_CHAT_GREETING || 'Hi! 👋 How may I help you today?',
        color: window.AI_CHAT_COLOR || '#0d9488',
        accent: window.AI_CHAT_ACCENT || '#f59e0b',
        botName: window.AI_CHAT_BOT_NAME || 'Techxaone',
    };
    
    // ============ CREATE HOST ============
    const host = document.createElement('div');
    host.id = 'aichat-widget-host';
    host.style.cssText = 'all:initial;position:fixed;bottom:0;right:0;z-index:2147483647;';
    document.body.appendChild(host);
    
    const shadow = host.attachShadow({ mode: 'open' });
    
    // ============ STYLES ============
    shadow.innerHTML = `
    <style>
        :host, * { box-sizing: border-box; }
        
        .aichat-root {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            position: fixed;
            bottom: 24px;
            right: 24px;
        }
        
        /* Toggle button */
        .aichat-toggle {
            width: 60px; height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white;
            border: none;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 8px 24px rgba(13, 148, 136, 0.45);
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            position: relative;
            padding: 0;
            outline: none;
        }
        .aichat-toggle:hover {
            transform: scale(1.08);
            box-shadow: 0 12px 32px rgba(13, 148, 136, 0.55);
        }
        .aichat-toggle svg {
            width: 26px; height: 26px;
            position: relative; z-index: 1;
        }
        .aichat-toggle::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: ${CONFIG.accent};
            opacity: 0.5;
            animation: aichat-pulse 2.2s ease-out infinite;
        }
        @keyframes aichat-pulse {
            0% { opacity: 0.4; transform: scale(1); }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        .aichat-icon-close { display: none; }
        .aichat-open .aichat-icon-chat { display: none; }
        .aichat-open .aichat-icon-close { display: block; }
        
        /* Panel */
        .aichat-panel {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 380px;
            height: 600px;
            max-height: calc(100vh - 120px);
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.94);
            pointer-events: none;
            transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.4,0,0.2,1);
            transform-origin: bottom right;
        }
        .aichat-open .aichat-panel {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }
        
        /* Header */
        .aichat-header {
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white;
            padding: 18px 22px;
            display: flex; align-items: center; gap: 12px;
            flex-shrink: 0;
        }
        .aichat-avatar {
            width: 42px; height: 42px; border-radius: 50%;
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
            border-radius: 50%; display: inline-block;
            box-shadow: 0 0 8px #4ade80;
        }
        
        /* Messages */
        .aichat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
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
            padding: 11px 15px;
            border-radius: 16px;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.5;
        }
        .aichat-msg-bot .aichat-bubble {
            background: #ffffff;
            color: #0f172a;
            border: 1px solid #e2e8f0;
            border-bottom-left-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .aichat-msg-user .aichat-bubble {
            background: linear-gradient(135deg, ${CONFIG.color}, #0f766e);
            color: white;
            border-bottom-right-radius: 4px;
            box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
        }
        
        /* Typing */
        .aichat-typing {
            display: flex; gap: 4px; padding: 14px 18px;
        }
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
        
        /* Input */
        .aichat-input-area {
            display: flex; gap: 8px; padding: 12px 16px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            align-items: flex-end;
            flex-shrink: 0;
        }
        .aichat-input {
            flex: 1;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 14px;
            font-family: inherit;
            resize: none;
            outline: none;
            max-height: 100px;
            transition: border-color 0.2s;
            line-height: 1.4;
            color: #0f172a;
            background: #ffffff;
        }
        .aichat-input:focus {
            border-color: ${CONFIG.color};
            box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
        }
        .aichat-input::placeholder { color: #94a3b8; }
        
        .aichat-send {
            width: 40px; height: 40px;
            border-radius: 10px;
            background: ${CONFIG.color};
            color: white;
            border: none;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s;
            padding: 0;
        }
        .aichat-send:hover { background: #0f766e; transform: scale(1.05); }
        .aichat-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .aichat-send svg { width: 18px; height: 18px; }
        
        /* Footer */
        .aichat-footer {
            text-align: center; padding: 8px;
            font-size: 11px; color: #64748b;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            flex-shrink: 0;
        }
        .aichat-footer strong { color: ${CONFIG.color}; }
        
        /* Mobile */
        @media (max-width: 480px) {
            .aichat-root { bottom: 16px; right: 16px; }
            .aichat-panel {
                width: calc(100vw - 32px);
                height: calc(100vh - 120px);
                max-height: 600px;
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
                <button class="aichat-send" aria-label="Send">
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
    
    // ============ STATE ============
    let isOpen = false;
    let sessionId = null;
    let isTyping = false;
    let hasGreeted = false;
    
    // ============ HELPERS ============
    function addMessage(role, text) {
        const msg = document.createElement('div');
        msg.className = 'aichat-msg aichat-msg-' + role;
        const bubble = document.createElement('div');
        bubble.className = 'aichat-bubble';
        bubble.textContent = text;
        msg.appendChild(bubble);
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
        return bubble;
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
        text = text.trim();
        if (!text || isTyping) return;
        
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
                    
                    if (data.type === 'session') {
                        sessionId = data.session_id;
                    }
                    else if (data.type === 'chunk') {
                        if (!botBubble) {
                            typingEl.remove();
                            botBubble = addMessage('bot', '');
                        }
                        botBubble.textContent += data.content;
                        messages.scrollTop = messages.scrollHeight;
                    }
                    else if (data.type === 'error') {
                        if (!botBubble) {
                            typingEl.remove();
                            addMessage('bot', '⚠️ ' + data.message);
                        }
                    }
                    else if (data.type === 'done') {
                        if (!botBubble) {
                            typingEl.remove();
                            addMessage('bot', '(no response)');
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
    
    // ============ ESC TO CLOSE ============
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            toggle.click();
        }
    });
    
})();