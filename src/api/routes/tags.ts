import { serverError } from "../response";
import { TagController } from "../controllers/tag.controller";
import { ApiContext } from "../context";

export function handleTagsList(ctx: ApiContext): Response {
  try {
    const { rows, params } = TagController.getList(ctx);
    return ctx.ok(rows, params);
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}
