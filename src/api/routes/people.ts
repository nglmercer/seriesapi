/**
 * /api/v1/people  –  Cast & crew routes
 *
 * GET  /api/v1/people                 – paginated list
 * GET  /api/v1/people/:id             – person detail + localized bio
 * GET  /api/v1/people/:id/credits     – all media they appear in
 */

import { serverError } from "../response";
import { PersonController } from "../controllers/person.controller";
import { PersonView } from "../views/person.view";
import { ApiContext } from "../context";

export function handlePeopleList(ctx: ApiContext): Response {
  try {
    const result = PersonController.getList(ctx);
    if ("error" in result) return result.error as Response;

    const { rows, params } = result;
    return ctx.ok(PersonView.formatList(rows), params);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handlePersonDetail(ctx: ApiContext, id: number): Response {
  try {
    const { person, locale } = PersonController.getDetail(ctx, id);
    if (!person) return ctx.notFound("Person");
    return ctx.ok(PersonView.formatDetail(person), { locale });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export function handlePersonCredits(ctx: ApiContext, personId: number): Response {
  try {
    const { rows, locale, total } = PersonController.getCredits(ctx, personId);
    return ctx.ok(PersonView.formatCredits(rows), { locale, total });
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}
