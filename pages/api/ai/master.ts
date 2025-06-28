import { NextApiRequest, NextApiResponse } from 'next'
import { ChatbotConfig, ChatbotConfigService } from '../../../lib/services/chatbot-config.service'
import { OpenAIService } from '../../../lib/services/openai.service'

const PROMPT_MASTER = (personality: string) => `
Tu es un expert en catégorisation de requêtes e-commerce pour Younzee.

Analyse cette requête et détermine:

TYPES DE REPONSES DE L'IA:
- ITEM: Présentation d'un article spécifique (ex: "t-shirt rouge", "jean slim taille 38")  
- OUTFIT: Demande de tenue complète avec contexte (ex: "tenue pour aller au travail", "outfit soirée")
- FAQ: Question sur service/livraison/retour (ex de requête: "comment retourner un article?", "délais de livraison") (ex de réponse: "Pour retourner un article, veuillez contacter notre service client au 01 23 45 67 89")
- RECOMMENDATION: Réponse à une demande de recommandation (ex de requête: "quels sont vos meilleurs articles?", "quels sont vos derniers arrivages?") (ex de réponse: "Voici nos derniers arrivages:...")
- PRECISION: Demande de précision (ex de requête: "Pourriez vous me preciser la taille que vous recherchez pour votre tenue?") (ex de réponse: "Pourriez vous me preciser la taille que vous recherchez pour votre tenue?")
- FALLBACK: Proposition d'un autre article non trouvée (ex de requête: "Je cherche un t-shirt rouge en M", "Je cherche un jean slim taille 38") (ex de réponse: "Je n'ai pas trouvé de t-shirt rouge en M, mais voici un t-shirt rouge que je vous propose en taille L:...", "Je n'ai pas trouvé de jean slim taille 38, mais voici un jean regular que je vous propose en taille 38:...")

INFORMATIONS À EXTRAIRE:
- Taille: XS, S, M, L, XL, XXL, 36, 38, 40, 42, 44, 46, 48, 50
- Couleur: rouge, bleu, vert, noir, blanc, etc.
- Contexte/Occasion: travail, soirée, sport, plage, mariage, etc.
- Style: casual, élégant, sport, vintage, moderne, etc.

PROPOSE DES SUGGESTIONS DE QUESTIONS A REQUETER EN FONCTION DU TYPE DE REQUÊTE ET DES INFORMATIONS EXTRAIRES.

Tu emploieras cette personnalité dans tes réponses: ${JSON.stringify(personality)}

RETOURNE UNIQUEMENT DU JSON VALIDE:
{
  "message": if (primaryType === "ITEM") null else "Ta réponse à la requête de l'utilisateur",
  "request": "La requête de l'utilisateur",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION",
  "confidence": 0.9,
  "reasoning": "Explication claire du choix",
  "extractedInfo": {
    "size": "M",
    "color": "rouge", 
    "context": "travail",
    "style": "casual"
  },
  "missingInfo": ["taille", "couleur"],
  "missingInfoSuggestions": ["Précisez la taille souhaitée", "Ajoutez une couleur de préférence"],
  "suggestions": ["Je cherche un sweat noir en M sous 60€", "Conseille-moi une tenue pour l'hiver", "Quelles sont vos dernières tendances ?", "J'ai un budget de 100€, que recommandes-tu ?", "Guide des tailles pour les pantalons"] //Suggestions de questions a genere dynamiquement en fonction de la reponse de l'IA ITEM et de la requête de l'utilisateur
}
`

const PROMPT_RAG = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation, nommée **IA ITEM**, a renvoyé une **liste (array)** d'articles (maximum 5), sous ce format JSON :  
**${response}**

