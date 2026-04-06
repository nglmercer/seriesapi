import type { SqliteNapiAdapter } from "../../core/driver";

export class CollectionView {
  static formatList(rows: any[]) {
    return rows.map(row => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      overview: row.overview,
      backdrop_url: row.backdrop_url,
      poster_url: row.poster_url,
      item_count: row.item_count
    }));
  }

  static formatDetail(collection: any, items: any[]) {
    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      overview: collection.overview,
      backdrop_url: collection.backdrop_url,
      poster_url: collection.poster_url,
      items: items.map(item => ({
        order: item.order,
        media: {
          id: item.id,
          slug: item.slug,
          content_type: item.content_type,
          original_title: item.original_title,
          status: item.status,
          release_date: item.release_date,
          score: item.score,
          title: item.title,
          synopsis_short: item.synopsis_short,
          poster_url: item.poster_url
        }
      }))
    };
  }
}
