/*
 * YOUNZEE CHATBOT GENERATOR (version initiale)
 * Script JavaScript autonome pour générer un chatbot dynamiquement
 * Utilisation: <script src="chatbot-generator.js" data-bot-id="mon-bot" data-color="#3b82f6"></script>
 */

console.log("Younzee Chatbot Generator - Starting initialization...");

(function() {
  'use strict';

  // Définition des icônes SVG
  const ICONS = {
    messageCircle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    bot: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>`,
    user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    send: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9 22,2"></polygon></svg>`,
    volume: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
    volumeX: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
    minimize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="18" y2="12"></line></svg>`,
    maximize: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="12" x2="15" y2="12"></line><line x1="12" y1="9" x2="12" y2="15"></line></svg>`,
    x: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  // Configuration par défaut
  const DEFAULT_CONFIG = {
    primaryColor: '#3b82f6',
    textColor: '#374151',
    backgroundColor: '#ffffff',
    position: 'bottom-right',
    size: 'standard',
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    placeholder: 'Tapez votre message...',
    showBranding: true,
    autoOpen: false,
    soundEnabled: true,
    apiEndpoint: window.location.origin + '/api/ia',
    // Propriétés manquantes ajoutées
    showWelcomeMessage: true,
    enableTypingIndicator: true,
    enableTracking: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    autoOpenDelay: 2000, // 2 secondes
    errorMessage: 'Désolé, une erreur est survenue. Veuillez réessayer.',
    enableEmojis: true,
    maxResponseLength: 500,
    enablePersonalization: true,
    zIndex: 2147483647,
    width: 320,
    height: 500,
    borderRadius: 12,
    offsetX: 16,
    offsetY: 16,
    fontSize: 14,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    showOnMobile: true,
    showOnDesktop: true,
    trackingEndpoint: window.location.origin + '/api/widgets/events'
  };

  // Classe principale du chatbot
  class YounzeeChatbot {
    constructor(config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.isOpen = this.config.autoOpen;
      this.isMinimized = false;
      this.messages = [];
      this.isTyping = false;
      this.unreadCount = 0;
      this.soundEnabled = this.config.soundEnabled;
      this.inputMessage = '';
      this.sessionId = this.generateSessionId();
      this.userId = this.getUserId();
      this.isVisible = true;
      this.lastActivity = Date.now();
      this.conversationStarted = false;
      this.personalizationEnabled = this.config.enablePersonalization !== false;
      this.userPreferences = null;

      // Détection de l'appareil
      this.isMobile = this.detectMobile();
      this.shouldShow = (this.isMobile && this.config.showOnMobile !== false) || 
                       (!this.isMobile && this.config.showOnDesktop !== false);
      if (this.shouldShow) {
        this.init();
        this.setupEventListeners();
        this.startSessionTimeout();
        if (this.personalizationEnabled) {
          this.loadUserPreferences();
          this.applyUserPreferences();
        }
        if (this.config.autoOpen && this.config.autoOpenDelay > 0) {
          setTimeout(() => this.openChat(), this.config.autoOpenDelay);
        }
      }
    }

    generateSessionId() {
      return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getUserId() {
      let userId = localStorage.getItem('younzee-user-id');
      if (!userId) {
        userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('younzee-user-id', userId);
      }
      return userId;
    }

    detectMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    setupEventListeners() {
      // Gestion de la visibilité de la page
      document.addEventListener('visibilitychange', () => {
        this.isVisible = !document.hidden;
      });

      // Gestion de l'activité utilisateur
      ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
        document.addEventListener(event, () => {
          this.lastActivity = Date.now();
        }, { passive: true });
      });

      // Gestion du redimensionnement
      window.addEventListener('resize', () => {
        this.adjustForMobile();
      });
    }

    startSessionTimeout() {
      setInterval(() => {
        const inactiveTime = Date.now() - this.lastActivity;
        if (inactiveTime > this.config.sessionTimeout && this.isOpen) {
          this.addSystemMessage('Session expirée. Vous pouvez continuer la conversation.');
        }
      }, 60000); // Vérification chaque minute
    }

    init() {
      this.createContainer();
      this.attachStyles();
      this.bindEvents();
      
      if (this.config.welcomeMessage && this.isOpen) {
        this.addMessage({
          id: `welcome-${Date.now()}`,
          content: this.config.welcomeMessage,
          type: 'bot',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('Younzee Chatbot initialized successfully');
    }

    createContainer() {
      // Créer le conteneur principal
      this.container = document.createElement('div');
      this.container.id = 'younzee-chatbot';
      this.container.style.cssText = this.getContainerStyles();
      
      // Créer le bouton flottant
      this.createFloatingButton();
      
      // Créer l'interface de chat
      this.createChatInterface();
      
      document.body.appendChild(this.container);
    }

    getContainerStyles() {
      const positions = {
        'bottom-right': 'bottom: 16px; right: 16px;',
        'bottom-left': 'bottom: 16px; left: 16px;',
        'top-right': 'top: 16px; right: 16px;',
        'top-left': 'top: 16px; left: 16px;'
      };

      return `
        position: fixed;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        ${positions[this.config.position] || positions['bottom-right']}
      `;
    }

    createFloatingButton() {
      this.floatingButton = document.createElement('button');
      this.floatingButton.innerHTML = `
        ${ICONS.messageCircle}
        <div id="notification-badge" style="
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef4444;
          color: white;
          font-size: 12px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: none;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        ">0</div>
      `;
      
      this.floatingButton.style.cssText = `
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        position: relative;
        background-color: ${this.config.primaryColor};
        color: ${this.config.backgroundColor};
      `;

      this.floatingButton.addEventListener('mouseenter', () => {
        this.floatingButton.style.transform = 'scale(1.05)';
      });

      this.floatingButton.addEventListener('mouseleave', () => {
        this.floatingButton.style.transform = 'scale(1)';
      });

      this.floatingButton.addEventListener('click', () => {
        this.openChat();
      });

      this.container.appendChild(this.floatingButton);
    }

    createChatInterface() {
      const sizes = {
        'compact': 'width: 320px; height: 384px;',
        'large': 'width: 384px; height: 600px;',
        'standard': 'width: 320px; height: 500px;'
      };

      this.chatInterface = document.createElement('div');
      this.chatInterface.style.cssText = `
        ${sizes[this.config.size] || sizes['standard']}
        background-color: ${this.config.backgroundColor};
        color: ${this.config.textColor};
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        border: 1px solid ${this.config.primaryColor}20;
        display: none;
        flex-direction: column;
        overflow: hidden;
      `;

      // Header
      this.createHeader();
      
      // Messages container
      this.createMessagesContainer();
      
      // Input container
      this.createInputContainer();
      
      // Branding
      if (this.config.showBranding) {
        this.createBranding();
      }

      this.container.appendChild(this.chatInterface);
    }

    createHeader() {
      this.header = document.createElement('div');
      this.header.style.cssText = `
        background-color: ${this.config.primaryColor};
        color: ${this.config.backgroundColor};
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid ${this.config.primaryColor}20;
      `;

      this.header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${this.config.backgroundColor};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="color: ${this.config.primaryColor};">${ICONS.bot}</div>
          </div>
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: 600;">Assistant Younzee</h3>
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">En ligne</p>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="sound-toggle" style="
            background: transparent;
            border: none;
            color: ${this.config.backgroundColor};
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          ">
            ${this.soundEnabled ? ICONS.volume : ICONS.volumeX}
          </button>
          
          <button id="minimize-toggle" style="
            background: transparent;
            border: none;
            color: ${this.config.backgroundColor};
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          ">
            ${ICONS.minimize}
          </button>
          
          <button id="close-button" style="
            background: transparent;
            border: none;
            color: ${this.config.backgroundColor};
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
          ">
            ${ICONS.x}
          </button>
        </div>
      `;

      this.chatInterface.appendChild(this.header);
    }

    createMessagesContainer() {
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.style.cssText = `
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        max-height: 300px;
      `;

      this.chatInterface.appendChild(this.messagesContainer);
    }

    createInputContainer() {
      this.inputContainer = document.createElement('div');
      this.inputContainer.style.cssText = `
        padding: 16px;
        border-top: 1px solid ${this.config.primaryColor}20;
        display: flex;
        gap: 8px;
      `;

      this.inputField = document.createElement('input');
      this.inputField.type = 'text';
      this.inputField.placeholder = this.config.placeholder;
      this.inputField.style.cssText = `
        flex: 1;
        padding: 12px;
        border: 1px solid ${this.config.primaryColor}20;
        border-radius: 8px;
        font-size: 14px;
        background-color: ${this.config.primaryColor}05;
        color: ${this.config.textColor};
        outline: none;
      `;

      this.sendButton = document.createElement('button');
      this.sendButton.innerHTML = ICONS.send;
      this.sendButton.style.cssText = `
        background-color: ${this.config.primaryColor};
        color: ${this.config.backgroundColor};
        border: none;
        border-radius: 8px;
        padding: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      this.inputContainer.appendChild(this.inputField);
      this.inputContainer.appendChild(this.sendButton);
      this.chatInterface.appendChild(this.inputContainer);
    }

    createBranding() {
      const branding = document.createElement('div');
      branding.style.cssText = `
        text-align: center;
        padding: 8px;
        border-top: 1px solid ${this.config.primaryColor}20;
        font-size: 12px;
        opacity: 0.5;
      `;
      branding.innerHTML = 'Propulsé par <span style="font-weight: 600;">Younzee</span>';
      
      this.chatInterface.appendChild(branding);
    }

    attachStyles() {
      if (!document.getElementById('younzee-chatbot-styles')) {
        const style = document.createElement('style');
        style.id = 'younzee-chatbot-styles';
        style.textContent = `
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
          
          #younzee-chatbot .typing-indicator {
            display: flex;
            gap: 4px;
            align-items: center;
            padding: 12px;
          }
          
          #younzee-chatbot .typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${this.config.primaryColor};
            animation: bounce 1.4s infinite;
          }
          
          #younzee-chatbot .typing-dot:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          #younzee-chatbot .typing-dot:nth-child(3) {
            animation-delay: 0.4s;
          }
        `;
        document.head.appendChild(style);
      }
    }

    bindEvents() {
      // Événements du header
      const soundToggle = this.header.querySelector('#sound-toggle');
      const minimizeToggle = this.header.querySelector('#minimize-toggle');
      const closeButton = this.header.querySelector('#close-button');

      soundToggle?.addEventListener('click', () => this.toggleSound());
      minimizeToggle?.addEventListener('click', () => this.toggleMinimize());
      closeButton?.addEventListener('click', () => this.closeChat());

      // Événements de l'input
      this.inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });

      this.sendButton.addEventListener('click', () => {
        this.sendMessage();
      });
    }

    openChat() {
      this.isOpen = true;
      this.floatingButton.style.display = 'none';
      this.chatInterface.style.display = 'flex';
      this.unreadCount = 0;
      this.updateNotificationBadge();
      
      // Affichage du message de bienvenue
      if (this.messages.length === 0 && this.config.showWelcomeMessage && this.config.welcomeMessage) {
        this.addMessage({
          id: `welcome-${Date.now()}`,
          content: this.config.welcomeMessage,
          type: 'bot',
          timestamp: new Date().toISOString()
        });
      }
      
      // Focus sur l'input
      setTimeout(() => {
        if (this.inputField) {
          this.inputField.focus();
        }
      }, 100);
      
      // Ajustement mobile
      this.adjustForMobile();
    }

    closeChat() {
      this.isOpen = false;
      this.isMinimized = false;
      this.floatingButton.style.display = 'flex';
      this.chatInterface.style.display = 'none';
    }

    adjustForMobile() {
      if (this.isMobile && this.chatInterface) {
        // Ajustements spécifiques pour mobile
        if (this.isOpen) {
          this.chatInterface.style.position = 'fixed';
          this.chatInterface.style.top = '0';
          this.chatInterface.style.left = '0';
          this.chatInterface.style.right = '0';
          this.chatInterface.style.bottom = '0';
          this.chatInterface.style.width = '100%';
          this.chatInterface.style.height = '100%';
          this.chatInterface.style.zIndex = this.config.zIndex;
          this.chatInterface.style.borderRadius = '0';
        }
      } else if (this.chatInterface) {
        // Réinitialiser pour desktop
        this.chatInterface.style.position = 'fixed';
        this.chatInterface.style.width = this.config.width + 'px';
        this.chatInterface.style.height = this.config.height + 'px';
        this.chatInterface.style.borderRadius = this.config.borderRadius + 'px';
        
        // Positionnement selon la configuration
        this.setPosition();
      }
    }

    setPosition() {
      if (!this.chatInterface) return;
      
      const positions = {
        'bottom-right': {
          bottom: this.config.offsetY + 'px',
          right: this.config.offsetX + 'px',
          top: 'auto',
          left: 'auto'
        },
        'bottom-left': {
          bottom: this.config.offsetY + 'px',
          left: this.config.offsetX + 'px',
          top: 'auto',
          right: 'auto'
        },
        'top-right': {
          top: this.config.offsetY + 'px',
          right: this.config.offsetX + 'px',
          bottom: 'auto',
          left: 'auto'
        },
        'top-left': {
          top: this.config.offsetY + 'px',
          left: this.config.offsetX + 'px',
          bottom: 'auto',
          right: 'auto'
        },
        'center': {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bottom: 'auto',
          right: 'auto'
        }
      };

      const pos = positions[this.config.position] || positions['bottom-right'];
      Object.assign(this.chatInterface.style, pos);
    }

    toggleMinimize() {
      this.isMinimized = !this.isMinimized;
      const messageContainer = this.chatInterface.querySelector('[style*="flex: 1"]');
      const inputContainer = this.inputContainer;
      
      if (this.isMinimized) {
        messageContainer.style.display = 'none';
        inputContainer.style.display = 'none';
      } else {
        messageContainer.style.display = 'block';
        inputContainer.style.display = 'flex';
      }
      
      const minimizeButton = this.header.querySelector('#minimize-toggle');
      minimizeButton.innerHTML = this.isMinimized ? ICONS.maximize : ICONS.minimize;
    }

    toggleSound() {
      this.soundEnabled = !this.soundEnabled;
      const soundButton = this.header.querySelector('#sound-toggle');
      soundButton.innerHTML = this.soundEnabled ? ICONS.volume : ICONS.volumeX;
    }

    async sendMessage() {
      const message = this.inputField.value.trim();
      if (!message) return;

      // Ajouter le message utilisateur
      this.addMessage({
        id: `user-${Date.now()}`,
        content: message,
        type: 'user',
        timestamp: new Date().toISOString()
      });

      this.inputField.value = '';
      this.showTypingIndicator();

      try {
        // Utilisation de la nouvelle API IA Master
        const response = await fetch(this.config.apiEndpoint || '/api/ia', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            userId: this.userId,
            context: {
              conversationHistory: this.getConversationHistory(),
              userPreferences: this.getUserPreferences(),
              deviceInfo: {
                isMobile: this.isMobile,
                userAgent: navigator.userAgent,
                language: navigator.language,
                referrer: document.referrer
              },
              widget: true // Indique que c'est un appel depuis le widget
            }
          })
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
          const botMessage = {
            id: data.data.id,
            content: data.data.content,
            type: 'bot',
            timestamp: data.timestamp,
            metadata: {
              intent: data.data.metadata?.intent,
              confidence: data.data.confidence,
              aiType: data.data.aiType,
              processingTime: data.data.metadata?.processingTime
            }
          };
          
          this.addMessage(botMessage);
          this.playNotificationSound();
          this.trackEvent('message_received', { 
            responseTime: data.data.metadata?.processingTime,
            confidence: data.data.confidence,
            aiType: data.data.aiType,
            intent: data.data.metadata?.intent
          });
        } else {
          throw new Error(data.error || 'Erreur inconnue');
        }

      } catch (error) {
        console.error('Erreur chatbot widget:', error);
        
        // Message d'erreur de fallback
        this.addMessage({
          id: `error-${Date.now()}`,
          content: this.config.errorMessage || "😅 Désolé, j'ai rencontré un problème technique. Pouvez-vous réessayer ?",
          type: 'bot',
          timestamp: new Date().toISOString(),
          metadata: {
            intent: 'error',
            confidence: 0,
            aiType: 'error'
          }
        });
        
        this.trackEvent('message_error', { 
          error: error.message,
          userMessage: message
        });
      } finally {
        this.hideTypingIndicator();
      }
    }

    getUserPreferences() {
      // Récupérer les préférences utilisateur stockées
      const prefs = localStorage.getItem('younzee-user-prefs');
      return prefs ? JSON.parse(prefs) : {
        budget: { min: 0, max: 500 },
        categories: [],
        language: navigator.language
      };
    }

    getConversationHistory() {
      return this.messages
        .filter(msg => !msg.isError && msg.type !== 'system')
        .slice(-6)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }));
    }

    getChatbotConfig() {
      return {
        personality: {
          tone: "Amical",
          formality: "Tutoiement", 
          verbosity: "Détaillé",
          empathy: "Élevée",
          proactivity: "Proactif"
        },
        preferences: {
          enableEmojis: this.config.enableEmojis,
          maxResponseLength: this.config.maxResponseLength || 500
        }
      };
    }

    addSystemMessage(content) {
      this.addMessage({
        id: `system-${Date.now()}`,
        content: content,
        type: 'system',
        timestamp: new Date().toISOString()
      });
    }

    // Méthode de tracking des événements
    trackEvent(eventType, eventData = {}) {
      if (!this.config.enableTracking) return;

      const event = {
        widgetConfigId: this.config.botId || 'default',
        eventType: eventType,
        eventData: {
          ...eventData,
          url: window.location.href,
          timestamp: Date.now()
        },
        userId: this.userId,
        sessionId: this.sessionId,
        userAgent: navigator.userAgent,
        referer: document.referrer
      };

      // Envoi asynchrone pour ne pas bloquer l'interface
      fetch(this.config.trackingEndpoint || 'https://default-tracking-endpoint.com/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(err => {
        console.warn('Erreur tracking:', err);
      });
    }

    addMessage(message) {
      this.messages.push(message);
      
      const messageElement = document.createElement('div');
      messageElement.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        justify-content: ${message.type === 'user' ? 'flex-end' : 'flex-start'};
      `;

      if (message.type === 'bot') {
        messageElement.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: ${this.config.primaryColor};
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
          ">
            <div style="color: ${this.config.backgroundColor};">${ICONS.bot}</div>
          </div>
          <div style="max-width: 80%;">
            <div style="
              border-radius: 12px;
              padding: 12px;
              font-size: 14px;
              background-color: ${this.config.primaryColor}08;
              border: 1px solid ${this.config.primaryColor}20;
              color: ${this.config.textColor};
            ">
              <p style="margin: 0; white-space: pre-wrap;">${message.content}</p>
            </div>
            <div style="
              font-size: 11px;
              opacity: 0.5;
              margin-top: 4px;
              text-align: left;
            ">
              ${new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        `;
      } else {
        messageElement.innerHTML = `
          <div style="max-width: 80%;">
            <div style="
              border-radius: 12px;
              padding: 12px;
              font-size: 14px;
              background-color: ${this.config.primaryColor};
              color: ${this.config.backgroundColor};
              margin-left: auto;
            ">
              <p style="margin: 0; white-space: pre-wrap;">${message.content}</p>
            </div>
            <div style="
              font-size: 11px;
              opacity: 0.5;
              margin-top: 4px;
              text-align: right;
            ">
              ${new Date(message.timestamp).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
          <div style="
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background-color: ${this.config.primaryColor}20;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 4px;
          ">
            <div style="color: ${this.config.primaryColor};">${ICONS.user}</div>
          </div>
        `;
      }

      this.messagesContainer.appendChild(messageElement);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

      if (!this.isOpen && message.type === 'bot') {
        this.unreadCount++;
        this.updateNotificationBadge();
      }
    }

    showTypingIndicator() {
      this.typingIndicator = document.createElement('div');
      this.typingIndicator.style.cssText = `
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        justify-content: flex-start;
      `;

      this.typingIndicator.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${this.config.primaryColor};
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
        ">
          <div style="color: ${this.config.backgroundColor};">${ICONS.bot}</div>
        </div>
        <div style="
          border-radius: 12px;
          padding: 12px;
          border: 1px solid ${this.config.primaryColor}20;
          background-color: ${this.config.primaryColor}08;
        ">
          <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
          </div>
        </div>
      `;

      this.messagesContainer.appendChild(this.typingIndicator);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
      if (this.typingIndicator) {
        this.typingIndicator.remove();
        this.typingIndicator = null;
      }
    }

    updateNotificationBadge() {
      const badge = this.floatingButton.querySelector('#notification-badge');
      if (this.unreadCount > 0) {
        badge.style.display = 'flex';
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount.toString();
      } else {
        badge.style.display = 'none';
      }
    }

    playNotificationSound() {
      if (!this.soundEnabled) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        console.log('Erreur son:', error);
      }
    }

    // Gestion des préférences utilisateur
    loadUserPreferences() {
      try {
        const prefs = localStorage.getItem('younzee-user-prefs');
        if (prefs) {
          this.userPreferences = JSON.parse(prefs);
        } else {
          this.userPreferences = this.getDefaultPreferences();
          this.saveUserPreferences(this.userPreferences);
        }
      } catch (e) {
        this.userPreferences = this.getDefaultPreferences();
      }
    }

    saveUserPreferences(updates) {
      this.userPreferences = { ...this.userPreferences, ...updates };
      localStorage.setItem('younzee-user-prefs', JSON.stringify(this.userPreferences));
      this.applyUserPreferences();
    }

    getDefaultPreferences() {
      return {
        theme: 'auto',
        primaryColor: this.config.primaryColor,
        backgroundColor: this.config.backgroundColor,
        textSize: 'medium',
        compactMode: this.isMobile,
        soundEnabled: this.config.soundEnabled
      };
    }

    applyUserPreferences() {
      if (!this.userPreferences) return;
      // Couleurs
      if (this.userPreferences.primaryColor) this.config.primaryColor = this.userPreferences.primaryColor;
      if (this.userPreferences.backgroundColor) this.config.backgroundColor = this.userPreferences.backgroundColor;
      // Thème
      if (this.userPreferences.theme && this.userPreferences.theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', this.userPreferences.theme);
      }
      // Taille texte
      if (this.userPreferences.textSize) {
        this.config.fontSize = this.userPreferences.textSize === 'small' ? '12' : this.userPreferences.textSize === 'large' ? '16' : '14';
      }
      // Mode compact
      if (this.userPreferences.compactMode) {
        this.config.size = 'compact';
      }
      // Sons
      if (this.userPreferences.soundEnabled !== undefined) {
        this.soundEnabled = this.userPreferences.soundEnabled;
        this.config.soundEnabled = this.userPreferences.soundEnabled;
      }
      // Rafraîchir l'UI si besoin
      if (this.container && this.chatInterface) {
        this.updateInterfaceWithPreferences();
      }
    }

    updateInterfaceWithPreferences() {
      // Peut être étendu pour appliquer les couleurs, la taille, etc. dynamiquement
      this.container.style.fontSize = this.config.fontSize + 'px';
    }

    // Méthode pour permettre à l'utilisateur de modifier ses préférences
    openPersonalizationPanel() {
      if (!this.personalizationEnabled) return;
      const panel = this.createPersonalizationPanel();
      document.body.appendChild(panel);
    }

    createPersonalizationPanel() {
      const panel = document.createElement('div');
      panel.id = 'younzee-personalization-panel';
      panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 400px;
        max-width: 90vw;
        max-height: 80vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        z-index: ${this.config.zIndex || 2147483647};
        overflow: hidden;
        font-family: ${this.config.fontFamily || 'system-ui'};
      `;
      const prefs = this.userPreferences || {};
      panel.innerHTML = `
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0; font-size: 18px; color: #1f2937;">Personnaliser votre chatbot</h3>
          <button id="close-personalization" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>
        </div>
        <div style="padding: 20px; max-height: 60vh; overflow-y: auto;">
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Thème</label>
            <select id="theme-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="light" ${prefs.theme === 'light' ? 'selected' : ''}>Clair</option>
              <option value="dark" ${prefs.theme === 'dark' ? 'selected' : ''}>Sombre</option>
              <option value="auto" ${prefs.theme === 'auto' ? 'selected' : ''}>Automatique</option>
            </select>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Taille du texte</label>
            <select id="text-size-select" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px;">
              <option value="small" ${prefs.textSize === 'small' ? 'selected' : ''}>Petit</option>
              <option value="medium" ${prefs.textSize === 'medium' ? 'selected' : ''}>Moyen</option>
              <option value="large" ${prefs.textSize === 'large' ? 'selected' : ''}>Grand</option>
            </select>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="color" id="primary-color-input" value="${prefs.primaryColor || this.config.primaryColor}" style="margin-right: 8px;"> Couleur principale
            </label>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="compact-checkbox" ${prefs.compactMode ? 'checked' : ''} style="margin-right: 8px;"> Mode compact
            </label>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="sounds-checkbox" ${prefs.soundEnabled !== false ? 'checked' : ''} style="margin-right: 8px;"> Sons de notification
            </label>
          </div>
        </div>
        <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end;">
          <button id="reset-preferences" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer;">Réinitialiser</button>
          <button id="save-preferences" style="padding: 8px 16px; background: ${this.config.primaryColor}; color: white; border: none; border-radius: 6px; cursor: pointer;">Sauvegarder</button>
        </div>
      `;
      panel.querySelector('#close-personalization').addEventListener('click', () => panel.remove());
      panel.querySelector('#save-preferences').addEventListener('click', () => {
        const updates = {
          theme: panel.querySelector('#theme-select').value,
          textSize: panel.querySelector('#text-size-select').value,
          primaryColor: panel.querySelector('#primary-color-input').value,
          compactMode: panel.querySelector('#compact-checkbox').checked,
          soundEnabled: panel.querySelector('#sounds-checkbox').checked
        };
        this.saveUserPreferences(updates);
        panel.remove();
      });
      panel.querySelector('#reset-preferences').addEventListener('click', () => {
        localStorage.removeItem('younzee-user-prefs');
        this.userPreferences = this.getDefaultPreferences();
        this.saveUserPreferences(this.userPreferences);
        panel.remove();
      });
      return panel;
    }
  }

  // Fonction d'initialisation
  function initYounzeeChatbot() {
    // Récupérer la configuration depuis les attributs data-*
    const scripts = document.querySelectorAll('script[src*="chatbot-generator.js"]');
    const currentScript = scripts[scripts.length - 1];
    if (!currentScript) {
      console.error('Script Younzee Chatbot non trouvé');
      return;
    }
    const config = {
      botId: currentScript.getAttribute('data-bot-id') || 'default',
      primaryColor: currentScript.getAttribute('data-color') || DEFAULT_CONFIG.primaryColor,
      textColor: currentScript.getAttribute('data-text-color') || DEFAULT_CONFIG.textColor,
      backgroundColor: currentScript.getAttribute('data-bg-color') || DEFAULT_CONFIG.backgroundColor,
      position: currentScript.getAttribute('data-position') || DEFAULT_CONFIG.position,
      size: currentScript.getAttribute('data-size') || DEFAULT_CONFIG.size,
      welcomeMessage: currentScript.getAttribute('data-welcome') || DEFAULT_CONFIG.welcomeMessage,
      placeholder: currentScript.getAttribute('data-placeholder') || DEFAULT_CONFIG.placeholder,
      showBranding: currentScript.getAttribute('data-branding') !== 'false',
      autoOpen: currentScript.getAttribute('data-auto-open') === 'true',
      soundEnabled: currentScript.getAttribute('data-sound') !== 'false',
      apiEndpoint: currentScript.getAttribute('data-api-endpoint') || DEFAULT_CONFIG.apiEndpoint
    };
    // Créer et initialiser le chatbot (version initiale, sans préférences utilisateur)
    window.younzeeChatbot = new YounzeeChatbot(config);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYounzeeChatbot);
  } else {
    initYounzeeChatbot();
  }
})();
