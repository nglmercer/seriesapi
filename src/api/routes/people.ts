/**
 * /api/v1/people  –  Cast & crew routes
 *
 * GET  /api/v1/people                 – paginated list
 * GET  /api/v1/people/:id             – person detail + localized bio
 * GET  /api/v1/people/:id/credits     – all media they appear in
 */

import type { Database } from "sqlite-napi";
import { ok, notFound, serverError } from "../response";
import { PersonController } from "../controllers/person.controller";
import { PersonView } from "../views/person.view";

export function handlePeopleList(req: Request, _db: Database): Response {
  try {
    const result = PersonController.getList(req);
    if ("error" in result) return result.error as Response;

    const { rows, params } = result;
    return ok(PersonView.formatList(rows), params);
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handlePersonDetail(req: Request, _db: Database, id: number): Response {
  try {
    const { person, locale } = PersonController.getDetail(req, id);
    if (!person) return notFound("Person", locale);
    return ok(PersonView.formatDetail(person), { locale });
  } catch (err) {
    return serverError(err, "en");
  }
}

export function handlePersonCredits(req: Request, _db: Database, personId: number): Response {
  try {
    const { rows, locale, total } = PersonController.getCredits(req, personId);
    return ok(PersonView.formatCredits(rows), { locale, total });
  } catch (err) {
    return serverError(err, "en");
  }
}
