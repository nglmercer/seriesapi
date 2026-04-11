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
    <div class="flex flex-col sm:flex-row items-center gap-8 p-6 bg-base-300/30 border border-base-content/5 rounded-2xl">
      <div class="flex flex-col items-center gap-1 shrink-0">
        <div class="text-4xl font-black text-primary flex items-baseline gap-1">
          {avg > 0 ? avg.toFixed(1) : '-'} 
          <span class="text-sm font-bold opacity-30">/ 10</span>
        </div>
        <div class="text-[10px] font-black uppercase tracking-widest opacity-40">
          {cnt} {i18next.t("ratings.votes", { defaultValue: "votes" })}
        </div>
      </div>

      <div class="hidden sm:block w-px h-12 bg-base-content/10"></div>

      <div class="flex flex-col items-center sm:items-start gap-3">
        <div class="text-[10px] font-black text-base-content/40 uppercase tracking-widest">
          {i18next.t("ratings.rate_this", { defaultValue: "Rate this!" })}
        </div>
        <div class="flex gap-1 cursor-pointer group" style={{ opacity: loading ? 0.5 : 1 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <span
              key={n}
              class={`text-2xl transition-all duration-200 select-none hover:scale-125 active:scale-95 ${userRating && n <= userRating ? 'text-warning' : 'text-base-content/10 hover:text-warning/50'}`}
              onClick={() => handleRate(n)}
              title={`${n}/10`}
            >★</span>
          ))}
        </div>
        {!authStore.isLoggedIn && (
          <div class="text-[10px] font-bold text-base-content/30 italic">
            {i18next.t("ratings.login_to_rate", { defaultValue: "Login to rate" })}
          </div>
        )}
      </div>
    </div>
  );
}