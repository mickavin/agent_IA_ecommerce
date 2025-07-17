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
    primaryColor: '#ffdd5b',
    secondaryColor: '#ffdd5b',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    size: 'standard',
    showTypingIndicator: true,
    enableSound: false,
    autoOpen: false,
    autoOpenDelay: 3000,
    welcomeMessage: '🤖 Bonjour, Je suis votre Styliste Personnel. Comment je peux vous aider aujourd\'hui ? Donnez moi une catégorie de produit, une couleur et votre taille pour que je puisse vous proposer des articles adaptés à vous.',
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
    .younzee-chatbot-message-content div:empty {
      display: block !important;
    }

    .younzee-chatbot-message-content hr {
      margin: 34px 0 !important;
    }
    .younzee-chatbot-messages p img {
      height: 180px;
      max-width: 100%;
      border-radius: 12px;
      object-fit: cover;
      margin-bottom: 10px;
    }
    .younzee-chatbot-messages ul {
      list-style: circle !important;
    }
    
    .younzee-chatbot-message-content p {
      margin-top: 0;
      margin-bottom: 0;
    }

    .younzee-chatbot-message-content p {
      margin: 0;
    }

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
      max-height: 100vh !important;
      max-width: 100vw !important;
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
      font-family: sans-serif;
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
      background: #f3e6b4;
    }
    
    .younzee-chatbot-message {
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex-direction: column;
    }
    
    .younzee-chatbot-message.user {
      flex-direction: row-reverse;
    }

    .younzee-chatbot-message.bot {
      flex-direction: column;
    }
    
    .younzee-chatbot-message-content {
      max-width: 70%;
      padding: 12px 24px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
    }

    .younzee-chatbot-message-content h2 {
      font-size: 13px !important;
      font-weight: bold !important;
      margin-top: 7px !important;
    }

    .younzee-chatbot-message.user p {
      color: white !important;
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
      border-color: var(--primary-color, #ffdd5b);
      box-shadow: 0 0 0 3px rgb(255, 221, 91);
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
            display: flex !important;
            align-items: center !important;
      gap: 4px !important;
      padding: 12px 16px !important;
      background: white !important;
      border-radius: 18px !important;
      border-bottom-left-radius: 6px !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
      max-width: 20% !important;
      min-width: 20% !important;
      min-height: 45px !important;
      margin-bottom: 0 !important;
      margin-top: 0 !important;
    }
    
    .younzee-chatbot-typing-dot {
      width: 6px !important;
      height: 6px !important;
      background: #9ca3af !important;
            border-radius: 50% !important;
      animation: typing 1.4s infinite;
      display: block !important;
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
      }
    }
  `;

  // Ajout du CSS pour le mini-carousel
  const CAROUSEL_CSS = `
      .younzee-chatbot-message-content p {
      margin: 0;
    }

    .younzee-carousel-container {
      margin-top: 12px;
      width: 100%;
      max-width: 340px;
      overflow: hidden;
      position: relative;
      background: #fffbe6;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      padding: 12px 0 8px 0;
    }
    .younzee-carousel-track {
      display: flex;
      transition: transform 0.3s cubic-bezier(.4,0,.2,1);
    }
    .younzee-carousel-item {
      min-width: 150px;
      max-width: 150px;
      max-height: 280px;
      margin: 0 8px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 8px 12px 8px;
      position: relative;
    }
    .younzee-carousel-img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
      background: #f3f4f6;
      margin-bottom: 8px;
    }
    .younzee-carousel-title {
      font-size: 11px;
      font-weight: 500;
      color: #1f2937;
      text-align: center;
      min-height: 2.2em;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .younzee-carousel-price {
        font-size: 9px;
        font-weight: bold;
        color: #121212;
        margin-bottom: 8px;
        position: absolute;
        background-color: #ffdd5b;
        padding: 2px 8px;
        border-radius: 8px;
        margin-top: 4px;
        top: 103px;
        right: 12px;
    }
    .younzee-carousel-btn {
      background: #ffdd5b;
      color: #1f2937;
      border: none;
      border-radius: 30px;
      padding: 3px 14px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      margin-top: auto;
      transition: background 0.2s;
    }
    .younzee-carousel-btn:hover {
      background: #ffe88a;
    }
    .younzee-carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: #fff;
      border: 1px solid #eee;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #1f2937;
      cursor: pointer;
      z-index: 2;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: all 0.2s ease;
      user-select: none;
    }
    .younzee-carousel-arrow:hover {
      background: #ffdd5b;
      transform: translateY(-50%) scale(1.05);
    }
    .younzee-carousel-arrow:active {
      transform: translateY(-50%) scale(0.95);
    }
    .younzee-carousel-arrow.disabled {
      opacity: 0.3;
      cursor: default;
      pointer-events: none;
    }
    .younzee-carousel-arrow.left { left: 4px; }
    .younzee-carousel-arrow.right { right: 4px; }
  `;

  // Ajoute le CSS du carousel au head si pas déjà fait
  function injectCarouselStyles() {
    if (!document.getElementById('younzee-carousel-styles')) {
      const style = document.createElement('style');
      style.id = 'younzee-carousel-styles';
      style.textContent = CAROUSEL_CSS;
      document.head.appendChild(style);
    }
  }

  // Génère le HTML du mini-carousel
  function createCarousel(products) {
    injectCarouselStyles();
    const container = document.createElement('div');
    container.className = 'younzee-carousel-container';
    const track = document.createElement('div');
    track.className = 'younzee-carousel-track';
    products.forEach((product) => {
      const item = document.createElement('div');
      item.className = 'younzee-carousel-item';
      const img = document.createElement('img');
      img.className = 'younzee-carousel-img';
      img.src = product.images && product.images.length > 0 ? product.images[0] : (product.thumbnailUrl || '/no-image.jpg');
      img.alt = product.title || product.name || 'Produit';
      img.onerror = () => { img.src = 'https://younzeeadmin.vercel.app/no-image.jpg'; };
      const title = document.createElement('div');
      title.className = 'younzee-carousel-title';
      title.textContent = product.title || product.name || 'Produit';
      const price = document.createElement('div');
      price.className = 'younzee-carousel-price';
      price.textContent = (product.price ? product.price + '€' : '');
      // Ajout couleur si présente
      let colorDiv = null;
      if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
        colorDiv = document.createElement('div');
        colorDiv.style.fontSize = '10px';
        colorDiv.style.color = '#666';
        colorDiv.textContent = 'Couleur : ' + product.colors[0];
      }
      // Ajout taille si présente
      let sizeDiv = null;
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        sizeDiv = document.createElement('div');
        sizeDiv.style.fontSize = '10px';
        sizeDiv.style.marginBottom = '12px';
        sizeDiv.style.color = '#666';
        sizeDiv.textContent = 'Taille : ' + product.sizes[0];
      }
      const btn = document.createElement('button');
      btn.className = 'younzee-carousel-btn';
      btn.textContent = 'Voir le produit';
      btn.onclick = () => { if (product.handle) window.open('https://store.younzee.com/products/' + product.handle, '_blank'); };
      item.appendChild(img);
      item.appendChild(title);
      item.appendChild(price);
      if (colorDiv) item.appendChild(colorDiv);
      if (sizeDiv) item.appendChild(sizeDiv);
      item.appendChild(btn);
      track.appendChild(item);
    });
    container.appendChild(track);
    
    // Flèches si plus d'articles que d'items visibles
    if (products.length > 1) {
      // Configuration du carousel
      const containerWidth = 150; // Largeur max du container
      const itemWidth = 150; // Largeur d'un item
      const itemMargin = 16; // Margin totale (8px de chaque côté)
      const totalItemWidth = itemWidth + itemMargin; // 166px
      const visibleItems = Math.floor(containerWidth / totalItemWidth) + 1; // ~2 items visibles
      
      // Ne montrer les flèches que si nécessaire
      if (products.length > visibleItems) {
        let currentIndex = 0;
        const maxIndex = Math.max(0, products.length - visibleItems);
      
      // Fonction pour calculer la position
      const getTransformPosition = (index) => {
        if (products.length <= visibleItems) {
          // Si tous les items sont visibles, centrer
          const totalWidth = products.length * totalItemWidth;
          const centering = (containerWidth - totalWidth) / 2;
          return centering;
        }
        
        // Calculer la position pour l'index donné
        const position = -index * totalItemWidth;
        
        // Ajuster pour centrer le premier item visible
        const centeringOffset = (containerWidth - totalItemWidth) / 2;
        
        return position + centeringOffset;
      };
      
      // Fonction pour mettre à jour l'affichage
      const updateCarousel = () => {
        const position = getTransformPosition(currentIndex);
        track.style.transform = `translateX(${position}px)`;
        
        // Mettre à jour la visibilité des flèches avec les classes CSS
        if (currentIndex <= 0) {
          left.classList.add('disabled');
        } else {
          left.classList.remove('disabled');
        }
        
        if (currentIndex >= maxIndex) {
          right.classList.add('disabled');
        } else {
          right.classList.remove('disabled');
        }
      };
      
      // Flèche gauche
      const left = document.createElement('div');
      left.className = 'younzee-carousel-arrow left';
      left.innerHTML = '&#8592;';
      left.onclick = (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      };
      
      // Flèche droite
      const right = document.createElement('div');
      right.className = 'younzee-carousel-arrow right';
      right.innerHTML = '&#8594;';
      right.onclick = (e) => {
        e.stopPropagation();
        if (currentIndex < maxIndex) {
          currentIndex++;
          updateCarousel();
        }
      };
      
      container.appendChild(left);
      container.appendChild(right);
      
      // Position initiale
      updateCarousel();
      } // Fermeture du if (products.length > visibleItems)
    }
    
    return container;
  }

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

    addMessage(content, type = 'bot', showTyping = false, products = null) {
      if (showTyping && type === 'bot') {
        this.showTypingIndicator();
        setTimeout(() => {
          this.hideTypingIndicator();
          this.addMessage(content, type, false, products);
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
      
      // Support complet du markdown avec marked si disponible
      if (window.marked) {
        contentDiv.innerHTML = window.marked.parse(content);
      } else {
        // Fallback markdown amélioré
        content = this.convertMarkdownToHtml(content);
        contentDiv.innerHTML = content;
      }
      
      messageDiv.appendChild(contentDiv);
      // Ajout du carousel si products fourni et non vide
      if (type === 'bot' && products && Array.isArray(products) && products.length > 0) {
        const carousel = createCarousel(products);
        messageDiv.appendChild(carousel);
      }
      
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
      
      this.messages.push({ content, type, timestamp: new Date(), products });
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
        const response = await fetch('https://younzeeadmin.vercel.app/api/ai/master', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
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

        if (response.status !== 200) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (this.config.showTypingIndicator) {
          this.hideTypingIndicator();
        }
        
        // Ajout du carousel si data.response.products existe
        if (data.success && data.response) {
          this.addMessage(data.response.content, 'bot', false, data.response.products);
        } else {
          console.log(data);
          if (data.primaryType === 'FALLBACK') {
            this.addMessage(data.message, 'bot');
          } else {
            this.addMessage('Désolé, une erreur s\'est produite. Veuillez réessayer.', 'bot');
          }
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

    // Nouvelle méthode pour convertir le markdown en HTML
    convertMarkdownToHtml(text) {
      // Échapper les caractères HTML d'abord
      text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      
      // Titres (# ## ###)
      text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      
      // Images
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;">');
      
      // Gras et italique
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Liens
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #ffdd5b; text-decoration: underline;">$1</a>');
      
      // Retours à la ligne
      text = text.replace(/\n\n/g, '</p><p>');
      text = text.replace(/\n/g, '<br>');
      
      // Entourer dans un paragraphe
      if (!text.includes('<h1>') && !text.includes('<h2>') && !text.includes('<h3>')) {
        text = '<p>' + text + '</p>';
      }
      
      return text;
    }
  }

  // Exposition globale
  window.YounzeeChatbot = YounzeeChatbot;

  // Auto-initialisation si configuré
  if (window.younzeeChatbotConfig) {
    new YounzeeChatbot(window.younzeeChatbotConfig);
  }

})();
