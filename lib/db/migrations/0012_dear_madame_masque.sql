DROP INDEX IF EXISTS "content_search_idx";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "content_search_idx" ON "DocumentChunk" USING gin (to_tsvector('simple', "content"));