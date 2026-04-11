import { ok, serverError } from "../response";
import { getLocaleFromRequest, SUPPORTED_LOCALES } from "../../i18n";
import { getUserFromToken, withAuth } from "./auth";
import { validateParams, ratingCreateSchema, ratingQuerySchema, topRatingsQuerySchema, userRatingsQuerySchema } from "../validation";
import { createOrUpdateRating, getRatingWithUserScore, getTopRated, getUserRatings } from "../controllers/ratings";
import { RatingView } from "../views/rating.view";

export const handleRatingPost = withAuth(async (req: Request, user) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const body = await req.json();
    
    const validation = validateParams(ratingCreateSchema, body, locale);
    if (!validation.success) return validation.error;
    
    const { entity_type, entity_id, score } = validation.data;
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const result = await createOrUpdateRating(user, entity_type, entity_id, score, ip);
    
    return ok(RatingView.formatStats(result), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});

export async function handleRatingGet(req: Request) {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const params = {
      entity_type: url.searchParams.get("entity_type"),
      entity_id: url.searchParams.get("entity_id"),
    };
    
    const validation = validateParams(ratingQuerySchema, params, locale);
    if (!validation.success) return validation.error;
    
    const { entity_type, entity_id } = validation.data;
    const user = getUserFromToken(req);
    const result = await getRatingWithUserScore(user, entity_type, entity_id);
    
    return ok(RatingView.formatWithUserScore(result), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export async function handleTopRatings(req: Request) {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const params = {
      entity_type: url.searchParams.get("entity_type") || "media",
      limit: url.searchParams.get("limit"),
      min_votes: url.searchParams.get("min_votes"),
    };
    
    const validation = validateParams(topRatingsQuerySchema, params, locale);
    if (!validation.success) return validation.error;
    
    const { entity_type, limit, min_votes } = validation.data;
    const items = await getTopRated(entity_type, locale, limit, min_votes);
    
    return ok(RatingView.formatTopRated(items), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
}

export const handleUserRatings = withAuth(async (req: Request, user) => {
  try {
    const locale = getLocaleFromRequest(req, SUPPORTED_LOCALES);
    const url = new URL(req.url);
    const params = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
    };
    
    const validation = validateParams(userRatingsQuerySchema, params, locale);
    if (!validation.success) return validation.error;
    
    const { limit, page } = validation.data;
    const result = await getUserRatings(user, locale, limit, page);
    
    return ok(RatingView.formatUserRatings(result, locale, page, limit), { locale });
  } catch (err) {
    return serverError(err, getLocaleFromRequest(req, SUPPORTED_LOCALES));
  }
});