async function testLangchain() {
  console.log("🚀 Test infrastructure Langchain");
  
  try {
    // Test de base - vérifier que OpenAI est configuré
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.log("⚠️ OPENAI_API_KEY non définie - certains tests échoueront");
    } else {
      console.log("✅ OPENAI_API_KEY configurée");
    }
    
    // Test des endpoints API
    console.log("📡 Test des endpoints Langchain...");
    
    const { default: handler } = await import("./pages/api/langchain/chat.js");
    console.log("✅ Endpoint chat Langchain importé");
    
    console.log("🎉 Infrastructure Langchain prête !");
    
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

testLangchain();
