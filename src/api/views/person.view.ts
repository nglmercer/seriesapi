export class PersonView {
  static formatList(rows: any[]) {
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      birth_date: row.birth_date,
      birth_country: row.birth_country,
      gender: row.gender,
      display_name: row.display_name,
      profile_url: row.profile_url
    }));
  }

  static formatDetail(person: any) {
    if (!person) return null;
    return {
      id: person.id,
      birth_date: person.birth_date,
      death_date: person.death_date,
      birth_country: person.birth_country,
      gender: person.gender,
      also_known_as: typeof person.also_known_as === "string" ? JSON.parse(person.also_known_as) : person.also_known_as,
      external_ids: typeof person.external_ids === "string" ? JSON.parse(person.external_ids) : person.external_ids,
      name: person.name,
      biography: person.biography,
      profile_url: person.profile_url
    };
  }

  static formatCredits(credits: any[]) {
    return credits.map(c => ({
      credit_type: c.credit_type,
      role_name: c.role_name,
      department: c.department,
      job: c.job,
      billing_order: c.billing_order,
      media: {
        id: c.media_id,
        slug: c.slug,
        content_type: c.content_type,
        title: c.title,
        score: c.score,
        release_date: c.release_date,
        poster_url: c.poster_url
      }
    }));
  }
}
