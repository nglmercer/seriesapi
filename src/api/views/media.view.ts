export class MediaView {
  static formatList(rows: any[]) { return rows; }
  static formatDetail(media: any) { return media; }
  static formatSeasons(seasons: any[]) { return seasons; }
  static formatEpisodes(episodes: any[]) { return episodes; }
  static formatCredits(credits: any) { return credits; }
  static formatImages(images: any[]) { return images; }
  static formatVideos(videos: any[]) { return videos; }
  static formatRelated(related: any[]) { return related; }
  static formatComments(comments: any[]) {
    return comments.map(comment => ({
      ...comment,
      replies: typeof comment.replies === "string" ? JSON.parse(comment.replies) : comment.replies
    }));
  }
}
