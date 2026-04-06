export class EpisodeView {
  static formatDetail(episode: any) {
    if (!episode) return null;
    return {
      id: episode.id,
      media_id: episode.media_id,
      season_id: episode.season_id,
      season_number: episode.season_number,
      episode_number: episode.episode_number,
      absolute_number: episode.absolute_number,
      episode_type: episode.episode_type,
      air_date: episode.air_date,
      runtime_minutes: episode.runtime_minutes,
      score: episode.score,
      score_count: episode.score_count,
      external_ids: typeof episode.external_ids === "string" ? JSON.parse(episode.external_ids) : episode.external_ids,
      title: episode.title,
      synopsis: episode.synopsis,
      still_url: episode.still_url
    };
  }

  static formatCredits(credits: any[]) {
    return credits.map(c => ({
      id: c.id,
      name: c.name,
      credit_type: c.credit_type,
      role_name: c.role_name,
      profile_url: c.profile_url
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
