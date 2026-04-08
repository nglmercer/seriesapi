import type { Database } from "sqlite-napi";
import { ok, serverError } from "../response";
import { TagController } from "../controllers/tag.controller";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";

export function handleTagsList(req: Request, _db: Database): Response {
  try {
    const { rows, params } = TagController.getList(req);
    return ok(rows, params);
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}
