export class CommentView {
  static formatDetail(comment: any) {
    if (!comment) return null;
    return {
      id: comment.id,
      entity_type: comment.entity_type,
      entity_id: comment.entity_id,
      parent_id: comment.parent_id,
      display_name: comment.display_name,
      locale: comment.locale,
      body: comment.body,
      contains_spoilers: Boolean(comment.contains_spoilers),
      likes: comment.likes,
      dislikes: comment.dislikes,
      created_at: comment.created_at,
      replies: typeof comment.replies === "string" ? JSON.parse(comment.replies).map((r: any) => ({
        id: r.id,
        display_name: r.display_name,
        body: r.body,
        likes: r.likes,
        contains_spoilers: Boolean(r.contains_spoilers),
        created_at: r.created_at
      })) : comment.replies
    };
  }

  static formatCreated(comment: any) {
    return {
      id: comment.id,
      entity_type: comment.entity_type,
      entity_id: comment.entity_id,
      parent_id: comment.parent_id,
      display_name: comment.display_name,
      locale: comment.locale,
      body: comment.body,
      contains_spoilers: Boolean(comment.contains_spoilers),
      likes: comment.likes,
      dislikes: comment.dislikes,
      created_at: comment.created_at
    };
  }
}