## Ta mission :
Analyse la requête de l'utilisateur et les articles retournés, puis rédige une réponse dans le ton et la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. Commence par **une introduction courte** qui s’adresse à l’utilisateur dans le ton de la personnalité donnée, et qui contextualise la sélection.
2. Parcours le tableau \`response\` et récupère **au maximum les 3 premiers articles**.
3. Si aucun article n’est présent, écris une phrase simple indiquant qu'aucun produit ne correspond à la demande, et ne retourne rien d’autre dans le champ \`content\`.
4. Ne trie **pas** les articles : ils sont **déjà classés par pertinence**.
5. Pour chaque article :
   - Vérifie que \`metadata.images\` est un **tableau d’URLs**.
   - Affiche **jusqu’à 3 images** par article, **si et seulement si** ces images sont présentes et que l’URL commence bien par \`http\` ou \`https\`.
   - Affiche les images en markdown (_une ligne par image_), sans saut de ligne superflu.
   - **N’affiche pas du tout de bloc image** si aucune URL valide n’est trouvée dans \`metadata.images\`.

6. Génère la fiche produit en suivant ce format exact :

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si applicable)

> ✨ _Phrase d'accroche personnalisée, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**

---

7. Le champ \`content\` doit :
   - Être **compatible markdown avec \`react-markdown\`**
   - Ne contenir **aucun espace ou saut de ligne inutile**
   - Avoir un rendu **propre, moderne, professionnel et élégant**

8. Retourne uniquement un **objet JSON valide** au format suivant (parsable avec \`JSON.parse()\`) :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse() en prenant en charge les SyntaxError: Unexpected token:
{
  "content": "Réponse markdown générée à partir des articles, de la requête et de la personnalité",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente",
    "Suggestion 2 utile",
    "Suggestion 3 adaptée au besoin",
    "Suggestion 4 inspirée des produits ou du style",
    "Suggestion 5 liée au contexte ou tendance"
  ]
}

9. Les suggestions doivent être **intelligentes, naturelles et contextuelles**, générées dynamiquement à partir des produits et de la requête utilisateur.

---
`;


const PROMPT_RAG8 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation, nommée **IA ITEM**, a renvoyé une **liste (array)** d'articles (maximum 5), sous ce format JSON :  
**${response}**

## Ta mission :
Analyse la requête de l'utilisateur et les articles retournés, puis rédige une réponse dans le ton et la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Rédige une introduction** courte, engageante et pertinente **avant la liste des articles**, en adoptant le **ton et la personnalité** indiqués. Elle doit contextualiser les produits par rapport à la requête.
2. Parcours le tableau \`response\` et récupère **au maximum les 3 premiers articles**.
3. Si aucun article n’est présent, écris une phrase simple indiquant qu'aucun produit ne correspond à la demande, et ne retourne rien d’autre dans le champ \`content\`.
4. Ne trie **pas** les articles : ils sont **déjà classés par pertinence**.
5. Pour chaque article :
   - Accède à \`metadata.images\`, qui est un **tableau d'URLs**.
   - Affiche **jusqu'à 3 images valides** (au format complet HTTP(S) d’image) si elles existent. Ne pas afficher une image si l’URL semble invalide, vide ou non utilisable.
   - Affiche les images en **markdown**, les unes à la suite des autres, sans sauts de ligne superflus.
   - Si aucune image valide n’est trouvée, **n’affiche aucun bloc image** pour cet article.
6. Génère une description claire, attrayante et enrichie pour chaque article, en suivant **ce format exact** :

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si applicable)

> ✨ _Phrase d'accroche personnalisée, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**

---

7. Le champ \`content\` doit :
   - Être **markdown compatible avec \`react-markdown\`**
   - Ne contenir **aucun espace ou saut de ligne inutile**
   - Avoir un rendu **propre, professionnel, élégant, moderne et épuré**

8. Retourne uniquement un **objet JSON valide** au format suivant (parsable avec \`JSON.parse()\`) :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Réponse markdown générée à partir des articles, de la requête et de la personnalité",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente",
    "Suggestion 2 utile",
    "Suggestion 3 adaptée au besoin",
    "Suggestion 4 inspirée des produits ou du style",
    "Suggestion 5 liée au contexte ou tendance"
  ]
}

9. Les suggestions doivent être **intelligentes, dynamiques** et cohérentes avec la requête et les produits retournés.

---
`;


const PROMPT_RAG_2 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour Younzee.

L'utilisateur a demandé: ${query}
L'IA ITEM a répondu (Une IA de recommandation de produits) et a trouvé les articles suivants (0 à 5) Recupere les 3 premiers articles les plus pertinents depuis ce JSON: ${response}

Analyse la demande de l'utilisateur et la reponse de l'IA ITEM (Une IA de recommandation de produits) et emploie cette personnalité pour repondre a la demande de l'utilisateur: ${personality}

