const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: process.env.ES_HOST || 'http://localhost:9200',
  auth: {
    username: process.env.ES_USERNAME || 'elastic',
    password: process.env.ES_PASSWORD || 'elastic_secret',
  },
  requestTimeout: 30000,
  maxRetries: 3,
});

// Multilingual analyzers configuration
const INDEX_SETTINGS = {
  settings: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        // English analyzer
        english_analyzer: {
          type: 'standard',
          stopwords: '_english_',
        },
        // Hindi analyzer (simple, no stemmer available)
        hindi_analyzer: {
          type: 'standard',
          stopwords: ['की', 'का', 'कि', 'से', 'या', 'में', 'हैं', 'है', 'था', 'थे'],
        },
        // Marathi analyzer
        marathi_analyzer: {
          type: 'standard',
          stopwords: ['च', 'व', 'का', 'ला', 'हे', 'या', 'आहे', 'होती', 'होतात'],
        },
        // Multilingual with edge_ngram for autocomplete
        autocomplete_analyzer: {
          type: 'custom',
          tokenizer: 'autocomplete_tokenizer',
          filter: ['lowercase'],
        },
      },
      tokenizer: {
        autocomplete_tokenizer: {
          type: 'edge_ngram',
          min_gram: 2,
          max_gram: 20,
          token_chars: ['letter', 'digit'],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: 'keyword' },
      title: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          english: { type: 'text', analyzer: 'english_analyzer' },
          hindi: { type: 'text', analyzer: 'hindi_analyzer' },
          marathi: { type: 'text', analyzer: 'marathi_analyzer' },
          autocomplete: { type: 'text', analyzer: 'autocomplete_analyzer' },
        },
      },
      description: {
        type: 'text',
        fields: {
          english: { type: 'text', analyzer: 'english_analyzer' },
          hindi: { type: 'text', analyzer: 'hindi_analyzer' },
          marathi: { type: 'text', analyzer: 'marathi_analyzer' },
        },
      },
      content: {
        type: 'text',
        fields: {
          english: { type: 'text', analyzer: 'english_analyzer' },
        },
      },
      category_id: { type: 'keyword' },
      category_name: { type: 'keyword' },
      author: { type: 'keyword' },
      source: { type: 'keyword' },
      language: { type: 'keyword' },
      image_url: { type: 'keyword' },
      source_url: { type: 'keyword' },
      published_at: { type: 'date' },
      created_at: { type: 'date' },
      trending_score: { type: 'float' },
      interaction_count: { type: 'integer', index: false },
      bookmark_count: { type: 'integer', index: false },
      is_published: { type: 'boolean' },
      tags: { type: 'keyword' },
      // For filtering and sorting
      published_date: { type: 'date' },
      year: { type: 'integer', index: false },
      month: { type: 'integer', index: false },
      day: { type: 'integer', index: false },
    },
  },
};

const connect = async () => {
  try {
    await client.info();
    console.log('[Elasticsearch] Connected');
  } catch (error) {
    console.error('[Elasticsearch] Connection failed:', error.message);
    throw error;
  }
};

const createIndex = async (indexName = 'sd_articles') => {
  try {
    const exists = await client.indices.exists({ index: indexName });
    if (exists) {
      console.log(`[Elasticsearch] Index ${indexName} already exists`);
      return;
    }

    await client.indices.create({
      index: indexName,
      body: INDEX_SETTINGS,
    });
    console.log(`[Elasticsearch] Index ${indexName} created`);
  } catch (error) {
    console.error(`[Elasticsearch] Index creation failed:`, error.message);
    throw error;
  }
};

const indexArticle = async (article, indexName = 'sd_articles') => {
  try {
    // Extract date components for range queries
    const publishedDate = new Date(article.published_at);
    const payload = {
      ...article,
      year: publishedDate.getFullYear(),
      month: publishedDate.getMonth() + 1,
      day: publishedDate.getDate(),
    };

    await client.index({
      index: indexName,
      id: article.id,
      body: payload,
    });
  } catch (error) {
    console.error('[Elasticsearch] Index error:', error.message);
    throw error;
  }
};

const bulkIndex = async (articles, indexName = 'sd_articles') => {
  if (!articles.length) return { errors: false, items: [] };

  const bulkOps = articles.flatMap((article) => {
    const publishedDate = new Date(article.published_at);
    return [
      { index: { _index: indexName, _id: article.id } },
      {
        ...article,
        year: publishedDate.getFullYear(),
        month: publishedDate.getMonth() + 1,
        day: publishedDate.getDate(),
      },
    ];
  });

  try {
    const result = await client.bulk({ body: bulkOps });
    console.log(`[Elasticsearch] Bulk indexed ${articles.length} articles`);
    return result;
  } catch (error) {
    console.error('[Elasticsearch] Bulk index error:', error.message);
    throw error;
  }
};

const search = async (query, filters = {}, indexName = 'sd_articles') => {
  const must = [];
  const filter = [];

  // Full-text search on title and description
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: [
          'title^3',
          'title.autocomplete^2',
          'description^2',
          'content',
          'tags',
        ],
        fuzziness: 'AUTO',
        prefix_length: 1,
      },
    });
  }

  // Language filter
  if (filters.language) {
    filter.push({
      term: { language: filters.language },
    });
  }

  // Category filter
  if (filters.category_id) {
    filter.push({
      term: { category_id: filters.category_id },
    });
  }

  // Published status
  filter.push({
    term: { is_published: true },
  });

  // Date range filter
  if (filters.date_from || filters.date_to) {
    const dateRange = {};
    if (filters.date_from) dateRange.gte = filters.date_from;
    if (filters.date_to) dateRange.lte = filters.date_to;
    filter.push({
      range: { published_at: dateRange },
    });
  }

  // Author filter
  if (filters.author) {
    filter.push({
      term: { author: filters.author },
    });
  }

  // Source filter
  if (filters.source) {
    filter.push({
      term: { source: filters.source },
    });
  }

  try {
    const result = await client.search({
      index: indexName,
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter,
          },
        },
        sort: [
          { [filters.sort_by || 'published_at']: { order: filters.sort_order || 'desc' } },
        ],
        from: (filters.page - 1) * filters.limit,
        size: filters.limit,
        highlight: {
          fields: {
            title: { number_of_fragments: 1 },
            description: { number_of_fragments: 1 },
          },
          pre_tags: ['<mark>'],
          post_tags: ['</mark>'],
        },
      },
    });

    return {
      total: result.hits.total.value,
      articles: result.hits.hits.map((hit) => ({
        ...hit._source,
        highlight: hit.highlight,
        _score: hit._score,
      })),
      aggregations: result.aggregations,
    };
  } catch (error) {
    console.error('[Elasticsearch] Search error:', error.message);
    throw error;
  }
};

const deleteIndex = async (indexName = 'sd_articles') => {
  try {
    await client.indices.delete({ index: indexName });
    console.log(`[Elasticsearch] Index ${indexName} deleted`);
  } catch (error) {
    console.error('[Elasticsearch] Delete index error:', error.message);
  }
};

const getIndexStats = async (indexName = 'sd_articles') => {
  try {
    const stats = await client.indices.stats({ index: indexName });
    return {
      total_docs: stats.indices[indexName].primaries.docs.count,
      total_size_bytes: stats.indices[indexName].primaries.store.size_in_bytes,
    };
  } catch (error) {
    console.error('[Elasticsearch] Stats error:', error.message);
    return null;
  }
};

module.exports = {
  client,
  INDEX_SETTINGS,
  connect,
  createIndex,
  indexArticle,
  bulkIndex,
  search,
  deleteIndex,
  getIndexStats,
};
