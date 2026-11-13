(function() {
  'use strict';

  // Configuration par défaut avec améliorations
  const DEFAULT_CONFIG = {
    chatbotId: 'wikzy-premium',
    title: 'Assistant Wikzy',
    subtitle: 'Votre styliste personnel, toujours à vos côtés',
    apiEndpoint: 'http://localhost:3000/api/ai/master',
    position: 'bottom-right',
    primaryColor: '#ff6f61',
    secondaryColor: '#ffdd5b',
    accentColor: '#ffdd5b',
    textColor: '#1F2937',
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    size: 'standard',
    showTypingIndicator: true,
    enableSound: true,
    autoOpen: false,
    autoOpenDelay: 2000,
    welcomeMessage: '✨ Bonjour ! Je suis Wikzy, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
    placeholder: 'Ex: Robe rouge, taille M...',
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement',
      verbosity: 'Détaillé',
      empathy: 'Élevée',
      proactivity: 'Proactif'
    },
    fontFamily: '"Poppins", sans-serif',
    fontSize: 15,
    buttonSize: 72,
    borderWidth: 0,
    borderColor: 'transparent',
    headerBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
    headerTextColor: '#FFFFFF',
    headerPadding: 18,
    headerTitleFontSize: 19,
    avatarType: 'image', // 'image' ou 'none'
    avatarValue: 'http://localhost:3000/styli.png',
    buttonBackgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
    buttonIconColor: '#FFFFFF',
    closeButtonColor: '#FFFFFF',
    shadowEffect: 'medium',
    animationStyle: 'gradient-pulse',
    customIcon: null,
    attentionText: {
      enabled: false, // Sera activé automatiquement si autoOpen est false
      messages: [
        'Trouvez votre style !',
        'Besoin d\'aide ? 💬',
        'Découvrez nos tendances ✨',
        'Parlons mode ! 👗',
        'Une question ? 🤔'
      ],
      color: '#FFFFFF',
      backgroundColor: 'linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%)',
      animation: 'bounce',
      duration: 3000,
      delay: 3000,
      repeatInterval: 8000,
      particleEffect: false,
      trailEffect: false,
      orbitRadius: 60,
      orbitSpeed: 5,
      orbitDirection: 'clockwise',
      curveIntensity: 0
    },
    theme: 'dark', // Support du mode clair/sombre
    quickReplies: ["Je voudrais une robe blanche d'été en L", 'Propose moi des bottines marrons en 44'], // Suggestions rapides
    enableQuickReplies: true, // Activer/désactiver les réponses rapides
    enableEmojis: true, // Autoriser l'utilisation d'emojis dans les messages
    enableFileUpload: false, // Autoriser l'upload de fichiers
    maxConversationLength: 50, // Nombre maximum de messages par conversation
    responseDelay: 1000, // Délai de simulation de réponse (ms)
    enableReadReceipts: false, // Afficher les accusés de lecture
    workingHours: { // Heures d'ouverture
      enabled: false,
      start: '09:00',
      end: '18:00',
      timezone: 'Europe/Paris',
      offlineMessage: 'Nous sommes actuellement fermés. Laissez-nous un message !'
    },
    customCSS: '', // CSS personnalisé à injecter
    enableMarkdown: true, // Support du markdown dans les messages
    showTimestamps: true, // Afficher les horodatages des messages
    showAvatars: true, // Afficher les avatars
      enableFeedback: true, // Système de feedback (like/dislike)
      gdprCompliant: true, // Conformité RGPD
      standalone: false // Mode autonome (plein écran sans bouton)
    };

  // Fonction pour générer les variables CSS dynamiques
  const getRootStyles = (config) => `
    :root {
      --primary-color: ${config.primaryColor || DEFAULT_CONFIG.primaryColor};
      --secondary-color: ${config.secondaryColor || DEFAULT_CONFIG.secondaryColor};
      --accent-color: ${config.accentColor || DEFAULT_CONFIG.accentColor};
      --text-color: ${config.textColor || DEFAULT_CONFIG.textColor};
      --background-color: ${config.backgroundColor || DEFAULT_CONFIG.backgroundColor};
      --font-family: ${config.fontFamily || DEFAULT_CONFIG.fontFamily};
      --font-size: ${config.fontSize || DEFAULT_CONFIG.fontSize}px;
      --button-size: ${config.buttonSize || DEFAULT_CONFIG.buttonSize}px;
      --border-radius: ${config.borderRadius || DEFAULT_CONFIG.borderRadius};
      --border-width: ${config.borderWidth !== undefined ? config.borderWidth : DEFAULT_CONFIG.borderWidth}px;
      --border-color: ${config.borderColor || DEFAULT_CONFIG.borderColor};
      --header-bg: ${config.headerBackgroundColor || config.primaryColor || DEFAULT_CONFIG.headerBackgroundColor};
      --header-text: ${config.headerTextColor || DEFAULT_CONFIG.headerTextColor};
      --header-padding: ${config.headerPadding || DEFAULT_CONFIG.headerPadding}px;
      --header-title-size: ${config.headerTitleFontSize || DEFAULT_CONFIG.headerTitleFontSize}px;
      --btn-bg: ${config.buttonBackgroundColor || config.primaryColor || DEFAULT_CONFIG.buttonBackgroundColor};
      --btn-icon: ${config.buttonIconColor || '#FFFFFF'};
      --close-btn: ${config.closeButtonColor || DEFAULT_CONFIG.closeButtonColor};
      --attention-bg: ${(config.attentionText && config.attentionText.backgroundColor) || DEFAULT_CONFIG.attentionText.backgroundColor};
      --attention-color: ${(config.attentionText && config.attentionText.color) || DEFAULT_CONFIG.attentionText.color};
      --orbit-radius: ${(config.attentionText && config.attentionText.orbitRadius) || DEFAULT_CONFIG.attentionText.orbitRadius}px;
      --orbit-speed: ${(config.attentionText && config.attentionText.orbitSpeed) || DEFAULT_CONFIG.attentionText.orbitSpeed}s;
    }
  `;

  // Classes CSS avec design premium
  const BASE_STYLES = `
    .wikzy-chatbot-window {
      border: var(--border-width) solid var(--border-color) !important;
      border-radius: var(--border-radius) !important;
      font-size: var(--font-size) !important;
      background-color: var(--background-color) !important;
      color: var(--text-color) !important;
    }

    .wikzy-chatbot-message-content {
      font-size: var(--font-size) !important;
    }

    .wikzy-chatbot-message-content div:empty {
      display: block !important;
    }

    .wikzy-chatbot-message-content hr {
      margin: 20px 0 !important;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .wikzy-chatbot-messages p img {
      height: 180px;
      max-width: 100%;
      border-radius: 12px;
      object-fit: cover;
      margin: 10px 0;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .wikzy-chatbot-messages p img:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .wikzy-chatbot-messages ul {
      list-style: disc !important;
      padding-left: 24px;
      margin: 8px 0;
    }
    
    .wikzy-chatbot-message-content p {
      margin: 0;
      line-height: 1.7;
      font-size: 15px;
    }

    .wikzy-chatbot-container {
      position: fixed;
      z-index: 1000000;
      font-family: var(--font-family);
      user-select: none;
      transition: filter 0.3s ease;
    }
    
    .wikzy-chatbot-container.bottom-right {
      bottom: 28px;
      right: 28px;
    }
    
    .wikzy-chatbot-container.bottom-left {
      bottom: 28px;
      left: 28px;
    }
    
    .wikzy-chatbot-container.top-right {
      top: 28px;
      right: 28px;
    }

    .wikzy-chatbot-input-wrapper {
      display: flex;
    }
    
    .wikzy-chatbot-container.top-left {
      top: 28px;
      left: 28px;
    }
    
    .wikzy-chatbot-button {
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      color: var(--btn-icon);
      background: var(--btn-bg);
      font-size: calc(var(--button-size) * 0.45);
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
      padding: 0 !important; /* Reset padding to center icon */
    }

    .wikzy-chatbot-button img {
      width: 150%;
      max-width: 150%;
      height: 150%;
      object-fit: initial;
      pointer-events: none;
      margin-top: 50px;
    }

    .wikzy-chatbot-button svg {
      width: 50%;
      height: 50%;
      pointer-events: none;
    }
    
    .wikzy-chatbot-button.neumorphic {
      background: linear-gradient(145deg, #f0f0f0, #ffffff);
      box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
    }
    
    .wikzy-chatbot-button.gradient-pulse {
      background: linear-gradient(45deg, var(--primary-color), var(--accent-color), var(--secondary-color));
      background-size: 200% 200%;
      animation: gradientPulse 8s ease infinite;
    }
    
    .wikzy-chatbot-button:hover {
      transform: scale(1.12) rotate(8deg);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    
    .wikzy-chatbot-button:active::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      animation: ripple 0.6s ease-out;
    }
    
    @keyframes gradientPulse {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes ripple {
      0% { width: 0; height: 0; opacity: 1; transform: translate(-50%, -50%); }
      100% { width: 200px; height: 200px; opacity: 0; transform: translate(-50%, -50%); }
    }
    
    .wikzy-chatbot-window {
      position: absolute;
      bottom: calc(var(--button-size) + 20px);
      right: 0;
      width: var(--window-width, 420px);
      height: var(--window-height, 565px);
      background: var(--background-color);
      backdrop-filter: blur(20px);
      border-radius: var(--border-radius);
      box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
      border: var(--border-width) solid var(--border-color);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: popIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: bottom right;
    }

    /* Ajustements selon la position */
    .wikzy-chatbot-container.bottom-left .wikzy-chatbot-window {
      right: auto;
      left: 0;
      transform-origin: bottom left;
    }

    .wikzy-chatbot-container.top-right .wikzy-chatbot-window {
      bottom: auto;
      top: calc(var(--button-size) + 20px);
      transform-origin: top right;
    }

    .wikzy-chatbot-container.top-left .wikzy-chatbot-window {
      bottom: auto;
      right: auto;
      left: 0;
      top: calc(var(--button-size) + 20px);
      transform-origin: top left;
    }
    
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.8) translateY(40px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    .wikzy-chatbot-window.open {
      display: flex;
    }
    
    .wikzy-chatbot-header {
      padding: var(--header-padding);
      border-bottom: 1px solid rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--header-bg);
      color: var(--header-text);
    }
    
    .wikzy-chatbot-header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .wikzy-chatbot-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--header-text);
      background: rgba(255, 255, 255, 0.2);
      transition: transform 0.3s ease;
      overflow: hidden;
    }
    
    .wikzy-chatbot-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .wikzy-chatbot-avatar:hover {
      transform: scale(1.08);
    }
    
    .wikzy-chatbot-header-text h3 {
      margin: 0;
      font-size: var(--header-title-size);
      font-weight: 700;
      color: var(--header-text);
    }
    
    .wikzy-chatbot-header-text p {
      margin: 0;
      font-size: 13px;
      color: var(--header-text);
      opacity: 0.85;
    }
    
    .wikzy-chatbot-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      font-size: 19px;
      cursor: pointer;
      color: var(--close-btn);
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .wikzy-chatbot-close:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: rotate(180deg);
    }
    
    .wikzy-chatbot-messages {
      flex: 1;
      padding: 18px;
      overflow-y: auto;
      background: var(--background-color); /* Utilise le fond du thème au lieu d'un fond blanc fixe */
      scrollbar-width: thin;
      scrollbar-color: var(--accent-color) transparent;
    }
    
    .wikzy-chatbot-messages::-webkit-scrollbar {
      width: 5px;
    }
    
    .wikzy-chatbot-messages::-webkit-scrollbar-thumb {
      background: var(--accent-color);
      border-radius: 2.5px;
    }
    
    .wikzy-chatbot-message {
      margin-bottom: 18px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex-direction: column;
      animation: messageIn 0.3s ease;
    }
    
    @keyframes messageIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    
    .wikzy-chatbot-message.user {
      flex-direction: row-reverse;
    }

    .wikzy-chatbot-message.bot {
      flex-direction: column;
    }
    
    .wikzy-chatbot-message-content {
      max-width: 80%;
      padding: 12px 24px;
      border-radius: 18px;
      font-size: 15px;
      line-height: 1.6;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .wikzy-chatbot-message-content:hover {
      transform: translateY(-3px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }

    .wikzy-chatbot-message-content h2 {
      font-size: 15px !important;
      font-weight: 700 !important;
      margin: 6px 0 !important;
    }

    .wikzy-chatbot-message.user .wikzy-chatbot-message-content {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      border-bottom-right-radius: 6px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }
    
    .wikzy-chatbot-message.bot .wikzy-chatbot-message-content {
      background: rgba(255, 255, 255, 0.95);
      color: #1F2937; /* Texte toujours sombre sur bulle blanche */
      border-bottom-left-radius: 6px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(6px);
    }
    
    .wikzy-chatbot-input-container {
      padding: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: var(--background-color); /* Dynamique */
      backdrop-filter: blur(16px);
    }

    .wikzy-chatbot-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .wikzy-chatbot-quick-reply {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--accent-color);
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: #1F2937; /* Toujours sombre sur fond clair */
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .wikzy-chatbot-quick-reply:hover {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      transform: scale(1.05);
    }

    .wikzy-chatbot-input {
      flex: 1;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 10px 18px;
      font-size: 15px;
      outline: none;
      resize: none;
      max-height: 100px;
      min-height: 44px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-color);
      transition: all 0.3s ease;
    }
    
    .wikzy-chatbot-input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(255, 111, 97, 0.3);
      background: white;
    }
    
    .wikzy-chatbot-send {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      color: white;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      transition: all 0.3s ease;
    }
    
    .wikzy-chatbot-send:hover {
      transform: scale(1.12) rotate(12deg);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .wikzy-chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .wikzy-chatbot-typing {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 12px 18px !important;
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 18px !important;
      border-bottom-left-radius: 6px !important;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15) !important;
      max-width: 25% !important;
      min-width: 25% !important;
      min-height: 44px !important;
      margin-bottom: 0 !important;
      margin-top: 0 !important;
      backdrop-filter: blur(6px);
    }
    
    .wikzy-chatbot-typing-dot {
      width: 7px !important;
      height: 7px !important;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color)) !important;
      border-radius: 50% !important;
      animation: typing 1s ease-in-out infinite;
      display: block !important;
    }
    
    .wikzy-chatbot-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .wikzy-chatbot-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
      30% { transform: translateY(-10px); opacity: 1; }
    }
    
    .wikzy-chatbot-powered {
      text-align: center;
      padding: 10px;
      font-size: 11px;
      color: var(--text-color);
      opacity: 0.5;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      background: transparent;
    }
    
    .wikzy-chatbot-powered a {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    
    .wikzy-chatbot-powered a:hover {
      color: var(--secondary-color);
    }
    
    .wikzy-attention-text-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: calc(var(--button-size) + 100px);
      height: calc(var(--button-size) + 100px);
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      perspective: 800px;
      z-index: 1001;
    }
    
    .wikzy-chatbot-container.bottom-right,
    .wikzy-chatbot-container.top-right {
      --attention-x: -85%;
    }

    .wikzy-chatbot-container.bottom-left,
    .wikzy-chatbot-container.top-left {
      --attention-x: -15%;
    }
    
    .wikzy-attention-text {
      position: absolute;
      left: 50%;
      display: inline-flex;
      background: var(--attention-bg);
      color: var(--attention-color);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      opacity: 0;
      white-space: nowrap;
      padding: 6px 14px;
      z-index: 1002;
      transform: translateX(var(--attention-x, -50%));
      pointer-events: none;
    }

    /* Positionnement par défaut */
    .wikzy-chatbot-container.bottom-right .wikzy-attention-text,
    .wikzy-chatbot-container.bottom-left .wikzy-attention-text {
      bottom: calc(50% + (var(--button-size) / 2) + 12px);
    }

    .wikzy-chatbot-container.top-right .wikzy-attention-text,
    .wikzy-chatbot-container.top-left .wikzy-attention-text {
      top: calc(50% + (var(--button-size) / 2) + 12px);
    }
    
    .wikzy-attention-text span {
      display: inline-block;
      margin: 0 0.6px;
      font-size: 12px;
    }
    
    .wikzy-attention-text.trail::after {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: var(--attention-bg);
      filter: blur(8px);
      opacity: 0.3;
      animation: trail 5s ease-in-out infinite;
      z-index: -1;
    }
    
    .wikzy-attention-text.particle::after {
      content: '';
      position: absolute;
      top: -8px;
      left: -8px;
      right: -8px;
      bottom: -8px;
      background: var(--attention-bg);
      opacity: 0.4;
      filter: blur(4px);
      border-radius: 50%;
      animation: particle 3s ease-in-out infinite;
      z-index: -1;
    }
    
    .wikzy-attention-text.fade {
      animation: fadeAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .wikzy-attention-text.slide {
      animation: slideAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .wikzy-attention-text.bounce {
      animation: bounceAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .wikzy-attention-text.glow {
      animation: glowAttention 1.5s ease-in-out;
    }
    
    .wikzy-attention-text.pop {
      animation: popAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .wikzy-attention-text.wave {
      animation: waveAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .wikzy-attention-text.orbit-3d {
      animation: orbitAttention3D var(--orbit-speed, 5s) linear infinite;
      transform-origin: center center;
    }
    
    @keyframes fadeAttention {
      0% { opacity: 0; transform: translateX(var(--attention-x, -50%)); }
      20% { opacity: 1; transform: translateX(var(--attention-x, -50%)); }
      80% { opacity: 1; transform: translateX(var(--attention-x, -50%)); }
      100% { opacity: 0; transform: translateX(var(--attention-x, -50%)); }
    }
    
    @keyframes slideAttention {
      0% { opacity: 0; transform: translate(var(--attention-x, -50%), 10px) scale(0.9); }
      20% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) scale(1); }
      80% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--attention-x, -50%), 10px) scale(0.9); }
    }
    
    @keyframes bounceAttention {
      0% { opacity: 0; transform: translate(var(--attention-x, -50%), 20px); }
      20% { opacity: 1; transform: translate(var(--attention-x, -50%), 0); }
      50% { transform: translate(var(--attention-x, -50%), -10px); }
      80% { opacity: 1; transform: translate(var(--attention-x, -50%), 0); }
      100% { opacity: 0; transform: translate(var(--attention-x, -50%), 20px); }
    }
    
    @keyframes glowAttention {
      0% { opacity: 0; transform: translateX(var(--attention-x, -50%)); box-shadow: 0 0 0 rgba(255, 111, 97, 0); }
      20% { opacity: 1; transform: translateX(var(--attention-x, -50%)); box-shadow: 0 0 20px rgba(255, 111, 97, 0.6); }
      80% { opacity: 1; transform: translateX(var(--attention-x, -50%)); box-shadow: 0 0 20px rgba(255, 111, 97, 0.6); }
      100% { opacity: 0; transform: translateX(var(--attention-x, -50%)); box-shadow: 0 0 0 rgba(255, 111, 97, 0); }
    }
    
    @keyframes popAttention {
      0% { opacity: 0; transform: translate(var(--attention-x, -50%), 10px) scale(0.7); }
      20% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) scale(1.1); }
      40% { transform: translate(var(--attention-x, -50%), 0) scale(0.95); }
      80% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) scale(1); }
      100% { opacity: 0; transform: translate(var(--attention-x, -50%), 10px) scale(0.7); }
    }
    
    @keyframes waveAttention {
      0% { opacity: 0; transform: translate(var(--attention-x, -50%), 15px) rotate(-6deg); }
      20% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) rotate(0deg); }
      40% { transform: translate(var(--attention-x, -50%), 0) rotate(4deg); }
      60% { transform: translate(var(--attention-x, -50%), 0) rotate(-4deg); }
      80% { opacity: 1; transform: translate(var(--attention-x, -50%), 0) rotate(0deg); }
      100% { opacity: 0; transform: translate(var(--attention-x, -50%), 15px) rotate(6deg); }
    }
    
    @keyframes particle {
      0% { transform: scale(1); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 0.6; }
      100% { transform: scale(1); opacity: 0.4; }
    }
    
    @keyframes trail {
      0% { opacity: 0.3; transform: translateX(-10px) scale(0.8); }
      50% { opacity: 0.6; transform: translateX(10px) scale(1.2); }
      100% { opacity: 0.3; transform: translateX(-10px) scale(0.8); }
    }
    
    @media (prefers-color-scheme: dark) {
      .wikzy-chatbot-container[data-theme="auto"] {
        --background-color: rgba(30, 30, 30, 0.9);
        --text-color: #E5E7EB;
      }
      
      .wikzy-chatbot-container[data-theme="auto"] .wikzy-chatbot-messages {
        background: linear-gradient(180deg, rgba(40, 40, 40, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
      }
      
      .wikzy-chatbot-container[data-theme="auto"] .wikzy-chatbot-message.bot .wikzy-chatbot-message-content {
        background: rgba(50, 50, 50, 0.95);
        color: #E5E7EB;
      }
      
      .wikzy-chatbot-container[data-theme="auto"] .wikzy-chatbot-input-container {
        background: rgba(30, 30, 30, 0.9);
      }
      
      .wikzy-chatbot-container[data-theme="auto"] .wikzy-chatbot-powered {
        background: rgba(30, 30, 30, 0.9);
        color: #9CA3AF;
      }
    }
    
    /* Mode Standalone (Plein écran pour iframe) */
    .wikzy-chatbot-container.standalone {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      border-radius: 0;
    }

    .wikzy-chatbot-container.standalone .wikzy-chatbot-button,
    .wikzy-chatbot-container.standalone .wikzy-attention-text-container {
      display: none !important;
    }

    .wikzy-chatbot-container.standalone .wikzy-chatbot-window {
      position: relative;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 100%;
      border-radius: 0;
      box-shadow: none;
      border: none;
      display: flex !important;
      animation: none;
    }

    .wikzy-chatbot-container.standalone .wikzy-chatbot-close {
      display: none !important;
    }

    @media (max-width: 480px) {
      .wikzy-chatbot-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        bottom: calc(var(--button-size) + 20px);
        right: 20px;
        left: 20px;
      }
      
      .wikzy-attention-text-container {
        --orbit-radius: 34px;
        width: calc(var(--button-size) + var(--orbit-radius) * 2);
        height: calc(var(--button-size) + var(--orbit-radius) * 2);
        top: calc(var(--orbit-radius) * -1);
        left: calc(var(--orbit-radius) * -1);
      }
      
      .wikzy-attention-text {
        font-size: 11px;
        padding: 5px 10px;
      }
      
      .wikzy-attention-text span {
        font-size: 10px;
        margin: 0 0.4px;
        transform-origin: center calc(var(--button-size) / 2 + var(--orbit-radius));
      }
      
      .wikzy-chatbot-quick-reply {
        font-size: 12px;
        padding: 6px 12px;
      }
    }
  `;

  // CSS du carousel (amélioré pour plus de dynamisme)
  const CAROUSEL_CSS = `
    .wikzy-carousel-container {
      margin-top: 14px;
      width: 100%;
      max-width: 360px;
      overflow: hidden;
      position: relative;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 14px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 14px 0 10px 0;
      backdrop-filter: blur(10px);
    }
    .wikzy-carousel-track {
      display: flex;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .wikzy-carousel-item {
      min-width: 150px;
      max-width: 150px;
      max-height: 280px;
      margin: 0 8px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 8px 12px 8px;
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .wikzy-carousel-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    .wikzy-carousel-img {
      width: 130px;
      height: 130px;
      object-fit: cover;
      border-radius: 8px;
      background: #f3f4f6;
      margin-bottom: 8px;
      transition: transform 0.3s ease;
    }
    .wikzy-carousel-img:hover {
      transform: scale(1.03);
    }
    .wikzy-carousel-title {
      font-size: 11px;
      font-weight: 600;
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
    .wikzy-carousel-price {
      font-size: 10px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
      position: absolute;
      background: linear-gradient(135deg, #ffdd5b, #ff6f61);
      padding: 3px 8px;
      border-radius: 10px;
      top: 110px;
      right: 10px;
    }
    .wikzy-carousel-btn {
      background: linear-gradient(135deg, #ffdd5b, #ff6f61);
      color: #1f2937;
      border: none;
      border-radius: 20px;
      padding: 5px 14px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      margin-top: auto;
      transition: all 0.3s ease;
    }
    .wikzy-carousel-btn:hover {
      background: linear-gradient(135deg, #ffe88a, #ff8a80);
      transform: scale(1.06);
    }
    .wikzy-carousel-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.95);
      border: none;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #1f2937;
      cursor: pointer;
      z-index: 2;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      backdrop-filter: blur(6px);
    }
    .wikzy-carousel-arrow:hover {
      background: linear-gradient(135deg, #ffdd5b, #ff6f61);
      transform: translateY(-50%) scale(1.12);
      color: white;
    }
    .wikzy-carousel-arrow:active {
      transform: translateY(-50%) scale(0.95);
    }
    .wikzy-carousel-arrow.disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }
    .wikzy-carousel-arrow.left { left: 5px; }
    .wikzy-carousel-arrow.right { right: 5px; }
  `;

  // Ajoute le CSS du carousel
  function injectCarouselStyles() {
    if (!document.getElementById('wikzy-carousel-styles')) {
      const style = document.createElement('style');
      style.id = 'wikzy-carousel-styles';
      style.textContent = CAROUSEL_CSS;
      document.head.appendChild(style);
    }
  }

  // Génère le HTML du carousel
  function createCarousel(products) {
    injectCarouselStyles();
    const container = document.createElement('div');
    container.className = 'wikzy-carousel-container';
    const track = document.createElement('div');
    track.className = 'wikzy-carousel-track';
    products.forEach((product) => {
      const item = document.createElement('div');
      item.className = 'wikzy-carousel-item';
      const img = document.createElement('img');
      img.className = 'wikzy-carousel-img';
      img.src = product.images && product.images.length > 0 ? product.images[0] : (product.thumbnailUrl || '/no-image.jpg');
      img.alt = product.title || product.name || 'Produit';
      img.onerror = () => { img.src = 'https://wikzyadmin.vercel.app/no-image.jpg'; };
      const title = document.createElement('div');
      title.className = 'wikzy-carousel-title';
      title.textContent = product.title || product.name || 'Produit';
      const price = document.createElement('div');
      price.className = 'wikzy-carousel-price';
      price.textContent = product.price ? `${product.price}€` : '';
      let colorDiv = null;
      if (product.colors && Array.isArray(product.colors) && product.colors.length > 0) {
        colorDiv = document.createElement('div');
        colorDiv.style.fontSize = '10px';
        colorDiv.style.color = '#666';
        colorDiv.textContent = 'Couleur : ' + product.colors[0];
      }
      let sizeDiv = null;
      if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
        sizeDiv = document.createElement('div');
        sizeDiv.style.fontSize = '10px';
        sizeDiv.style.marginBottom = '12px';
        sizeDiv.style.color = '#666';
        sizeDiv.textContent = 'Taille : ' + product.sizes[0];
      }
      const btn = document.createElement('button');
      btn.className = 'wikzy-carousel-btn';
      btn.textContent = 'Découvrir';
      btn.onclick = () => { if (product.handle) window.open('https://store.wikzy.com/products/' + product.handle, '_blank'); };
      item.appendChild(img);
      item.appendChild(title);
      item.appendChild(price);
      if (colorDiv) item.appendChild(colorDiv);
      if (sizeDiv) item.appendChild(sizeDiv);
      item.appendChild(btn);
      track.appendChild(item);
    });
    container.appendChild(track);
    
    if (products.length > 1) {
      const containerWidth = 360;
      const itemWidth = 150;
      const itemMargin = 16;
      const totalItemWidth = itemWidth + itemMargin;
      const visibleItems = Math.floor(containerWidth / totalItemWidth);
      
      if (products.length > visibleItems) {
        let currentIndex = 0;
        const maxIndex = Math.max(0, products.length - visibleItems);
        
        const getTransformPosition = (index) => {
          if (products.length <= visibleItems) {
            const totalWidth = products.length * totalItemWidth;
            const centering = (containerWidth - totalWidth) / 2;
            return centering;
          }
          const position = -index * totalItemWidth;
          const centeringOffset = (containerWidth - totalItemWidth - 140) / 2;
          return position + centeringOffset;
        };
        
        const updateCarousel = () => {
          const position = getTransformPosition(currentIndex);
          track.style.transform = `translateX(${position}px)`;
          left.classList.toggle('disabled', currentIndex <= 0);
          right.classList.toggle('disabled', currentIndex >= maxIndex);
        };
        
        const left = document.createElement('div');
        left.className = 'wikzy-carousel-arrow left';
        left.innerHTML = '&#8592;';
        left.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex > 0) {
            currentIndex--;
            updateCarousel();
            playSound('click');
          }
        };
        
        const right = document.createElement('div');
        right.className = 'wikzy-carousel-arrow right';
        right.innerHTML = '&#8594;';
        right.onclick = (e) => {
          e.stopPropagation();
          if (currentIndex < maxIndex) {
            currentIndex++;
            updateCarousel();
            playSound('click');
          }
        };
        
        container.appendChild(left);
        container.appendChild(right);
        updateCarousel();
      }
    }
    
    return container;
  }

  // Fonction pour jouer des sons
  function playSound(type) {
    if (!window.WikzyChatbotInstance || !window.WikzyChatbotInstance.config.enableSound) return;
    const sounds = {
      click: 'https://assets.mixkit.co/sfx/preview/mixkit-click-soft-1110.mp3',
      send: 'https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3',
      open: 'https://assets.mixkit.co/sfx/preview/mixkit-pop-alert-2353.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  }

  class WikzyChatbot {
    constructor(config = {}, targetContainer = null) {
      this.config = { ...DEFAULT_CONFIG, ...config };
      this.targetContainer = targetContainer;
      this.isOpen = false;
      this.messages = [];
      this.container = null;
      this.messagesContainer = null;
      this.inputElement = null;
      this.sendButton = null;
      this.attentionInterval = null;
      this.currentMessageIndex = 0; // Pour alterner entre les messages flottants
      window.WikzyChatbotInstance = this; // Pour accès global aux sons
      
      this.init();
    }

    init() {
      this.detectTheme();
      this.injectStyles();
      this.createChatbot();
      this.bindEvents();
      
      // Gérer le mode standalone
      if (this.config.standalone) {
        this.open();
        this.container.classList.add('standalone');
        return;
      }
      
      // Activer les messages flottants si l'ouverture automatique n'est pas activée
      if (!this.config.autoOpen) {
        this.config.attentionText.enabled = true;
      }
      
      if (this.config.autoOpen) {
        setTimeout(() => {
          this.open();
          playSound('open');
        }, this.config.autoOpenDelay);
      }
      
      if (this.config.welcomeMessage) {
        this.addMessage(this.config.welcomeMessage, 'bot');
      }
      
      // Démarrer les messages flottants seulement si le chatbot ne s'ouvre pas automatiquement
      if (this.config.attentionText.enabled && !this.config.autoOpen) {
        this.startAttentionAnimation();
      }
    }

    detectTheme() {
      if (this.config.theme === 'auto') {
        this.config.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      document.addEventListener('DOMContentLoaded', () => {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (this.config.theme === 'auto') {
            this.updateConfig({ theme: e.matches ? 'dark' : 'light' });
          }
        });
      });
    }

    injectStyles() {
      let style = document.getElementById('wikzy-chatbot-styles');
      if (!style) {
        // Injecter les polices Google Fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&display=swap';
        document.head.appendChild(fontLink);
        
        style = document.createElement('style');
        style.id = 'wikzy-chatbot-styles';
        document.head.appendChild(style);
      }
      
      let css = getRootStyles(this.config) + BASE_STYLES + CAROUSEL_CSS;
      
      const sizes = {
        compact: { width: '360px', height: '460px' },
        standard: { width: '420px', height: '570px' },
        large: { width: '500px', height: '640px' }
      };
      
      const currentSize = this.config.size || 'standard';
      const sizeConfig = sizes[currentSize] || sizes.standard;
      
      css = css.replace(/var\(--window-width, ([^)]+)\)/g, sizeConfig.width);
      css = css.replace(/var\(--window-height, ([^)]+)\)/g, sizeConfig.height);
      
      const shadows = {
        none: 'none',
        light: '0 2px 10px rgba(0, 0, 0, 0.1)',
        medium: '0 5px 20px rgba(0, 0, 0, 0.15)',
        strong: '0 10px 30px rgba(0, 0, 0, 0.2)',
        neumorphic: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7)'
      };
      
      const currentShadow = this.config.shadowEffect || 'medium';
      const shadowValue = shadows[currentShadow] || shadows.medium;
      const shadowHoverValue = shadows[currentShadow === 'strong' || currentShadow === 'neumorphic' ? 'strong' : 'medium'];
      
      css = css.replace(/var\(--shadow-effect, ([^)]+)\)/g, shadowValue);
      css = css.replace(/var\(--shadow-hover, ([^)]+)\)/g, shadowHoverValue);
      
      style.textContent = css;
    }

    createChatbot() {
      this.container = document.createElement('div');
      this.container.className = `wikzy-chatbot-container ${this.config.position}`;
      this.container.dataset.theme = this.config.theme;
      
      const firstMessage = this.config.attentionText.messages ? this.config.attentionText.messages[0] : 'Trouvez votre style !';
      
      // Générer le HTML de l'avatar du header
      let avatarHTML = '';
      if (this.config.avatarType === 'image' && this.config.avatarValue) {
        avatarHTML = `
          <div class="wikzy-chatbot-avatar">
            <img src="${this.config.avatarValue}" alt="Avatar">
          </div>
        `;
      }

      // Déterminer l'icône du bouton
      let buttonIconHTML = '';
      const bubbleIcon = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 11.5C21 15.5868 17.1944 18.8889 12.5 18.8889C11.5815 18.8889 10.6939 18.7604 9.87477 18.5209L5.5 21V16.4111C3.94136 15.0566 3 13.3601 3 11.5C3 7.41319 6.80558 4.11111 11.5 4.11111C16.1944 4.11111 21 7.41319 21 11.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      if (this.config.customIcon) {
        buttonIconHTML = this.config.customIcon;
      } else if (this.config.avatarType === 'image' && this.config.avatarValue) {
        buttonIconHTML = `<img src="${this.config.avatarValue}" alt="Avatar">`;
      } else {
        buttonIconHTML = bubbleIcon;
      }
      
      this.container.innerHTML = `
        <button class="wikzy-chatbot-button ${this.config.shadowEffect} ${this.config.animationStyle}">
          ${buttonIconHTML}
        </button>
        <div class="wikzy-attention-text-container" style="display: none;">
          <div class="wikzy-attention-text ${this.config.attentionText.animation}${this.config.attentionText.particleEffect ? ' particle' : ''}${this.config.attentionText.trailEffect ? ' trail' : ''}">
            ${this.config.attentionText.messages ? this.config.attentionText.messages[0] : 'Trouvez votre style !'}
          </div>
        </div>
        <div class="wikzy-chatbot-window">
          <div class="wikzy-chatbot-header">
            <div class="wikzy-chatbot-header-content">
              ${avatarHTML}
              <div class="wikzy-chatbot-header-text">
                <h3 style="font-family: inherit;">${this.config.title}</h3>
                <p>${this.config.subtitle}</p>
              </div>
            </div>
            <button class="wikzy-chatbot-close">✕</button>
          </div>
          
          <div class="wikzy-chatbot-messages"></div>
          
          <div class="wikzy-chatbot-input-container">
            <div class="wikzy-chatbot-quick-replies"></div>
            <div class="wikzy-chatbot-input-wrapper">
              <textarea 
                class="wikzy-chatbot-input" 
                placeholder="${this.config.placeholder}"
                rows="1"
                style="margin-right: 10px;"
              ></textarea>
              <button class="wikzy-chatbot-send">➤</button>
            </div>
          </div>
          
          <div class="wikzy-chatbot-powered">
            Propulsé par <a href="https://wikzy.com" target="_blank">Wikzy</a>
          </div>
        </div>
      `;
      
      if (this.targetContainer) {
        this.targetContainer.appendChild(this.container);
      } else {
        document.body.appendChild(this.container);
      }
      
      this.messagesContainer = this.container.querySelector('.wikzy-chatbot-messages');
      this.inputElement = this.container.querySelector('.wikzy-chatbot-input');
      this.sendButton = this.container.querySelector('.wikzy-chatbot-send');
      
      this.renderQuickReplies();
    }

    renderQuickReplies() {
      const quickRepliesContainer = this.container.querySelector('.wikzy-chatbot-quick-replies');
      quickRepliesContainer.innerHTML = '';
      this.config.quickReplies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'wikzy-chatbot-quick-reply';
        button.textContent = reply;
        button.onclick = () => {
          this.inputElement.value = reply;
          this.sendMessage();
          playSound('click');
        };
        quickRepliesContainer.appendChild(button);
      });
    }

    bindEvents() {
      const button = this.container.querySelector('.wikzy-chatbot-button');
      const closeButton = this.container.querySelector('.wikzy-chatbot-close');
      
      button.addEventListener('click', () => {
        this.toggle();
        playSound('click');
      });
      closeButton.addEventListener('click', () => {
        this.close();
        playSound('click');
      });
      
      this.inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
      
      this.inputElement.addEventListener('input', () => {
        this.autoResize();
      });
      
      this.sendButton.addEventListener('click', () => {
        this.sendMessage();
        playSound('send');
      });
    }

    startAttentionAnimation() {
      const attentionTextContainer = this.container.querySelector('.wikzy-attention-text-container');
      const attentionText = this.container.querySelector('.wikzy-attention-text');
      
      if (!attentionText || !attentionTextContainer) return;
      
      // Afficher le conteneur
      attentionTextContainer.style.display = 'flex';
      
      const showAttention = () => {
        // Sélectionner le message suivant
        const messages = this.config.attentionText.messages || ['Trouvez votre style !'];
        const currentMessage = messages[this.currentMessageIndex];
        this.currentMessageIndex = (this.currentMessageIndex + 1) % messages.length;
        
        // Mettre à jour le texte
        attentionText.textContent = currentMessage;
        
        // Retirer et remettre l'animation pour la redéclencher
        const animClass = this.config.attentionText.animation;
        attentionText.classList.remove(animClass);
        void attentionText.offsetWidth; // Force reflow
        attentionText.classList.add(animClass);
        
        // Afficher avec animation (l'opacité est gérée par les keyframes maintenant)
        setTimeout(() => {
          // On ne fait rien ici car l'animation keyframe gère la fin (opacity 0)
        }, this.config.attentionText.duration);
      };
      
      // Première animation après un délai
      setTimeout(showAttention, this.config.attentionText.delay);
      // Répéter l'animation
      this.attentionInterval = setInterval(showAttention, this.config.attentionText.repeatInterval);
    }

    stopAttentionAnimation() {
      if (this.attentionInterval) {
        clearInterval(this.attentionInterval);
        this.attentionInterval = null;
      }
      const attentionTextContainer = this.container.querySelector('.wikzy-attention-text-container');
      const attentionText = this.container.querySelector('.wikzy-attention-text');
      
      if (attentionText) {
        attentionText.style.opacity = '0';
      }
      if (attentionTextContainer) {
        attentionTextContainer.style.display = 'none';
      }
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
      this.container.querySelector('.wikzy-chatbot-window').classList.add('open');
      this.inputElement.focus();
      this.stopAttentionAnimation();
    }

    close() {
      this.isOpen = false;
      this.container.querySelector('.wikzy-chatbot-window').classList.remove('open');
      // Redémarrer les messages flottants seulement si l'ouverture automatique n'est pas activée
      if (this.config.attentionText.enabled && !this.config.autoOpen) {
        this.startAttentionAnimation();
      }
    }

    addMessage(content, type = 'bot', showTyping = false, products = null) {
      if (showTyping && type === 'bot') {
        this.showTypingIndicator();
        setTimeout(() => {
          this.hideTypingIndicator();
          this.addMessage(content, type, false, products);
        }, 800 + Math.random() * 800);
        return;
      }

      const messageDiv = document.createElement('div');
      messageDiv.className = `wikzy-chatbot-message ${type}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'wikzy-chatbot-message-content';
      
      if (type === 'user') {
        contentDiv.style.background = `linear-gradient(135deg, ${this.config.primaryColor}, ${this.config.accentColor})`;
      }
      
      if (window.marked) {
        contentDiv.innerHTML = window.marked.parse(content);
      } else {
        content = this.convertMarkdownToHtml(content);
        contentDiv.innerHTML = content;
      }
      
      messageDiv.appendChild(contentDiv);
      if (type === 'bot' && products && Array.isArray(products) && products.length > 0) {
        const carousel = createCarousel(products);
        messageDiv.appendChild(carousel);
      }
      
      this.messagesContainer.appendChild(messageDiv);
      this.scrollToBottom();
      
      this.messages.push({ content, type, timestamp: new Date(), products });
    }

    showTypingIndicator() {
      if (this.container.querySelector('.wikzy-chatbot-typing')) return;
      
      const typingDiv = document.createElement('div');
      typingDiv.className = 'wikzy-chatbot-typing';
      typingDiv.innerHTML = `
        <div class="wikzy-chatbot-typing-dot"></div>
        <div class="wikzy-chatbot-typing-dot"></div>
        <div class="wikzy-chatbot-typing-dot"></div>
      `;
      
      this.messagesContainer.appendChild(typingDiv);
      this.scrollToBottom();
    }

    hideTypingIndicator() {
      const typing = this.container.querySelector('.wikzy-chatbot-typing');
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
        const response = await fetch(this.config.apiEndpoint, {
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
        
        if (data.success && data.response) {
          this.addMessage(data.response.content, 'bot', false, data.response.products);
        } else {
          if (data.primaryType === 'FALLBACK') {
            this.addMessage(data.message, 'bot');
          } else {
            this.addMessage('Oups, quelque chose s\'est mal passé. Réessayez !', 'bot');
          }
        }
      } catch (error) {
        console.error('Erreur chatbot widget:', error);
        
        if (this.config.showTypingIndicator) {
          this.hideTypingIndicator();
        }
        
        this.addMessage('Désolé, je suis momentanément indisponible. Réessayez bientôt !', 'bot');
      } finally {
        this.sendButton.disabled = false;
      }
    }

    destroy() {
      this.stopAttentionAnimation();
      if (this.container) {
        this.container.remove();
      }
      
      const styles = document.getElementById('wikzy-chatbot-styles');
      if (styles) {
        styles.remove();
      }
    }

    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.destroy();
      this.init();
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

    convertMarkdownToHtml(text) {
      text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
      text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
      text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
      text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;">');
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #ff6f61; text-decoration: underline;">$1</a>');
      text = text.replace(/\n\n/g, '</p><p>');
      text = text.replace(/\n/g, '<br>');
      if (!text.includes('<h1>') && !text.includes('<h2>') && !text.includes('<h3>')) {
        text = '<p>' + text + '</p>';
      }
      return text;
    }
  }

  window.WikzyChatbot = WikzyChatbot;

  // Fonction pour charger la config depuis l'API par bot-id
  async function loadConfigFromBotId(botId, token) {
    try {
      const baseUrl = window.location.origin || 'http://localhost:3000';
      const url = `${baseUrl}/api/chatbot-config?botId=${encodeURIComponent(botId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.config) {
        return data.config;
      } else {
        throw new Error(data.error || 'Failed to load config');
      }
    } catch (error) {
      console.error('Error loading chatbot config from API:', error);
      return null;
    }
  }

  // Détecter le script tag avec data-bot-id
  function getScriptTag() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('chatbot-generator.js')) {
        return script;
      }
    }
    return null;
  }

  // Initialisation du chatbot
  async function initChatbot() {
    const scriptTag = getScriptTag();
    let config = null;
    const overrides = window.wikzyChatbotConfig || {};

    // Si data-bot-id est présent, on charge la config depuis l'API
    if (scriptTag && scriptTag.getAttribute('data-bot-id')) {
      const botId = scriptTag.getAttribute('data-bot-id');
      const token = scriptTag.getAttribute('data-token');
      
      console.log('Loading chatbot config for bot-id:', botId);
      config = await loadConfigFromBotId(botId, token);
      
      if (!config) {
        console.warn('Failed to load config from API, using default config');
        config = { ...DEFAULT_CONFIG };
      }
      
      // Fusionner la config chargée avec les overrides globaux (ex: standalone)
      config = { ...config, ...overrides };
    }
    // Sinon, on utilise la config globale si elle existe
    else if (window.wikzyChatbotConfig && Object.keys(window.wikzyChatbotConfig).length > 1) {
      config = window.wikzyChatbotConfig;
    }
    // Sinon, config par défaut
    else {
      config = { ...DEFAULT_CONFIG, ...overrides };
    }

    // Créer l'instance du chatbot avec la config
    if (config) {
      new WikzyChatbot(config);
    }
  }

  // Initialiser quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();