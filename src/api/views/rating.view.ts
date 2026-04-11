export class RatingView {
  static formatStats(stats: { average: number; count: number }) {
    return {
      average: stats.average,
      count: stats.count,
    };
  }

  static formatWithUserScore(stats: { average: number; count: number; userScore: number }) {
    return {
      average: stats.average,
      count: stats.count,
      userScore: stats.userScore,
    };
  }

  static formatTopRated(items: any[]) {
    return items.map(item => ({
      id: item.id,
      score: item.score,
      score_count: item.score_count,
      title: item.title,
      slug: item.slug,
      media_id: item.media_id,
      season_number: item.season_number,
      episode_number: item.episode_number,
    }));
  }

  static formatUserRatings(result: { items: any[]; total: number }, locale: string, page: number, pageSize: number) {
    return {
      items: result.items.map(item => ({
        id: item.id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        score: item.score,
        created_at: item.created_at,
        title: item.title,
        slug: item.slug,
      })),
      total: result.total,
      page,
      pageSize,
    };
  }
}