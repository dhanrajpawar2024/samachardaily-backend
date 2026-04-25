/**
 * Text cleanup helpers for RSS fragments and fetched article pages.
 * Keeps multilingual prose intact while removing feed/html noise.
 */

const ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '-',
  mdash: '-',
  hellip: '...',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

const decodeHtmlEntities = (value = '') =>
  String(value).replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (match, entity) => {
    const key = entity.toLowerCase();

    if (key[0] === '#') {
      const isHex = key[1] === 'x';
      const codePoint = parseInt(key.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isFinite(codePoint)) {
        try {
          return String.fromCodePoint(codePoint);
        } catch (_) {
          return ' ';
        }
      }
    }

    return Object.prototype.hasOwnProperty.call(ENTITY_MAP, key)
      ? ENTITY_MAP[key]
      : match;
  });

const stripHtml = (value = '') =>
  String(value)
    .replace(/<!\[CDATA\[|\]\]>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

const cleanText = (value = '', maxLength = 10000) => {
  const decoded = decodeHtmlEntities(stripHtml(value));
  const cleaned = stripHtml(decoded)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/(?:read more|read full story|continue reading)\s*$/i, '')
    .trim();

  return maxLength ? cleaned.substring(0, maxLength).trim() : cleaned;
};

const firstMeaningfulText = (...values) => {
  const cleaned = values.map(value => cleanText(value, 0)).filter(Boolean);
  return cleaned.sort((a, b) => b.length - a.length)[0] || '';
};

module.exports = {
  cleanText,
  decodeHtmlEntities,
  firstMeaningfulText,
  stripHtml,
};