RETOURNE UNIQUEMENT DU JSON VALIDE:
{
  "content": "Ta réponse à la requête de l'utilisateur (en format markdown en limitant les sauts de ligne inutiles) en prenant en compte les articles trouvés par l'IA ITEM en faisant une courte description des articles a partir des informations du JSON (si aucun article n'est trouvé, tu peux dire que tu n'as pas trouvé d'article correspondant à la requête et ne rien dire d'autre) et en prenant en compte de la personnalité que tu dois adopter a savoir ${personality}. Si un ou plusieurs articles sont trouvés c'est qu'ils ont deja été tries par l'IA ITEM.",
  "request": "La requête de l'utilisateur",
  "primaryType": "ITEM|OUTFIT|FAQ|RECOMMENDATION|PRECISION",
  "confidence": 0.9,
  "timestamp": "timestamp de la requête",
  "reasoning": "Explication claire du choix",
  "extractedInfo": {
    "size": "M",
    "color": "rouge", 
  },
  "articles": [
    {
      "title": "Article 1",
      "description": "Description de l'article 1",
      "price": 100,
      "image": "https://example.com/image1.jpg",
      "url": "https://example.com/lien-vers-l-article"
    },
    {
      "title": "Article 2",
      "description": "Description de l'article 2",
      "price": 100,
      "image": "https://example.com/image2.jpg",
      "url": "https://example.com/lien-vers-l-article-2"
  ],
    "articles": [
    {
      "id": "id de l'article",
      "title": "Article 1",
      "description": "Description detaillee le plus detaillée possible de l'article 1",
      "price": 100,
      "shortDescription": "Description courte de l'article 1",
    },
  ],
  "suggestions": ["Je cherche un sweat noir en M sous 60€", "Conseille-moi une tenue pour l'hiver", "Quelles sont vos dernières tendances ?", "J'ai un budget de 100€, que recommandes-tu ?", "Guide des tailles pour les pantalons"] //Suggestions de questions a genere dynamiquement en fonction de la reponse de l'IA ITEM et de la requête de l'utilisateur
}
`

const PROMPT_RAG5 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** a généré les articles suivants (au format JSON, de 0 à 5 articles) :  
**${response}**

## Ta mission :
Analyse la requête de l'utilisateur et les résultats générés par l'IA ITEM, puis rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête de l'utilisateur** en respectant la personnalité indiquée, en te basant sur les articles fournis dans le JSON et le contexte de la requête.
2. Si **aucun article** n'est trouvé, **indique-le clairement et ne dis rien d'autre** dans le contenu.
3. Si un ou plusieurs articles sont présents, **ne trie pas** les résultats : ils sont déjà classés par pertinence.
4. Pour chaque article, récupère les images situées dans metadata.images du JSON. S'il y en a plusieurs, **affiche au maximum les 3 premières** images.
5. Affiche les images en **markdown**, uniquement si elles existent. Sinon, **n'affiche aucune image**.
6. La mise en forme du contenu doit être :
   - En markdown **compatible avec \`react-markdown\`**
   - Sans espaces ou sauts de ligne superflus
   - **Professionnelle, moderne, élégante, épurée et avancée**
7. Suis **ce modèle précis** pour chaque article :

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, inspiré du style de la personnalité._

**🛒 [Ajouter au panier](#)**

---

8. Retourne **uniquement** un JSON **valide** au format suivant et **parsable par \`JSON.parse()\`** :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse() en prenant en charge les SyntaxError: Unexpected token:
{
  "content": "Texte en markdown généré à partir de la requête et des articles trouvés",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente",
    "Suggestion 2 pertinente",
    "Suggestion 3 pertinente",
    "Suggestion 4 pertinente",
    "Suggestion 5 pertinente"
  ]
}

9. Les suggestions doivent être **intelligentes, dynamiques**, et **pertinentes** par rapport à la requête initiale et aux produits détectés.

---
`;

const PROMPT_RAG6 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation nommée **IA ITEM** a généré les articles suivants (au format JSON, de 0 à 5 articles) :  
**${response}**

## Ta mission :
Analyse la requête de l'utilisateur et les résultats générés par l'IA ITEM, puis rédige une réponse dans le style de la personnalité suivante : **${personality}**.

### Instructions obligatoires :

1. **Réponds à la requête** en respectant la personnalité indiquée, en t'appuyant sur les articles fournis dans le JSON.
2. Si **aucun article** n'est trouvé, **indique-le clairement** dans le champ \`content\`, sans ajouter d'autres éléments.
3. Ne trie **pas** les articles : ils sont déjà classés par pertinence par l'IA ITEM.
4. Pour chaque article :
   - Va chercher les images dans \`metadata.images\`, qui est un **tableau** d’URLs (maximum 3).
   - Si ce tableau contient des images, affiche-les en **markdown compatible avec \`react-markdown\`**, les unes à la suite des autres (sans saut de ligne).
   - S'il n’y a **aucune image**, **n’en affiche pas**.
5. Respecte cette mise en forme **exclusivement** pour chaque article :

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si disponible)

> ✨ _Phrase d'accroche ou usage recommandé, adaptée à la personnalité._

**🛒 [Ajouter au panier](#)**
---

6. Ne laisse **aucun saut de ligne ou espace inutile** dans \`content\`. La réponse doit être **esthétique, moderne, professionnelle, élégante, claire et épurée**.
7. Retourne uniquement un **objet JSON valide** (parsable via \`JSON.parse()\`) au format suivant :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Réponse complète en markdown générée dynamiquement à partir des articles et de la personnalité",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente et dynamique",
    "Suggestion 2 adaptée à la demande",
    "Suggestion 3 contextuelle",
    "Suggestion 4 personnalisée",
    "Suggestion 5 basée sur les articles"
  ]
}


8. Les suggestions doivent être **cohérentes avec la requête et le contenu retourné** par l'IA ITEM.

---
`;


const PROMPT_RAG1 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour Younzee.

L'utilisateur a demandé la requête suivante: ${query}
L'IA ITEM a répondu (Une IA de recommandation de produits) et a trouvé les articles suivants (0 à 5) Recupere les 3 premiers articles les plus pertinents depuis ce JSON: ${response}

Analyse la demande de l'utilisateur et la reponse de l'IA ITEM (Une IA de recommandation de produits) et emploie cette personnalité que tu devra employer dans ta reponse: ${personality}

Dans ta reponse tu dois imperativement effectuer les actions suivantes dans le content:
1. Faire une reponse adaptée a la requête de l'utilisateur en adoptant la personnalité donnée en reprenant les informations du JSON et le contexte de la requête.
2. Prendre en compte la personnalité que tu dois adopter a savoir ${personality}.
3. Si aucun article n'est trouvé, tu peux dire que tu n'as pas trouvé d'article correspondant à la requête et ne rien dire d'autre.
4. Si un ou plusieurs articles sont trouvés c'est qu'ils ont deja été tries par l'IA ITEM tu n'as pas besoin de les trier de nouveau.
5. Recherche et trouve de facon intelligente les images de l'article a metadata.images du JSON founi par l'IA ITEM (ex: https://cdn.shopify.com/s/files/1/0806/4814/3128/files/made-in-france-t-shirt-328432.jpg?v=1733153429)
6. Recupere la OU les bonnes url de l'image pour le bon article. S'il y a plusieurs images pour un article, affiches au plus les 3 premieres images a la suite pour cet article.
7. Afficher les images d'un article en markdown que si elles sont trouvées sinon ne pas afficher d'image pour cet article.
7. Fais en sorte qu'il n'y ait pas d'espaces et de sauts de ligne inutiles dans le content et effectue une mise en forme et une mise en page belle, professionnel, elegante, avancée, moderne et epuré markdown compatible avec react-markdown.
8. Fais en sorte que le JSON soit parsable par JSON.parse() et que le content soit parsable par react-markdown.
9. Suis cette mise en page au moment seulement de la description des articles:

Description de la reponse adapte au ton et a la personnalite que je t'ai donnée en markdown avec les articles trouvés par l'IA ITEM et le contexte de la requête (ex: "Voici des t-shirts noirs en M que je t'ai trouvés pour ta requête:" a adapter a la personnalite et au contexte de la requête selon le ton que tu dois adopter)

## 👗 **Robe Longue Bohème**

image 1
image 2
image 3

- **Prix :** 59,99 €  
- **Tailles :** S, M, L, XL | 34 à 44
- **Couleurs :** Beige | Terracotta | Bleu nuit  
- **Matière :** Lin et coton bio  
- **Coupe :** Taille haute, jambe droite // si pantalon  
- **Écoresponsable :** ♻️ 30% coton recyclé // si écoresponsable
- **Stock :** ✅ Disponible // si stock disponible

> ✨ _Idéale pour les journées ensoleillées. Léger, fluide et élégant._

**🛒 [Ajouter au panier](#)**

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Descritions detaillees des articles trouvés par l'IA ITEM ou une courte description et explication si aucun article n'est trouvé.",
  "request": "La requête de l'utilisateur",
  "timestamp": "timestamp de la requête",
  "suggestions": ["Je cherche un sweat noir en M sous 60€", "Conseille-moi une tenue pour l'hiver", "Quelles sont vos dernières tendances ?", "J'ai un budget de 100€, que recommandes-tu ?", "Guide des tailles pour les pantalons"] //Suggestions de questions a genere dynamiquement en fonction de la reponse de l'IA ITEM et de la requête de l'utilisateur
}
`

const PROMPT_RAG7 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour **Younzee**.

## Contexte :
- L'utilisateur a formulé la requête suivante : **${query}**
- L'IA de recommandation, nommée **IA ITEM**, a renvoyé une **liste (array)** d'articles (maximum 5), sous ce format JSON :  
**${response}**

## Ta mission :
Analyse la requête de l'utilisateur et les articles retournés, puis rédige une réponse adaptée en adoptant la personnalité suivante : **${personality}**.

### Règles obligatoires :

1. Parcours le tableau \`response\` et récupère **au maximum les 3 premiers articles** du tableau.
2. Si aucun article n’est présent, écris une phrase simple indiquant qu'aucun produit ne correspond à la demande, et ne retourne rien d'autre dans le champ \`content\`.
3. Ne trie pas les articles : ils sont **déjà classés par pertinence**.
4. Pour chaque article :
   - Accède à la propriété \`metadata.images\`, qui est un **tableau d'URLs**.
   - Si ce tableau contient des URLs, **affiche au maximum les 3 premières** sous forme d’images en markdown.
   - Si aucune image n’est présente, **n'affiche pas de bloc image**.
5. Génère une réponse textuelle adaptée à la requête et à la personnalité indiquée, en suivant ce modèle de présentation pour chaque article :

---

## 👗 **Nom de l'article**

_image 1_  
_image 2_  
_image 3_

- **Prix :** XX,XX €  
- **Tailles :** XS à XL // ou tailles spécifiques  
- **Couleurs :** Noir | Beige | Autres couleurs  
- **Matière :** Ex: Coton bio  
- **Coupe :** Ex: Taille haute, jambe droite (si applicable)  
- **Écoresponsable :** ♻️ % matière recyclée (si applicable)  
- **Stock :** ✅ Disponible (si applicable)

> ✨ _Phrase d'accroche inspirée de la personnalité demandée._

**🛒 [Ajouter au panier](#)**

---

6. Évite **tout espace ou saut de ligne inutile** dans \`content\`. Le rendu doit être **propre, lisible, moderne, élégant et compatible avec react-markdown**.
7. Retourne **uniquement** un objet JSON au format suivant, **valide et parsable avec \`JSON.parse()\`** :

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Réponse complète en markdown",
  "request": "Contenu exact de la requête utilisateur",
  "timestamp": "timestamp ISO de la requête",
  "suggestions": [
    "Suggestion 1 pertinente",
    "Suggestion 2 utile",
    "Suggestion 3 liée à la demande",
    "Suggestion 4 orientée produit",
    "Suggestion 5 basée sur la tendance ou le besoin exprimé"
  ]
}


8. Génère les suggestions de manière **dynamique et cohérente** avec la requête et les résultats produits.

---
`;


const PROMPT_RAG_3 = (query: string, response: string, personality: string) => `
Tu es un expert en recommandation de produits e-commerce pour Younzee.

L'utilisateur a demandé la requête suivante: ${query}
L'IA ITEM a répondu (Une IA de recommandation de produits) et a trouvé les articles suivants (0 à 5) Recupere les 3 premiers articles les plus pertinents depuis ce JSON: ${response}

Analyse la demande de l'utilisateur et la reponse de l'IA ITEM (Une IA de recommandation de produits) et emploie cette personnalité que tu devra employer dans ta reponse: ${personality}

Dans ta reponse tu dois imperativement effectuer les actions suivantes dans le content:
1. Faire une reponse adaptée a la requête de l'utilisateur en adoptant la personnalité donnée en reprenant les informations du JSON et le contexte de la requête.
2. Prendre en compte la personnalité que tu dois adopter a savoir ${personality}.
3. Si aucun article n'est trouvé, tu peux dire que tu n'as pas trouvé d'article correspondant à la requête et ne rien dire d'autre.
4. Si un ou plusieurs articles sont trouvés c'est qu'ils ont deja été tries par l'IA ITEM tu n'as pas besoin de les trier de nouveau.
5. Trouve les images des articles dans le JSON et affiche les a l'emplacement renseigner ci-dessous.
6. Recupere la bonne url de l'image pour le bon article. S'il y a plusieurs images pour un article, affiches au plus les 3 premieres images a la suite pour cet article.
7. Fais en sorte qu'il n'y ait pas d'espaces et de sauts de ligne inutiles dans le content et effectue une mise en forme et une mise en page belle, professionnel, elegante, avancée, moderne et epuré markdown compatible avec react-markdown.
8. Fais en sorte que le JSON soit parsable par JSON.parse() et que le content soit parsable par react-markdown.
9. Suis cette mise en page au moment seulement de la description des articles:

Description de la reponse adapte au ton et a la personnalite que je t'ai donnée en markdown avec les articles trouvés par l'IA ITEM et le contexte de la requête (ex: "Voici des t-shirts noirs en M que je t'ai trouvés pour ta requête:" a adapter a la personnalite et au contexte de la requête selon le ton que tu dois adopter)

## 👗 **Robe Longue Bohème**

![Robe Bohème](url de l'image 1)
![Robe Bohème 2](url de l'image 2)
![Robe Bohème 3](url de l'image 3)

- **Prix :** 59,99 €  
- **Tailles :** S, M, L, XL  
- **Couleurs :** Beige | Terracotta | Bleu nuit  
- **Matière :** Lin et coton bio  

> ✨ _Idéale pour les journées ensoleillées. Léger, fluide et élégant._

**🛒 [Ajouter au panier](#)**

---

## 👕 **T-shirt Oversize Unisexe**

![T-shirt Oversize](url de l'image 1)
![T-shirt Oversize 2](url de l'image 2)
![T-shirt Oversize 3](url de l'image 3)

- **Prix :** 29,90 €  
- **Tailles :** XS à XXL  
- **Couleurs :** Blanc | Noir | Kaki | Lilas  
- **Matière :** 100% coton bio  
- **Stock :** ✅ Disponible

> 💬 _"Confort absolu. Le T-shirt parfait pour un look minimaliste."_

**🛒 [Ajouter au panier](#)**

---

## 👖 **Jean Droit Vintage**

![Jean Vintage](url de l'image 1)
![Jean Vintage 2](url de l'image 2)
![Jean Vintage 3](url de l'image 3)

- **Prix :** 74,50 €  
- **Tailles :** 34 à 44  
- **Couleurs :** Bleu brut | Denim clair  
- **Coupe :** Taille haute, jambe droite  
- **Écoresponsable :** ♻️ 30% coton recyclé

> 🧵 _Style intemporel, coupe flatteuse et durable._

**🛒 [Ajouter au panier](#)**

RETOURNE UNIQUEMENT DU JSON VALIDE et Parseable par JSON.parse():
{
  "content": "Descritions detaillees des articles trouvés par l'IA ITEM ou une courte description et explication si aucun article n'est trouvé.",
  "request": "La requête de l'utilisateur",
  "timestamp": "timestamp de la requête",
  "suggestions": ["Je cherche un sweat noir en M sous 60€", "Conseille-moi une tenue pour l'hiver", "Quelles sont vos dernières tendances ?", "J'ai un budget de 100€, que recommandes-tu ?", "Guide des tailles pour les pantalons"] //Suggestions de questions a genere dynamiquement en fonction de la reponse de l'IA ITEM et de la requête de l'utilisateur
}
`

/**
 * IA Master - Orchestrateur intelligent avec personnalisation du chatbot depuis Supabase
 * Récupère automatiquement les configurations depuis la base de données
 */

type AIRoutingResult = {
  success: boolean
  aiType: string
  confidence: number
  response?: any
  error?: string
  metadata?: any
}


/**
 * Récupère la configuration du chatbot
 */
async function getChatbotConfig(chatbotId?: string): Promise<ChatbotConfig | null> {
  const configResult = await ChatbotConfigService.resolveConfig(chatbotId)
  if (!configResult.success || !configResult.config) {
    return null
  }
  return configResult.config
}

/**
 * Appel de l'IA Master et callback du RAG-OpenAI
 */
async function callMasterAI(message: string, chatbotId?: string): Promise<AIRoutingResult> {
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`)) {
      window.localStorage.setItem(`${chatbotId}-chatbot-config-younzee`, JSON.stringify(`${Date.now()}`))
    }
  }

  const id = typeof window !== 'undefined' ? window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`) : null

  const openaiService = new OpenAIService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const response = await openaiService.generateResponse({
    systemPrompt: PROMPT_MASTER(JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  })
  if (!response) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: `Erreur HTTP: ${response}`
    }
  }
  console.log('response', response)
  const data = JSON.parse(response)
  return {
    success: true,
    aiType: 'master',
    confidence: 1,
    response: data
  }
}


