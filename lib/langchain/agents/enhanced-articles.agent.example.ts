// Exemple d'intégration du service RAG avec l'agent Articles

import { ragService } from '../services/rag.service'
import { ArticlesLangchainAgent } from './articles.langchain.agent'

// Extension de l'agent Articles avec RAG
export class EnhancedArticlesAgent extends ArticlesLangchainAgent {
  
  async searchWithRAG(query: string, filters?: any): Promise<any[]> {
    try {
      // Recherche sémantique avec RAG
      const ragResults = await ragService.search(query, {
        k: 10,
        searchType: 'hybrid',
        filters
      })
      
      // Conversion vers le format attendu par l'agent
      return ragResults.map(match => ({
        id: match.document.id,
        name: match.document.metadata.title,
        description: match.document.metadata.description,
        price: match.document.metadata.price,
        category: match.document.metadata.category,
        colors: match.document.metadata.colors,
        sizes: match.document.metadata.sizes,
        score: match.score,
        relevance: match.relevance
      }))
    } catch (error) {
      console.error('Erreur RAG:', error)
      return []
    }
  }
  
  // Override de la méthode de recherche de produits
  protected async findRelevantProducts(criteria: any): Promise<any[]> {
    // Construire la query RAG à partir des critères
    const query = this.buildRAGQuery(criteria)
    
    // Utiliser RAG au lieu de la recherche statique
    return this.searchWithRAG(query, criteria)
  }
  
  private buildRAGQuery(criteria: any): string {
    const parts = []
    
    if (criteria.category) parts.push(criteria.category)
    if (criteria.style) parts.push(criteria.style)
    if (criteria.colors?.length) parts.push(criteria.colors.join(' '))
    if (criteria.occasion) parts.push(criteria.occasion)
    
    return parts.join(' ')
  }
}

// Usage
export const enhancedArticlesAgent = new EnhancedArticlesAgent()