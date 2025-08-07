(function() {
  'use strict';

  // Configuration par défaut avec améliorations
  const DEFAULT_CONFIG = {
    chatbotId: 'younzee-premium',
    title: 'Assistant Younzee',
    subtitle: 'Votre styliste personnel, toujours à vos côtés',
    apiEndpoint: 'https://younzeeadmin.vercel.app/api/ai/master',
    position: 'bottom-right',
    primaryColor: '#ffdd5b',
    secondaryColor: '#ffd700',
    accentColor: '#ff6f61', // Nouvelle couleur d'accent pour dynamisme
    textColor: '#1F2937',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '24px',
    size: 'standard',
    showTypingIndicator: true,
    enableSound: true, // Activé par défaut pour micro-interactions
    autoOpen: false,
    autoOpenDelay: 2000,
    welcomeMessage: '✨ Bonjour ! Je suis Younzee, votre styliste personnel. Prêt à trouver le look parfait ? Essayez "robes", "chaussures" ou "nouveau style" !',
    placeholder: 'Ex: Robe rouge, taille M...',
    personality: {
      tone: 'Amical',
      formality: 'Tutoiement',
      verbosity: 'Détaillé',
      empathy: 'Élevée',
      proactivity: 'Proactif'
    },
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    buttonSize: 72, // Légèrement plus grand pour attirer l'attention
    shadowEffect: 'neumorphic',
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
      particleEffect: true,
      trailEffect: false,
      orbitRadius: 60,
      orbitSpeed: 5,
      orbitDirection: 'clockwise',
      curveIntensity: 0
    },
    theme: 'dark', // Support du mode clair/sombre
    quickReplies: ["Je voudrais une robe blanche d'été en L", 'Propose moi des bottines marrons en 44'] // Suggestions rapides
  };

  // Classes CSS avec design premium
  const CSS_STYLES = `
    :root {
      --primary-color: ${DEFAULT_CONFIG.primaryColor};
      --secondary-color: ${DEFAULT_CONFIG.secondaryColor};
      --accent-color: ${DEFAULT_CONFIG.accentColor};
      --text-color: ${DEFAULT_CONFIG.textColor};
      --background-color: ${DEFAULT_CONFIG.backgroundColor};
      --font-family: ${DEFAULT_CONFIG.fontFamily};
      --button-size: ${DEFAULT_CONFIG.buttonSize}px;
      --border-radius: ${DEFAULT_CONFIG.borderRadius};
      --orbit-radius: ${DEFAULT_CONFIG.attentionText.orbitRadius}px;
      --orbit-speed: ${DEFAULT_CONFIG.attentionText.orbitSpeed}s;
    }

    .younzee-chatbot-message-content div:empty {
      display: block !important;
    }

    .younzee-chatbot-message-content hr {
      margin: 20px 0 !important;
      border: 0;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .younzee-chatbot-messages p img {
      height: 180px;
      max-width: 100%;
      border-radius: 12px;
      object-fit: cover;
      margin: 10px 0;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .younzee-chatbot-messages p img:hover {
      transform: scale(1.03);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .younzee-chatbot-messages ul {
      list-style: disc !important;
      padding-left: 24px;
      margin: 8px 0;
    }
    
    .younzee-chatbot-message-content p {
      margin: 0;
      line-height: 1.7;
      font-size: 15px;
    }

    .younzee-chatbot-container {
      position: fixed;
      z-index: 1000000;
      font-family: var(--font-family);
      user-select: none;
      transition: filter 0.3s ease;
    }
    
    .younzee-chatbot-container.bottom-right {
      bottom: 28px;
      right: 28px;
    }
    
    .younzee-chatbot-container.bottom-left {
      bottom: 28px;
      left: 28px;
    }
    
    .younzee-chatbot-container.top-right {
      top: 28px;
      right: 28px;
    }

    .younzee-chatbot-input-wrapper {
      display: flex;
    }
    
    .younzee-chatbot-container.top-left {
      top: 28px;
      left: 28px;
    }
    
    .younzee-chatbot-button {
      width: var(--button-size);
      height: var(--button-size);
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: white;
      font-size: calc(var(--button-size) * 0.5);
      position: relative;
      overflow: hidden;
    }
    
    .younzee-chatbot-button.neumorphic {
      background: linear-gradient(145deg, #f0f0f0, #ffffff);
      box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
    }
    
    .younzee-chatbot-button.gradient-pulse {
      background: linear-gradient(45deg, var(--primary-color), var(--accent-color), var(--secondary-color));
      background-size: 200% 200%;
      animation: gradientPulse 8s ease infinite;
    }
    
    .younzee-chatbot-button:hover {
      transform: scale(1.12) rotate(8deg);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    
    .younzee-chatbot-button:active::after {
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
    
    .younzee-chatbot-window {
      position: absolute;
      bottom: calc(var(--button-size) + 28px);
      right: 0;
      width: var(--window-width, 420px);
      height: var(--window-height, 565px);
      background: var(--background-color);
      backdrop-filter: blur(16px);
      border-radius: var(--border-radius);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2), 0 0 10px rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.25);
      display: none;
      flex-direction: column;
      overflow: hidden;
      animation: popIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.8) translateY(40px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    
    .younzee-chatbot-window.open {
      display: flex;
    }
    
    .younzee-chatbot-header {
      padding: 18px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    }
    
    .younzee-chatbot-header-content {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .younzee-chatbot-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      color: white;
      background: rgba(255, 255, 255, 0.3);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .younzee-chatbot-avatar:hover {
      transform: scale(1.08);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.5);
    }
    
    .younzee-chatbot-header-text h3 {
      margin: 0;
      font-size: 19px;
      font-weight: 700;
      color: white;
    }
    
    .younzee-chatbot-header-text p {
      margin: 0;
      font-size: 13px;
      color: rgba(255, 255, 255, 0.9);
    }
    
    .younzee-chatbot-close {
      background: rgba(255, 255, 255, 0.25);
      border: none;
      font-size: 19px;
      cursor: pointer;
      color: white;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
    }
    
    .younzee-chatbot-close:hover {
      background: rgba(255, 255, 255, 0.4);
      transform: rotate(180deg);
    }
    
    .younzee-chatbot-messages {
      flex: 1;
      padding: 18px;
      overflow-y: auto;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 245, 0.95) 100%);
      scrollbar-width: thin;
      scrollbar-color: var(--accent-color) transparent;
    }
    
    .younzee-chatbot-messages::-webkit-scrollbar {
      width: 5px;
    }
    
    .younzee-chatbot-messages::-webkit-scrollbar-thumb {
      background: var(--accent-color);
      border-radius: 2.5px;
    }
    
    .younzee-chatbot-message {
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
    
    .younzee-chatbot-message.user {
      flex-direction: row-reverse;
    }

    .younzee-chatbot-message.bot {
      flex-direction: column;
    }
    
    .younzee-chatbot-message-content {
      max-width: 80%;
      padding: 12px 24px;
      border-radius: 18px;
      font-size: 15px;
      line-height: 1.6;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .younzee-chatbot-message-content:hover {
      transform: translateY(-3px);
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }

    .younzee-chatbot-message-content h2 {
      font-size: 15px !important;
      font-weight: 700 !important;
      margin: 6px 0 !important;
    }

    .younzee-chatbot-message.user .younzee-chatbot-message-content {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      border-bottom-right-radius: 6px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
    }
    
    .younzee-chatbot-message.bot .younzee-chatbot-message-content {
      background: rgba(255, 255, 255, 0.95);
      color: var(--text-color);
      border-bottom-left-radius: 6px;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(6px);
    }
    
    .younzee-chatbot-input-container {
      padding: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.25);
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px);
    }

    .younzee-chatbot-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .younzee-chatbot-quick-reply {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--accent-color);
      border-radius: 20px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-color);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .younzee-chatbot-quick-reply:hover {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      color: white;
      transform: scale(1.05);
    }

    .younzee-chatbot-input {
      flex: 1;
      border: 1px solid rgba(0, 0, 0, 0.15);
      border-radius: 20px;
      padding: 10px 18px;
      font-size: 15px;
      outline: none;
      resize: none;
      max-height: 100px;
      min-height: 44px;
      background: rgba(255, 255, 255, 0.85);
      transition: all 0.3s ease;
    }
    
    .younzee-chatbot-input:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(255, 111, 97, 0.3);
      background: white;
    }
    
    .younzee-chatbot-send {
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
    
    .younzee-chatbot-send:hover {
      transform: scale(1.12) rotate(12deg);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .younzee-chatbot-send:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .younzee-chatbot-typing {
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
    
    .younzee-chatbot-typing-dot {
      width: 7px !important;
      height: 7px !important;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color)) !important;
      border-radius: 50% !important;
      animation: typing 1s ease-in-out infinite;
      display: block !important;
    }
    
    .younzee-chatbot-typing-dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .younzee-chatbot-typing-dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.7; }
      30% { transform: translateY(-10px); opacity: 1; }
    }
    
    .younzee-chatbot-powered {
      text-align: center;
      padding: 10px;
      font-size: 11px;
      color: #6b7280;
      border-top: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px);
    }
    
    .younzee-chatbot-powered a {
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;
    }
    
    .younzee-chatbot-powered a:hover {
      color: var(--secondary-color);
    }
    
    .younzee-attention-text-container {
      position: absolute;
      width: calc(var(--button-size) + var(--orbit-radius) * 2);
      height: calc(var(--button-size) + var(--orbit-radius) * 2);
      top: calc(var(--orbit-radius) * -1);
      left: calc(var(--orbit-radius) * -1);
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      perspective: 800px; /* Ajouté pour effet 3D */
    }
    
    .younzee-attention-text {
      position: absolute;
      display: inline-flex;
      background:  linear-gradient(135deg, #ffdd5b 0%, #ff6f61 100%);
      color: var(--attention-color, #FFFFFF);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      opacity: 0;
      white-space: nowrap;
      padding: 6px 14px;
      transition: opacity 0.4s ease;
    }
    
    .younzee-attention-text span {
      display: inline-block;
      transform-origin: center calc(var(--button-size) / 2 + var(--orbit-radius));
      margin: 0 0.6px;
      font-size: 12px;
      transition: transform 0.3s ease;
    }
    
    .younzee-attention-text.trail::after {
      content: '';
      position: absolute;
      top: -10px;
      left: -10px;
      right: -10px;
      bottom: -10px;
      background: linear-gradient(135deg, rgba(255, 221, 91, 0.4), rgba(255, 111, 97, 0.2));
      filter: blur(8px);
      opacity: 0.6;
      animation: trail 5s ease-in-out infinite;
      z-index: -1;
    }
    
    .younzee-attention-text.particle::after {
      content: '';
      position: absolute;
      top: -8px;
      left: -8px;
      right: -8px;
      bottom: -8px;
      background: radial-gradient(circle, rgba(255, 221, 91, 0.4) 0%, transparent 60%);
      animation: particle 3s ease-in-out infinite;
      z-index: -1;
    }
    
    .younzee-attention-text.fade {
      animation: fadeAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .younzee-attention-text.slide {
      animation: slideAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .younzee-attention-text.bounce {
      animation: bounceAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
      top: 20px;
      right: 40px;
    }
    
    .younzee-attention-text.glow {
      animation: glowAttention 1.5s ease-in-out;
    }
    
    .younzee-attention-text.pop {
      animation: popAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .younzee-attention-text.wave {
      animation: waveAttention 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .younzee-attention-text.orbit-3d {
      animation: orbitAttention3D var(--orbit-speed, 5s) linear infinite;
      transform-origin: center center;
    }
    
    @keyframes fadeAttention {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    @keyframes slideAttention {
      0% { opacity: 0; transform: translateX(40px); }
      20% { opacity: 1; transform: translateX(0); }
      80% { opacity: 1; transform: translateX(0); }
      100% { opacity: 0; transform: translateX(40px); }
    }
    
    @keyframes bounceAttention {
      0% { opacity: 0; transform: translateY(30px); }
      20% { opacity: 1; transform: translateY(0); }
      50% { transform: translateY(-10px); }
      80% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(30px); }
    }
    
    @keyframes glowAttention {
      0% { opacity: 0; box-shadow: 0 0 0 rgba(255, 111, 97, 0); }
      20% { opacity: 1; box-shadow: 0 0 20px rgba(255, 111, 97, 0.6); }
      80% { opacity: 1; box-shadow: 0 0 20px rgba(255, 111, 97, 0.6); }
      100% { opacity: 0; box-shadow: 0 0 0 rgba(255, 111, 97, 0); }
    }
    
    @keyframes popAttention {
      0% { opacity: 0; transform: scale(0.7); }
      20% { opacity: 1; transform: scale(1.1); }
      40% { transform: scale(0.95); }
      80% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.7); }
    }
    
    @keyframes waveAttention {
      0% { opacity: 0; transform: translateY(20px) rotate(-6deg); }
      20% { opacity: 1; transform: translateY(0) rotate(0deg); }
      40% { transform: rotate(4deg); }
      60% { transform: rotate(-4deg); }
      80% { opacity: 1; transform: rotate(0deg); }
      100% { opacity: 0; transform: translateY(20px) rotate(6deg); }
    }
    
    @keyframes orbitAttention3D {
      0% { 
        transform: rotateY(30deg) rotateX(10deg) translateX(var(--orbit-radius)) rotateZ(0deg);
        opacity: 0;
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { 
        transform: rotateY(30deg) rotateX(10deg) translateX(var(--orbit-radius)) rotateZ(-360deg);
        opacity: 0;
      }
    }
    
    @keyframes orbitAttentionCounter3D {
      0% { 
        transform: rotateY(30deg) rotateX(10deg) translateX(var(--orbit-radius)) rotateZ(0deg);
        opacity: 0;
      }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { 
        transform: rotateY(30deg) rotateX(10deg) translateX(var(--orbit-radius)) rotateZ(360deg);
        opacity: 0;
      }
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
      .younzee-chatbot-container[data-theme="auto"] {
        --background-color: rgba(30, 30, 30, 0.9);
        --text-color: #E5E7EB;
      }
      
      .younzee-chatbot-container[data-theme="auto"] .younzee-chatbot-messages {
        background: linear-gradient(180deg, rgba(40, 40, 40, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
      }
      
      .younzee-chatbot-container[data-theme="auto"] .younzee-chatbot-message.bot .younzee-chatbot-message-content {
        background: rgba(50, 50, 50, 0.95);
        color: #E5E7EB;
      }
      
      .younzee-chatbot-container[data-theme="auto"] .younzee-chatbot-input-container {
        background: rgba(30, 30, 30, 0.9);
      }
      
      .younzee-chatbot-container[data-theme="auto"] .younzee-chatbot-powered {
        background: rgba(30, 30, 30, 0.9);
        color: #9CA3AF;
      }
    }
    
    @media (max-width: 480px) {
      .younzee-chatbot-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 100px);
        bottom: calc(var(--button-size) + 20px);
        right: 20px;
        left: 20px;
      }
      
      .younzee-attention-text-container {
        --orbit-radius: 34px;
        width: calc(var(--button-size) + var(--orbit-radius) * 2);
        height: calc(var(--button-size) + var(--orbit-radius) * 2);
        top: calc(var(--orbit-radius) * -1);
        left: calc(var(--orbit-radius) * -1);
      }
      
      .younzee-attention-text {
        font-size: 11px;
        padding: 5px 10px;
      }
      
      .younzee-attention-text span {
        font-size: 10px;
        margin: 0 0.4px;
        transform-origin: center calc(var(--button-size) / 2 + var(--orbit-radius));
      }
      
      .younzee-chatbot-quick-reply {
        font-size: 12px;
        padding: 6px 12px;
      }
    }
  `;

  // CSS du carousel (amélioré pour plus de dynamisme)
  const CAROUSEL_CSS = `
    .younzee-carousel-container {
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
    .younzee-carousel-track {
      display: flex;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .younzee-carousel-item {
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
    .younzee-carousel-item:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    .younzee-carousel-img {
      width: 130px;
      height: 130px;
      object-fit: cover;
      border-radius: 8px;
      background: #f3f4f6;
      margin-bottom: 8px;
      transition: transform 0.3s ease;
    }
    .younzee-carousel-img:hover {
      transform: scale(1.03);
    }
    .younzee-carousel-title {
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
    .younzee-carousel-price {
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
    .younzee-carousel-btn {
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
    .younzee-carousel-btn:hover {
      background: linear-gradient(135deg, #ffe88a, #ff8a80);
      transform: scale(1.06);
    }
    .younzee-carousel-arrow {
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
    .younzee-carousel-arrow:hover {
      background: linear-gradient(135deg, #ffdd5b, #ff6f61);
      transform: translateY(-50%) scale(1.12);
      color: white;
    }
    .younzee-carousel-arrow:active {
      transform: translateY(-50%) scale(0.95);
    }
    .younzee-carousel-arrow.disabled {
      opacity: 0.4;
      cursor: default;
      pointer-events: none;
    }
    .younzee-carousel-arrow.left { left: 5px; }
    .younzee-carousel-arrow.right { right: 5px; }
  `;

  // Ajoute le CSS du carousel
  function injectCarouselStyles() {
    if (!document.getElementById('younzee-carousel-styles')) {
      const style = document.createElement('style');
      style.id = 'younzee-carousel-styles';
      style.textContent = CAROUSEL_CSS;
      document.head.appendChild(style);
    }
  }

  // Génère le HTML du carousel
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
      btn.className = 'younzee-carousel-btn';
      btn.textContent = 'Découvrir';
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
        left.className = 'younzee-carousel-arrow left';
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
        right.className = 'younzee-carousel-arrow right';
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
    if (!window.YounzeeChatbotInstance || !window.YounzeeChatbotInstance.config.enableSound) return;
    const sounds = {
      click: 'https://assets.mixkit.co/sfx/preview/mixkit-click-soft-1110.mp3',
      send: 'https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3',
      open: 'https://assets.mixkit.co/sfx/preview/mixkit-pop-alert-2353.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {});
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
      this.attentionInterval = null;
      this.currentMessageIndex = 0; // Pour alterner entre les messages flottants
      window.YounzeeChatbotInstance = this; // Pour accès global aux sons
      
      this.init();
    }

    init() {
      this.detectTheme();
      this.injectStyles();
      this.createChatbot();
      this.bindEvents();
      
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
      if (document.getElementById('younzee-chatbot-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'younzee-chatbot-styles';
      let css = CSS_STYLES;
      
      css = css.replace(/var\(--primary-color\)/g, this.config.primaryColor);
      css = css.replace(/var\(--secondary-color\)/g, this.config.secondaryColor);
      css = css.replace(/var\(--accent-color\)/g, this.config.accentColor);
      css = css.replace(/var\(--text-color\)/g, this.config.textColor);
      css = css.replace(/var\(--font-family\)/g, this.config.fontFamily);
      css = css.replace(/var\(--button-size\)/g, this.config.buttonSize + 'px');
      css = css.replace(/var\(--background-color\)/g, this.config.backgroundColor);
      css = css.replace(/var\(--border-radius\)/g, this.config.borderRadius);
      css = css.replace(/var\(--attention-bg, ([^)]+)\)/g, this.config.attentionText.backgroundColor);
      css = css.replace(/var\(--attention-color, ([^)]+)\)/g, this.config.attentionText.color);
      css = css.replace(/var\(--orbit-radius\)/g, this.config.attentionText.orbitRadius + 'px');
      css = css.replace(/var\(--orbit-speed\)/g, this.config.attentionText.orbitSpeed + 's');
      
      const sizes = {
        compact: { width: '360px', height: '460px' },
        standard: { width: '420px', height: '570px' },
        large: { width: '500px', height: '640px' }
      };
      css = css.replace(/var\(--window-width, ([^)]+)\)/g, sizes[this.config.size].width);
      css = css.replace(/var\(--window-height, ([^)]+)\)/g, sizes[this.config.size].height);
      
      const shadows = {
        none: 'none',
        light: '0 2px 10px rgba(0, 0, 0, 0.1)',
        medium: '0 5px 20px rgba(0, 0, 0, 0.15)',
        strong: '0 10px 30px rgba(0, 0, 0, 0.2)',
        neumorphic: '8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7)'
      };
      css = css.replace(/var\(--shadow-effect, ([^)]+)\)/g, shadows[this.config.shadowEffect]);
      css = css.replace(/var\(--shadow-hover, ([^)]+)\)/g, shadows[this.config.shadowEffect === 'strong' || this.config.shadowEffect === 'neumorphic' ? 'strong' : 'medium']);
      
      style.textContent = css;
      document.head.appendChild(style);
    }

    createChatbot() {
      this.container = document.createElement('div');
      this.container.className = `younzee-chatbot-container ${this.config.position}`;
      this.container.dataset.theme = this.config.theme;
      
      const firstMessage = this.config.attentionText.messages ? this.config.attentionText.messages[0] : 'Trouvez votre style !';
      const textLength = firstMessage.length;
      const anglePerChar = 360 / textLength * this.config.attentionText.curveIntensity;
      let attentionTextHTML = firstMessage;
    //  if (this.config.attentionText.animation === 'orbit-3d') {
    //    attentionTextHTML = firstMessage
    //      .split('')
    //      .map((char, index) => {
    //        const angle = index * anglePerChar - (textLength - 1) * anglePerChar / 2;
    //        return `<span style="transform: rotate(${angle}deg);">${char}</span>`;
    //      })
    //      .join('');
    //  }
      
      this.container.innerHTML = `
        <button class="younzee-chatbot-button ${this.config.shadowEffect} ${this.config.animationStyle}" style="padding-top: 68px;">
          ${this.config.customIcon ? this.config.customIcon : '<img src="http://localhost:3000/styli.png" alt="Styli" style="width: 130px; height: 130px;">'}
        </button>
        <div class="younzee-attention-text-container" style="display: none;">
          <div class="younzee-attention-text ${this.config.attentionText.animation}${this.config.attentionText.particleEffect ? ' particle' : ''}${this.config.attentionText.trailEffect ? ' trail' : ''}">
            ${this.config.attentionText.messages ? this.config.attentionText.messages[0] : 'Trouvez votre style !'}
          </div>
        </div>
        <div class="younzee-chatbot-window">
          <div class="younzee-chatbot-header">
            <div class="younzee-chatbot-header-content">
              <div class="younzee-chatbot-avatar">
                ${this.config.customIcon ? this.config.customIcon : '<img src="http://localhost:3000/styli.png" alt="Styli" style="width: 50px; height: 50px;">'}
              </div>
              <div class="younzee-chatbot-header-text">
                <h3 style="font-family: sans-serif;">${this.config.title}</h3>
                <p>${this.config.subtitle}</p>
              </div>
            </div>
            <button class="younzee-chatbot-close">✕</button>
          </div>
          
          <div class="younzee-chatbot-messages"></div>
          
          <div class="younzee-chatbot-input-container">
            <div class="younzee-chatbot-quick-replies"></div>
            <div class="younzee-chatbot-input-wrapper">
              <textarea 
                class="younzee-chatbot-input" 
                placeholder="${this.config.placeholder}"
                rows="1"
                style="margin-right: 10px;"
              ></textarea>
              <button class="younzee-chatbot-send">➤</button>
            </div>
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
      
      if (this.config.attentionText.animation === 'orbit-3d') {
        const attentionText = this.container.querySelector('.younzee-attention-text');
        attentionText.style.animationName = this.config.attentionText.orbitDirection === 'clockwise' ? 'orbitAttention3D' : 'orbitAttentionCounter3D';
        attentionText.style.transformOrigin = `center center`;
      }
      
      this.renderQuickReplies();
    }

    renderQuickReplies() {
      const quickRepliesContainer = this.container.querySelector('.younzee-chatbot-quick-replies');
      quickRepliesContainer.innerHTML = '';
      this.config.quickReplies.forEach(reply => {
        const button = document.createElement('button');
        button.className = 'younzee-chatbot-quick-reply';
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
      const button = this.container.querySelector('.younzee-chatbot-button');
      const closeButton = this.container.querySelector('.younzee-chatbot-close');
      
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
      const attentionTextContainer = this.container.querySelector('.younzee-attention-text-container');
      const attentionText = this.container.querySelector('.younzee-attention-text');
      
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
        
        // Afficher avec animation
        attentionText.style.opacity = '1';
        setTimeout(() => {
          attentionText.style.opacity = '0';
        }, this.config.attentionText.duration);
      };
      
      if (this.config.attentionText.animation !== 'orbit-3d') {
        // Première animation après un délai
        setTimeout(showAttention, this.config.attentionText.delay);
        // Répéter l'animation
        this.attentionInterval = setInterval(showAttention, this.config.attentionText.repeatInterval);
      } else {
        // Pour l'animation orbit-3d, afficher le premier message et garder visible
        const messages = this.config.attentionText.messages || ['Trouvez votre style !'];
        attentionText.textContent = messages[0];
        setTimeout(() => {
          attentionText.style.opacity = '1';
        }, this.config.attentionText.delay);
      }
    }

    stopAttentionAnimation() {
      if (this.attentionInterval) {
        clearInterval(this.attentionInterval);
        this.attentionInterval = null;
      }
      const attentionTextContainer = this.container.querySelector('.younzee-attention-text-container');
      const attentionText = this.container.querySelector('.younzee-attention-text');
      
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
      this.container.querySelector('.younzee-chatbot-window').classList.add('open');
      this.inputElement.focus();
      this.stopAttentionAnimation();
    }

    close() {
      this.isOpen = false;
      this.container.querySelector('.younzee-chatbot-window').classList.remove('open');
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
      messageDiv.className = `younzee-chatbot-message ${type}`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'younzee-chatbot-message-content';
      
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
      
      const styles = document.getElementById('younzee-chatbot-styles');
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

  window.YounzeeChatbot = YounzeeChatbot;

  if (window.younzeeChatbotConfig) {
    new YounzeeChatbot(window.younzeeChatbotConfig);
  }
})();