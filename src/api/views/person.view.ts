export class PersonView {
  static formatList(rows: any[]) {
    return rows;
  }

  static formatDetail(person: any) {
    if (!person) return null;
    return person;
  }

  static formatCredits(credits: any[]) {
    return credits;
  }
}
