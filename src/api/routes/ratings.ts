import { serverError } from "../response";
import { getUserFromToken, withAuth } from "./auth";
import { ratingCreateSchema, ratingQuerySchema, topRatingsQuerySchema, userRatingsQuerySchema } from "../validation";
import { createOrUpdateRating, getRatingWithUserScore, getTopRated, getUserRatings } from "../controllers/ratings";
import { RatingView } from "../views/rating.view";
import { ApiContext } from "../context";

export const handleRatingPost = withAuth(async (ctx: ApiContext, user) => {
  try {
    const v = await ctx.body(ratingCreateSchema);
    if (!v.success) return v.error;
    
    const { entity_type, entity_id, score } = v.data;
    const ip = ctx.req.headers.get("x-forwarded-for") || "127.0.0.1";
    const result = await createOrUpdateRating(user, entity_type, entity_id, score, ip);
    
    return ctx.ok(RatingView.formatStats(result));
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});

export async function handleRatingGet(ctx: ApiContext) {
  try {
    const v = ctx.validate(ratingQuerySchema);
    if (!v.success) return v.error;
    
    const { entity_type, entity_id } = v.data;
    const user = getUserFromToken(ctx); 
    const result = await getRatingWithUserScore(user, entity_type, entity_id);
    
    return ctx.ok(RatingView.formatWithUserScore(result));
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export async function handleTopRatings(ctx: ApiContext) {
  try {
    const v = ctx.validate(topRatingsQuerySchema);
    if (!v.success) return v.error;
    
    const { entity_type, limit, min_votes } = v.data;
    const items = await getTopRated(entity_type, ctx.locale, limit, min_votes);
    
    return ctx.ok(RatingView.formatTopRated(items));
  } catch (err) {
    return serverError(err, ctx.locale);
  }
}

export const handleUserRatings = withAuth(async (ctx: ApiContext, user) => {
  try {
    const v = ctx.validate(userRatingsQuerySchema);
    if (!v.success) return v.error;
    
    const { limit, page } = v.data;
    const result = await getUserRatings(user, ctx.locale, limit, page);
    
    return ctx.ok(RatingView.formatUserRatings(result, ctx.locale, page, limit));
  } catch (err) {
    return serverError(err, ctx.locale);
  }
});