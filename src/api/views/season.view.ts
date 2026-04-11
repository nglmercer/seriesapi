export class SeasonView {
  static formatDetail(season: any) {
    if (!season) return null;
    return {
      id: season.id,
      media_id: season.media_id,
      season_number: season.season_number,
      episode_count: season.episode_count,
      air_date: season.air_date,
      end_date: season.end_date,
      score: season.score,
      score_count: season.score_count,
      external_ids: typeof season.external_ids === "string" ? JSON.parse(season.external_ids) : season.external_ids,
      name: season.name,
      synopsis: season.synopsis,
      poster_url: season.poster_url
    };
  }

  static formatEpisodes(episodes: any[]) {
    return episodes.map(episode => ({
      id: episode.id,
      episode_number: episode.episode_number,
      absolute_number: episode.absolute_number,
      episode_type: episode.episode_type,
      air_date: episode.air_date,
      runtime_minutes: episode.runtime_minutes,
      score: episode.score,
      title: episode.title,
      synopsis: episode.synopsis,
      still_url: episode.still_url
    }));
  }

  static formatImages(images: any[]) {
    return images.map(img => ({
      id: img.id,
      image_type: img.image_type,
      locale: img.locale,
      url: img.url,
      width: img.width,
      height: img.height,
      is_primary: Boolean(img.is_primary),
      vote_average: img.vote_average
    }));
  }

  static formatComments(comments: any[]) {
    return comments.map(comment => {
      let parsedReplies: any[] = [];
      if (typeof comment.replies === "string") {
        try {
          const parsed = JSON.parse(comment.replies);
          parsedReplies = Array.isArray(parsed) ? parsed : [];
        } catch {
          parsedReplies = [];
        }
      } else if (Array.isArray(comment.replies)) {
        parsedReplies = comment.replies;
      }

      return {
        id: comment.id,
        parent_id: comment.parent_id,
        display_name: comment.display_name,
        locale: comment.locale,
        body: comment.body,
        contains_spoilers: Boolean(comment.contains_spoilers),
        likes: comment.likes,
        dislikes: comment.dislikes,
        created_at: comment.created_at,
        replies: parsedReplies.map((r: any) => ({
          id: r.id,
          display_name: r.display_name,
          body: r.body,
          likes: r.likes,
          created_at: r.created_at
        }))
      };
    });
  }
}
