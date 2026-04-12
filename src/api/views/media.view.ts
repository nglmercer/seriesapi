export class MediaView {
  static formatList(rows: any[]) {
    return rows.map(row => ({
      id: row.id,
      slug: row.slug,
      content_type: row.content_type,
      original_title: row.original_title,
      status: row.status,
      release_date: row.release_date,
      total_episodes: row.total_episodes,
      total_seasons: row.total_seasons,
      live_seasons_count: row.live_seasons_count,
      live_episodes_count: row.live_episodes_count,
      title: row.title,
      synopsis_short: row.synopsis_short,
      score: row.score,
      popularity: row.popularity,
      view_count: row.view_count || 0,
      poster_url: row.poster_url
    }));
  }

  static formatDetail(media: any) {
    if (!media) return null;
    return {
      id: media.id,
      slug: media.slug,
      content_type: media.content_type,
      original_title: media.original_title,
      original_language: media.original_language,
      status: media.status,
      release_date: media.release_date,
      end_date: media.end_date,
      runtime_minutes: media.runtime_minutes,
      total_episodes: media.total_episodes,
      total_seasons: media.total_seasons,
      live_seasons_count: media.live_seasons_count,
      live_episodes_count: media.live_episodes_count,
      score: media.score,
      score_count: media.score_count,
      popularity: media.popularity,
      view_count: media.view_count || 0,
      age_rating: media.age_rating,
      is_adult: Boolean(media.is_adult),
      external_ids: typeof media.external_ids === "string" ? JSON.parse(media.external_ids) : media.external_ids,
      title: media.title,
      tagline: media.tagline,
      synopsis: media.synopsis,
      synopsis_short: media.synopsis_short,
      poster_url: media.poster_url,
      genres: media.genres,
      tags: media.tags,
      studios: media.studios,
      networks: media.networks
    };
  }

  static formatSeasons(seasons: any[]) {
    return seasons.map(season => ({
      id: season.id,
      season_number: season.season_number,
      episode_count: season.episode_count,
      air_date: season.air_date,
      score: season.score,
      name: season.name,
      synopsis: season.synopsis,
      poster_url: season.poster_url
    }));
  }

  static formatEpisodes(episodes: any[]) {
    return episodes.map(episode => ({
      id: episode.id,
      season_id: episode.season_id,
      season_number: episode.season_number,
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

  static formatCredits(credits: any) {
    return {
      cast: credits.cast.map((c: any) => ({
        id: c.id,
        name: c.name,
        role_name: c.role_name,
        billing_order: c.billing_order,
        is_recurring: Boolean(c.is_recurring),
        episode_count: c.episode_count,
        profile_url: c.profile_url
      })),
      crew: credits.crew.map((c: any) => ({
        id: c.id,
        name: c.name,
        department: c.department,
        job: c.job,
        role_name: c.role_name,
        profile_url: c.profile_url
      }))
    };
  }

  static formatImages(images: any[]) {
    return images.map(img => ({
      id: img.id,
      image_type: img.image_type,
      locale: img.locale,
      url: img.url,
      width: img.width,
      height: img.height,
      aspect_ratio: img.aspect_ratio,
      is_primary: Boolean(img.is_primary),
      vote_average: img.vote_average,
      vote_count: img.vote_count,
      source: img.source
    }));
  }

  static formatVideos(videos: any[]) {
    return videos.map(v => ({
      id: v.id,
      video_type: v.video_type,
      name: v.name,
      site: v.site,
      key: v.key,
      thumbnail_url: v.thumbnail_url,
      published_at: v.published_at,
      official: Boolean(v.official),
      locale: v.locale
    }));
  }

  static formatRelated(related: any[]) {
    return related.map(r => ({
      relation_type: r.relation_type,
      id: r.id,
      slug: r.slug,
      content_type: r.content_type,
      original_title: r.original_title,
      status: r.status,
      title: r.title,
      total_episodes: r.total_episodes,
      total_seasons: r.total_seasons,
      score: r.score,
      release_date: r.release_date,
      poster_url: r.poster_url
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