async function callMasterAIToRAG(message: string, chatbotId?: string): Promise<AIRoutingResult> {
  const response = await callRAG(message, chatbotId)
  console.log('responseRAG1', response)
  if (!response.success) {
    return response
  }
  if (typeof window !== 'undefined') {
    if (!window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`)) {
      window.localStorage.setItem(`${chatbotId}-chatbot-config-younzee`, JSON.stringify(`${Date.now()}`))
    }
  }

  const id = typeof window !== 'undefined' ? window.localStorage.getItem(`${chatbotId}-chatbot-config-younzee`) : null

  const openaiService = new OpenAIService()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const config = await getChatbotConfig(chatbotId)
  const responseRAG = await openaiService.generateResponse({
    systemPrompt: PROMPT_RAG7(message, JSON.stringify(response.data.results), JSON.stringify(config?.personality)),
    userMessage: message,
    context: {
      conversationHistory: [],
      userPreferences: {},
      userId: `test-${chatbotId}-${id}`
    }
  })
  if (!responseRAG) {
    return {
      success: false,
      aiType: 'error',
      confidence: 0,
      error: `Erreur HTTP: ${responseRAG}`
    }
  }
  console.log('responseRAG', responseRAG)
  console.log('responseRAG.content', typeof responseRAG)
  const data = JSON.parse(responseRAG)
  return {
    success: true,
    aiType: 'master',
    confidence: 1,
    response: {
      ...response,
      ...data
    }
  }
}

/**
 * Appelle l'API RAG-OpenAI
 */
async function callRAG(query: string, chatbotId?: string): Promise<any> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/rag-openai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query
      })
    })

    const ragData = await response.json()
    return ragData
  } catch (error: any) {
    console.error('❌ Erreur appel RAG:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ✅ NOUVELLE FONCTION: Analyse si une requête convient au RAG
 */
function analyzeForRAG(message: string): {
  canHandle: boolean,
  confidence: number,
  reasoning: string,
  criteria: any
} {
  const lowerMessage = message.toLowerCase().trim()
  let confidence = 0
  let reasoning = ''
  const criteria: any = {}

  // Mots-clés de vêtements spécifiques
  const clothingKeywords = [
    'tshirt', 't-shirt', 'chemise', 'pull', 'sweat', 'gilet', 'veste', 'manteau',
    'pantalon', 'jean', 'short', 'jupe', 'robe', 'combinaison',
    'chaussures', 'baskets', 'sneakers', 'bottes', 'sandales', 'talons',
    'sous-vêtements', 'soutien-gorge', 'culotte', 'boxer', 'chaussettes',
    'accessoires', 'sac', 'ceinture', 'chapeau', 'écharpe', 'gants'
  ]

  const clothingMatches = clothingKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Critères spécifiques (couleur, taille, prix)
  const criteriaKeywords = [
    'noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris', 'marron',
    'taille', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'small', 'medium', 'large',
    '36', '38', '40', '42', '44', '46', '48', '50',
    'prix', 'euro', '€', 'budget', 'moins de', 'maximum', 'pas cher'
  ]

  const criteriaMatches = criteriaKeywords.filter(keyword => 
    lowerMessage.includes(keyword)
  ).length

  // Extraction des critères pour les métadonnées
  // extractCriteriaForRAG(lowerMessage, criteria) // Fonction supprimée

  // Calcul de la confiance
  confidence += clothingMatches * 0.4  // Poids élevé pour les vêtements
  confidence += criteriaMatches * 0.3  // Poids moyen pour les critères

  // ✅ BONUS: Requêtes avec critères précis (idéal pour RAG)
  if (criteriaMatches >= 2) {
    confidence += 0.3
    reasoning += 'Critères multiples détectés (idéal pour RAG). '
  }

  // ✅ BONUS: Articles spécifiques avec critères
  if (clothingMatches > 0 && criteriaMatches > 0) {
    confidence += 0.4
    reasoning += 'Article spécifique avec critères précis. '
  }

  // ✅ BONUS: Recherche avec taille ET couleur (forte indication RAG)
  const hasSizeAndColor = 
    criteriaKeywords.some(k => ['taille', 'xs', 's', 'm', 'l', 'xl', 'xxl', '36', '38', '40', '42', '44', '46', '48', '50'].includes(k) && lowerMessage.includes(k)) &&
    criteriaKeywords.some(k => ['noir', 'blanc', 'rouge', 'bleu', 'vert', 'jaune', 'rose', 'gris'].includes(k) && lowerMessage.includes(k))
  
  if (hasSizeAndColor) {
    confidence += 0.5
    reasoning += 'Taille ET couleur spécifiées (parfait pour RAG). '
  }

  // ✅ PÉNALITÉ: Demandes d'outfits complets (pas idéal pour RAG)
  const outfitKeywords = ['tenue', 'outfit', 'look', 'ensemble', 'style complet', 'coordonner', 'assortir']
  if (outfitKeywords.some(keyword => lowerMessage.includes(keyword))) {
    confidence -= 0.4
    reasoning += 'Demande d\'outfit détectée (moins adapté au RAG). '
  }

  // ✅ PÉNALITÉ: Questions FAQ
  if (lowerMessage.includes('?') || lowerMessage.includes('comment') || lowerMessage.includes('pourquoi')) {
    confidence -= 0.3
    reasoning += 'Question FAQ détectée. '
  }

  confidence = Math.min(Math.max(confidence, 0), 1)

  // Raisonnement final
  if (confidence > 0.7) {
    reasoning += 'Excellent candidat pour RAG.'
  } else if (confidence > 0.5) {
    reasoning += 'Bon candidat pour RAG.'
  } else {
    reasoning += 'Pas adapté au RAG.'
  }

  return {
    canHandle: confidence > 0.5, // Seuil pour traiter avec RAG
    confidence,
    reasoning,
    criteria
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { message, context = {}, chatbotId, chatbotConfig = {} } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message requis' })
    }

    const userMessage = message.trim()

    // Récupération de la configuration depuis Supabase (priorité sur chatbotId)
    const configResult = await ChatbotConfigService.resolveConfig(chatbotId, chatbotConfig)
    console.log('configResult', configResult, chatbotId, message)
    if (!configResult.success || !configResult.config) {
      return res.status(500).json({ 
        error: 'Configuration chatbot non disponible',
        details: configResult.error 
      })
    }

    const { config, source } = configResult
    console.log('config', config)
    const personality = config.personality
    ChatbotConfigService.logConfigSource(chatbotId, source, config.name)
    // Log de la configuration utilisée
    console.log(`🎯 IA Master: message "${userMessage.substring(0, 50)}..." avec config ${config.name} (${source})`)

    const routingResult = await callMasterAI(userMessage, chatbotId)
    console.log('routingResult', routingResult)
    if (routingResult.success) {
      const response = routingResult.response
      //const personalizedContent = applyPersonalization(response.message, personality)
      //console.log('personalizedContent', personalizedContent)
      if (response.primaryType === 'ITEM') {
        const ragResult = await callMasterAIToRAG(response.request, chatbotId)
        console.log('ragResult', ragResult)
        console.log('ragResult.response', ragResult.response)
        return res.status(200).json(ragResult)
      }
      return res.status(200).json(response)
    }



  } catch (error: any) {
    console.error('❌ Erreur IA Master:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement par l\'IA Master',
      details: error.message
    })
  }
} 