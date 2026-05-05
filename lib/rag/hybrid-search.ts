import { bm25Search, similaritySearch } from "@/lib/db/queries";

/**
 * Reciprocal Rank Fusion (RRF) algorithm
 * Combines rankings from multiple retrieval methods
 *
 * Formula: RRF_score = Σ 1 / (k + rank_i)
 * where k is a constant (typically 60) and rank_i is the rank in each list
 */
function reciprocalRankFusion(
  results: Array<{
    id: string;
    content: string;
    chunkIndex: number;
    fileName: string;
    source: "vector" | "bm25";
    rank: number;
  }>,
  k = 60
): Array<{
  content: string;
  chunkIndex: number;
  fileName: string;
  score: number;
}> {
  // Group by content (deduplication)
  const scoreMap = new Map<
    string,
    {
      content: string;
      chunkIndex: number;
      fileName: string;
      vectorRank?: number;
      bm25Rank?: number;
    }
  >();

  for (const result of results) {
    const key = `${result.fileName}-${result.chunkIndex}`;
    const existing = scoreMap.get(key);

    if (existing) {
      if (result.source === "vector") {
        existing.vectorRank = result.rank;
      } else {
        existing.bm25Rank = result.rank;
      }
    } else {
      scoreMap.set(key, {
        content: result.content,
        chunkIndex: result.chunkIndex,
        fileName: result.fileName,
        vectorRank: result.source === "vector" ? result.rank : undefined,
        bm25Rank: result.source === "bm25" ? result.rank : undefined,
      });
    }
  }

  // Calculate RRF scores
  const scored = Array.from(scoreMap.values()).map((item) => {
    let score = 0;
    if (item.vectorRank !== undefined) {
      score += 1 / (k + item.vectorRank);
    }
    if (item.bm25Rank !== undefined) {
      score += 1 / (k + item.bm25Rank);
    }
    return {
      content: item.content,
      chunkIndex: item.chunkIndex,
      fileName: item.fileName,
      score,
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Hybrid search combining vector similarity and BM25
 *
 * @param chatId - Chat session ID
 * @param query - Search query text
 * @param embedding - Query embedding vector
 * @param limit - Number of results to return (default: 5)
 * @param vectorLimit - Number of results from vector search (default: 20)
 * @param bm25Limit - Number of results from BM25 search (default: 20)
 * @returns Ranked and deduplicated search results
 */
export async function hybridSearch({
  chatId,
  query,
  embedding,
  limit = 5,
  vectorLimit = 20,
  bm25Limit = 20,
}: {
  chatId: string;
  query: string;
  embedding: number[];
  limit?: number;
  vectorLimit?: number;
  bm25Limit?: number;
}) {
  // Run both searches in parallel
  const [vectorResults, bm25Results] = await Promise.all([
    similaritySearch({ chatId, embedding, limit: vectorLimit }),
    bm25Search({ chatId, query, limit: bm25Limit }),
  ]);

  console.log(
    `[Hybrid Search] Vector: ${vectorResults.length}, BM25: ${bm25Results.length}`
  );

  // If one method returns no results, fall back to the other
  if (vectorResults.length === 0 && bm25Results.length === 0) {
    return [];
  }
  if (vectorResults.length === 0) {
    return bm25Results.slice(0, limit).map((r) => ({
      content: r.content,
      chunkIndex: r.chunkIndex,
      fileName: r.fileName,
    }));
  }
  if (bm25Results.length === 0) {
    return vectorResults.slice(0, limit);
  }

  // Prepare results with ranks for RRF
  const rankedResults = [
    ...vectorResults.map((r, idx) => ({
      id: `${r.fileName}-${r.chunkIndex}`,
      content: r.content,
      chunkIndex: r.chunkIndex,
      fileName: r.fileName,
      source: "vector" as const,
      rank: idx + 1,
    })),
    ...bm25Results.map((r, idx) => ({
      id: `${r.fileName}-${r.chunkIndex}`,
      content: r.content,
      chunkIndex: r.chunkIndex,
      fileName: r.fileName,
      source: "bm25" as const,
      rank: idx + 1,
    })),
  ];

  // Apply RRF fusion
  const fused = reciprocalRankFusion(rankedResults);

  // Return top results
  return fused.slice(0, limit).map((r) => ({
    content: r.content,
    chunkIndex: r.chunkIndex,
    fileName: r.fileName,
  }));
}
