
import { MasterLangchainAgent } from "../lib/langchain/agents/master.langchain.agent"

async function testQuick() {
  console.log("🚀 Test rapide Langchain")
  
  try {
    const agent = new MasterLangchainAgent()
    const result = await agent.processQuery("Bonjour", "default")
    
    console.log("Résultat:", {
      success: result.success,
      routedTo: result.metadata?.routedTo,
      contentLength: result.content?.length || 0
    })
    
  } catch (error: any) {
    console.error("Erreur:", error.message)
  }
}

testQuick()

