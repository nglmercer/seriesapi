import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import { authStore } from "../../services/auth-store";
import i18next from "../../utils/i18n";

interface RatingWidgetProps {
  entityType?: string;
  entityId?: number;
  average?: number;
  count?: number;
  onNeedLogin?: () => void;
}

export function RatingWidget({ entityType = "", entityId = 0, average = 0, count = 0, onNeedLogin }: RatingWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [avg, setAvg] = useState(average);
  const [cnt, setCnt] = useState(count);

  useEffect(() => {
    fetchRatingData();
  }, [entityId, entityType]);

  async function fetchRatingData() {
    if (!entityType || !entityId) return;
    try {
      const res = await api.getRating(entityType, entityId);
      if (res.ok && res.data) {
        setAvg(res.data.average);
        setCnt(res.data.count);
        setUserRating(res.data.userScore);
      }
    } catch (e) {
      console.error("[rating-widget] fetch error:", e);
    }
  }

  async function handleRate(score: number) {
    if (!authStore.isLoggedIn) {
      if (onNeedLogin) onNeedLogin();
      return;
    }
    if (loading || !entityType || !entityId) return;
    setUserRating(score);
    setLoading(true);

    const res = await api.postRating({
      entity_type: entityType,
      entity_id: entityId,
      score
    });

    if (res.ok && res.data) {
      setAvg(res.data.average);
      setCnt(res.data.count);
    } else {
      alert("Error submitting rating.");
      setUserRating(0);
    }
    setLoading(false);
  }

  return (
    <div class="flex items-center gap-5 p-4 bg-secondary border border-border rounded-[10px]">
      <div class="flex flex-col items-center gap-1">
        <div class="text-2xl font-extrabold text-primary">
          {avg > 0 ? avg.toFixed(1) : '-'} <span class="text-sm font-normal text-secondary">/ 10</span>
        </div>
        <div class="text-xs text-secondary">{cnt} {i18next.t("ratings.votes", { defaultValue: "votes" })}</div>
      </div>

      <div class="w-[1px] h-[30px] bg-border"></div>

      <div class="flex flex-col">
        <div class="text-xs font-bold text-secondary uppercase tracking-[0.5px] mb-[6px]">
          {i18next.t("ratings.rate_this", { defaultValue: "Rate this!" })}
        </div>
        <div class="flex gap-[2px] cursor-pointer" style={{ opacity: loading ? 0.5 : 1 }}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
            <span
              key={n}
              class={`text-xl transition-all duration-150 select-none hover:scale-125 ${userRating && n <= userRating ? 'text-[#f39c12]' : 'text-border'}`}
              onClick={() => handleRate(n)}
            >★</span>
          ))}
        </div>
        {!authStore.isLoggedIn && (
          <div class="mt-[6px] text-[11px] text-secondary">
            {i18next.t("ratings.login_to_rate", { defaultValue: "Login to rate" })}
          </div>
        )}
      </div>
    </div>
  );
}