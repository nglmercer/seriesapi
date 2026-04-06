export class EpisodeView {
  static formatDetail(episode: any) {
    if (!episode) return null;
    return episode;
  }

  static formatCredits(credits: any[]) {
    return credits;
  }

  static formatImages(images: any[]) {
    return images;
  }

  static formatComments(comments: any[]) {
    return comments.map(comment => ({
      ...comment,
      replies: typeof comment.replies === "string" ? JSON.parse(comment.replies) : comment.replies
    }));
  }
}
