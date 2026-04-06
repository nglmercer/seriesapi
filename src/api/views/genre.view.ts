export class GenreView {
  static formatList(rows: any[]) {
    return rows.map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      image_url: row.image_url
    }));
  }

  static formatDetail(genre: any, items: any[]) {
    return {
      genre: {
        id: genre.id,
        slug: genre.slug,
        name: genre.name
      },
      items: items.map(item => ({
        id: item.id,
        slug: item.slug,
        content_type: item.content_type,
        original_title: item.original_title,
        status: item.status,
        release_date: item.release_date,
        score: item.score,
        popularity: item.popularity,
        title: item.title,
        synopsis_short: item.synopsis_short,
        poster_url: item.poster_url
      }))
    };
  }
}
