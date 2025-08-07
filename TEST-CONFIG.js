// Configuration de test pour vérifier toutes les fonctionnalités
window.younzeeChatbotConfig = {
  attentionGrabber: {
    enabled: true,
    messages: [
      '💬 Besoin d\'aide ?',
      '🛍️ Découvrez nos nouveautés !',
      '✨ Conseils personnalisés',
      '🎯 Trouvez votre style',
      '💡 Questions ? Je suis là !'
    ],
    animation: 'pulse',
    showAfter: 3000, // 3 secondes pour le test
    repeatInterval: 15000, // 15 secondes pour le test
    maxShows: 5,
    randomizeMessages: true,
    showEmoji: true,
    fadeInOut: true,
    textSize: '12px',
    textColor: '#ffffff'
  },
  design: {
    theme: 'glassmorphism',
    shadow: 'ultra',
    animation: 'slide',
    buttonStyle: 'glass',
    messageBubbleStyle: 'bubble',
    headerStyle: 'animated',
    colorScheme: 'auto',
    typography: 'modern',
    spacing: 'comfortable'
  },
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  textColor: '#2d3748',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  title: 'Assistant Younzee',
  subtitle: 'Comment puis-je vous aider ?',
  welcomeMessage: '🤖 Bonjour ! Je suis votre styliste personnel. Comment puis-je vous aider aujourd\'hui ?',
  placeholder: 'Tapez votre message...',
  position: 'bottom-right',
  autoOpen: false,
  showTypingIndicator: true
};

// Fonction de test pour changer les configurations
function testDifferentConfigs() {
  const configs = [
    {
      name: 'Glassmorphism',
      config: {
        design: { theme: 'glassmorphism', buttonStyle: 'glass', headerStyle: 'animated' },
        primaryColor: '#667eea'
      }
    },
    {
      name: 'Neumorphism',
      config: {
        design: { theme: 'neumorphism', buttonStyle: 'neon', headerStyle: 'glass' },
        primaryColor: '#ff6b6b'
      }
    },
    {
      name: 'Modern',
      config: {
        design: { theme: 'modern', buttonStyle: 'floating', headerStyle: 'gradient' },
        primaryColor: '#ff9a9e'
      }
    },
    {
      name: 'Minimal',
      config: {
        design: { theme: 'minimal', buttonStyle: 'minimal', headerStyle: 'minimal' },
        primaryColor: '#2d3748'
      }
    }
  ];
  
  let currentIndex = 0;
  
  setInterval(() => {
    const config = configs[currentIndex];
    console.log(`Test de la configuration: ${config.name}`);
    
    if (window.younzeeChatbot) {
      window.younzeeChatbot.updateDesign(config.config);
      window.younzeeChatbot.customizeAppearance({
        primaryColor: config.config.primaryColor
      });
    }
    
    currentIndex = (currentIndex + 1) % configs.length;
  }, 10000); // Change toutes les 10 secondes
}

// Fonction pour tester les animations d'attention
function testAttentionAnimations() {
  const animations = ['pulse', 'bounce', 'shake', 'glow', 'rotate'];
  let currentAnimation = 0;
  
  setInterval(() => {
    if (window.younzeeChatbot) {
      const config = window.younzeeChatbot.config;
      config.attentionGrabber.animation = animations[currentAnimation];
      console.log(`Test de l'animation: ${animations[currentAnimation]}`);
      
      // Redémarrer l'attention avec la nouvelle animation
      window.younzeeChatbot.stopAttention();
      setTimeout(() => {
        window.younzeeChatbot.startAttention();
      }, 1000);
    }
    
    currentAnimation = (currentAnimation + 1) % animations.length;
  }, 8000); // Change toutes les 8 secondes
}

// Initialiser les tests après le chargement
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // Démarrer les tests après 5 secondes
    testDifferentConfigs();
    testAttentionAnimations();
  }, 5000);
});

// Instructions d'utilisation:
// 1. Incluez ce fichier dans votre HTML
// 2. Le chatbot testera automatiquement différentes configurations
// 3. Ouvrez la console pour voir les logs de test
// 4. Les configurations changeront automatiquement toutes les 10 secondes
// 5. Les animations d'attention changeront toutes les 8 secondes 