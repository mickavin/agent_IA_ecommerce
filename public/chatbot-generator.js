/**
 * Younzee Chatbot Widget - Générateur JavaScript
 * Version 2.0 - Nouvelle architecture IA Master
 */

(function() {
  'use strict';

  // Configuration par défaut
  const DEFAULT_CONFIG = {
    chatbotId: 'younzee-default',
    title: 'Assistant Younzee',
    subtitle: 'Comment puis-je vous aider ?',
    apiEndpoint: window.location.origin + '/api/ai/master',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    secondaryColor: '#EFF6FF',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    size: 'standard',
    showTypingIndicator: true,
    enableSound: false,
    autoOpen: false,
    autoOpenDelay: 3000,
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    placeholder: 'Tapez votre message...',
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement',
      verbosity: 'Détaillé',
      empathy: 'Élevée',
      proactivity: 'Proactif'
    }
  };

  // Classes CSS intégrées
  const CSS_STYLES = `
    .younzee-chatbot-container {
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
    }
    
    .younzee-chatbot-container.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .younzee-chatbot-container.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .younzee-chatbot-container.top-right {
      top: 20px;
      right: 20px;
    }
    
    .younzee-chatbot-container.top-left {
      top: 20px;
      left: 20px;
    }
    
    .younzee-chatbot-button {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: white;
      font-size: 24px;
    }
    
    .younzee-chatbot-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    
    .younzee-chatbot-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 380px;
      height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      border: 1px solid #e5e7eb;
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .younzee-chatbot-window.open {
      display: flex;
    }
    
    .younzee-chatbot-header {
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .younzee-chatbot-header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .younzee-chatbot-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: white;
    }
    
    .younzee-chatbot-header-text h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .younzee-chatbot-header-text p {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    
    .younzee-chatbot-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .younzee-chatbot-close:hover {
      background-color: #f3f4f6;
    }
    
    .younzee-chatbot-messages {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f9fafb;
    }
    
    .younzee-chatbot-message {
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    
    .younzee-chatbot-message.user {
      flex-direction: row-reverse;
    }
    
    .younzee-chatbot-message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }
    
    .younzee-chatbot-message.bot .younzee-chatbot-message-content {
      background: white;
      color: #1f2937;
      border-bottom-left-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    
    .younzee-chatbot-message.user .younzee-chatbot-message-content {
      color: white;
      border-bottom-right-radius: 6px;
    }
    
    .younzee-chatbot-input-container {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    
    .younzee-chatbot-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      resize: none;
      max-height: 100px;
      min-height: 40px;
    }
    
    .younzee-chatbot-input:focus {
      border-color: var(--primary-color, #3B82F6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .younzee-chatbot-send {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: white;
      transition: all 0.2s;
    }
    
    .younzee-chatbot-send:hover {
      transform: scale(1.05);
    }
    
    .younzee-chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .younzee-chatbot-typing {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 12px 16px;
      background: white;
      border-radius: 18px;
      border-bottom-left-radius: 6px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      max-width: 70%;
      margin-bottom: 16px;
    }
    
    .younzee-chatbot-typing-dot {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    
    .younzee-chatbot-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .younzee-chatbot-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    
    .younzee-chatbot-powered {
      text-align: center;
      padding: 8px;
      font-size: 11px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    
    .younzee-chatbot-powered a {
      color: var(--primary-color, #3B82F6);
      text-decoration: none;
    }
    
    @media (max-width: 480px) {
      .younzee-chatbot-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        bottom: 80px;
        right: 20px;
        left: 20px;
      }
    }
  `;

  class YounzeeChatbot {
    constructor(config = {}) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.isOpen = false;
      this.messages = [];
      this.container = null;
      this.messagesContainer = null;
      this.inputElement = null;
      this.sendButton = null;
      
      this.init();
    }

    init() {
      this.injectStyles();
      this.createChatbot();
      this.bindEvents();
      
      if (this.config.autoOpen) {
        setTimeout(() => this.open(), this.config.autoOpenDelay);
      }
      
      // Message de bienvenue
      if (this.config.welcomeMessage) {
        this.addMessage(this.config.welcomeMessage, 'bot');
      }
    }

    injectStyles() {
      if (document.getElementById('younzee-chatbot-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'younzee-chatbot-styles';
      style.textContent = CSS_STYLES.replace(/var\(--primary-color, ([^)]+)\)/g, this.config.primaryColor);
      document.head.appendChild(style);
    }

    createChatbot() {
      this.container = document.createElement('div');
      this.container.className = `younzee-chatbot-container ${this.config.position}`;
      
      this.container.innerHTML = `
        <button class="younzee-chatbot-button" style="background-color: ${this.config.primaryColor}">
          💬
        </button>
        
        <div class="younzee-chatbot-window">
          <div class="younzee-chatbot-header" style="background-color: ${this.config.primaryColor}; color: white;">
            <div class="younzee-chatbot-header-content">
              <div class="younzee-chatbot-avatar" style="background-color: rgba(255,255,255,0.2);">
                🤖
              </div>
              <div class="younzee-chatbot-header-text">
                <h3>${this.config.title}</h3>
                <p style="color: rgba(255,255,255,0.8);">${this.config.subtitle}</p>
              </div>
            </div>
            <button class="younzee-chatbot-close">✕</button>
          </div>
          
          <div class="younzee-chatbot-messages"></div>
          
          <div class="younzee-chatbot-input-container">
            <textarea 
              class="younzee-chatbot-input" 
              placeholder="${this.config.placeholder}"
              rows="1"
            ></textarea>
            <button class="younzee-chatbot-send" style="background-color: ${this.config.primaryColor}">
              ➤
            </button>
          </div>
          
          <div class="younzee-chatbot-powered">
            Propulsé par <a href="https://younzee.com" target="_blank">Younzee</a>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.container);
      
      this.messagesContainer = this.container.querySelector('.younzee-chatbot-messages');
      this.inputElement = this.container.querySelector('.younzee-chatbot-input');
      this.sendButton = this.container.querySelector('.younzee-chatbot-send');
    }

    bindEvents() {
      const button = this.container.querySelector('.younzee-chatbot-button');
      const closeButton = this.container.querySelector('.younzee-chatbot-close');
      
      button.addEventListener('click', () => this.toggle());
      closeButton.addEventListener('click', () => this.close());
      
      this.inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      this.inputElement.addEventListener('input', () => {
        this.autoResize();
      });
      
      this.sendButton.addEventListener('click', () => this.sendMessage());
    }

    autoResize() {
      this.inputElement.style.height = 'auto';
      this.inputElement.style.height = Math.min(this.inputElement.scrollHeight, 100) + 'px';
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.container.querySelector('.younzee-chatbot-window').classList.add('open');
      this.inputElement.focus();
    }

    close() {
      this.isOpen = false;
      this.container.querySelector('.younzee-chatbot-window').classList.remove('open');
    }

    addMessage(content, type = 'bot', showTyping = false) {
      if (showTyping && type === 'bot') {
        this.showTypingIndicator();
        setTimeout(() => {
          this.hideTypingIndicator();
          this.addMessage(content, type, false);
        }, 1000 + Math.random() * 1000);
        return;
      }

      const messageDiv = document.createElement('div');
      messageDiv.className = `younzee-chatbot-message ${type}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'younzee-chatbot-message-content';
      
      if (type === 'user') {
        contentDiv.style.backgroundColor = this.config.primaryColor;
      }
      
      // Support simple du markdown
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      content = content.replace(/\n/g, '<br>');
      
      contentDiv.innerHTML = content;
      messageDiv.appendChild(contentDiv);
      
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
      
      this.messages.push({ content, type, timestamp: new Date() });
    }

    showTypingIndicator() {
      if (this.container.querySelector('.younzee-chatbot-typing')) return;
      
      const typingDiv = document.createElement('div');
      typingDiv.className = 'younzee-chatbot-typing';
      typingDiv.innerHTML = `
        <div class="younzee-chatbot-typing-dot"></div>
        <div class="younzee-chatbot-typing-dot"></div>
        <div class="younzee-chatbot-typing-dot"></div>
      `;
      
      this.messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }

    hideTypingIndicator() {
      const typing = this.container.querySelector('.younzee-chatbot-typing');
      if (typing) {
        typing.remove();
      }
    }

    scrollToBottom() {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async sendMessage() {
      const message = this.inputElement.value.trim();
      if (!message || this.sendButton.disabled) return;
      
      this.addMessage(message, 'user');
      this.inputElement.value = '';
      this.autoResize();
      
      this.sendButton.disabled = true;
      
      if (this.config.showTypingIndicator) {
        this.showTypingIndicator();
      }
      
      try {
        const response = await fetch(this.config.apiEndpoint || '/api/ai/master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            context: {
              conversationHistory: this.messages.slice(-5),
              userPreferences: {},
              userId: `widget-${Date.now()}`
            },
            chatbotConfig: {
              personality: this.config.personality,
              visualConfig: {
                primaryColor: this.config.primaryColor,
                welcomeMessage: this.config.welcomeMessage,
                placeholder: this.config.placeholder
              }
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (this.config.showTypingIndicator) {
          this.hideTypingIndicator();
        }
        
        if (data.success && data.response) {
          this.addMessage(data.response.content, 'bot');
        } else {
          this.addMessage('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'bot');
        }
      } catch (error) {
        console.error('Erreur chatbot widget:', error);
        
        if (this.config.showTypingIndicator) {
          this.hideTypingIndicator();
        }
        
        this.addMessage('Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer plus tard.', 'bot');
      } finally {
        this.sendButton.disabled = false;
      }
    }

    destroy() {
      if (this.container) {
        this.container.remove();
      }
      
      const styles = document.getElementById('younzee-chatbot-styles');
      if (styles) {
        styles.remove();
      }
    }

    // API publique
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
    
    clearMessages() {
      this.messages = [];
      this.messagesContainer.innerHTML = '';
      if (this.config.welcomeMessage) {
        this.addMessage(this.config.welcomeMessage, 'bot');
      }
    }
    
    getMessages() {
      return [...this.messages];
    }
  }

  // Exposition globale
  window.YounzeeChatbot = YounzeeChatbot;

  // Auto-initialisation si configuré
  if (window.younzeeChatbotConfig) {
    new YounzeeChatbot(window.younzeeChatbotConfig);
  }

})();
