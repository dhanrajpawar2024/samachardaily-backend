const distance = require('ml-distance');
const numeric = require('numeric');
const redis = require('../db/redis');

/**
 * Cosine similarity between two vectors
 */
const cosineSimilarity = (vec1, vec2) => {
  const dotProduct = numeric.dotProduct(vec1, vec2);
  const magnitude1 = Math.sqrt(numeric.dotProduct(vec1, vec1));
  const magnitude2 = Math.sqrt(numeric.dotProduct(vec2, vec2));

  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Euclidean distance between two vectors
 */
const euclideanDistance = (vec1, vec2) => {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    const diff = vec1[i] - vec2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Generate embedding for user based on their interactions
 * Averaging embeddings of articles they engaged with
 */
const generateUserEmbedding = async (userId, db) => {
  try {
    // Get articles user has interacted with
    const interactions = await db.getAll(
      `SELECT DISTINCT a.embedding 
       FROM interactions i 
       JOIN articles a ON i.article_id = a.id 
       WHERE i.user_id = $1 
       AND i.interaction_type IN ('like', 'bookmark', 'view')
       AND a.embedding IS NOT NULL
       ORDER BY i.created_at DESC
       LIMIT 100`,
      [userId]
    );

    if (interactions.length === 0) {
      return null;
    }

    // Average embeddings
    const dim = interactions[0].embedding.length;
    const avgEmbedding = new Array(dim).fill(0);

    for (const interaction of interactions) {
      for (let i = 0; i < dim; i++) {
        avgEmbedding[i] += interaction.embedding[i];
      }
    }

    for (let i = 0; i < dim; i++) {
      avgEmbedding[i] /= interactions.length;
    }

    return avgEmbedding;
  } catch (error) {
    console.error('[Recommendation Service] Error generating user embedding:', error);
    return null;
  }
};

/**
 * Find similar articles using embeddings
 */
const findSimilarArticles = async (articleId, limit, db, redisDb) => {
  const cacheKey = `similar_articles:${articleId}`;

  // Check cache first
  const cached = await redisDb.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  try {
    // Get source article embedding
    const article = await db.getOne('SELECT embedding FROM articles WHERE id = $1', [articleId]);

    if (!article || !article.embedding) {
      return [];
    }

    // Get all other articles with embeddings (excluding source)
    const candidates = await db.getAll(
      `SELECT id, embedding 
       FROM articles 
       WHERE id != $1 
       AND embedding IS NOT NULL
       AND published_at > NOW() - INTERVAL '30 days'
       LIMIT 1000`,
      [articleId]
    );

    // Calculate similarities
    const similarities = candidates
      .map((candidate) => ({
        article_id: candidate.id,
        similarity: cosineSimilarity(article.embedding, candidate.embedding),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    // Cache for 1 hour
    await redisDb.set(cacheKey, similarities, 3600);

    return similarities;
  } catch (error) {
    console.error('[Recommendation Service] Error finding similar articles:', error);
    return [];
  }
};

module.exports = {
  cosineSimilarity,
  euclideanDistance,
  generateUserEmbedding,
  findSimilarArticles,
};
