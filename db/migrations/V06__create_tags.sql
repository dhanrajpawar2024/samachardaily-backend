-- ============================================================
-- V6: Tags & Article–Tag Mapping
-- ============================================================

CREATE TABLE tags (
    id        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name      VARCHAR(100) NOT NULL,
    language  CHAR(2)     NOT NULL,
    UNIQUE (name, language)
);

CREATE TABLE article_tags (
    article_id  UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

