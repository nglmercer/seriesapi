export class SearchView {
  static formatList(rows: any[]) {
    return rows.map(row => ({
      entity_type: row.entity_type,
      id: row.id,
      slug: row.slug,
      content_type: row.content_type,
      title: row.title,
      description: row.description,
      score: row.score,
      release_date: row.release_date,
      image_url: row.image_url
    }));
  }
}
