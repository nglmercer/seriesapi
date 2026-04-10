import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { api } from "../../services/api-service";
import { authStore } from "../../services/auth-store";
import i18next from "../../utils/i18n";
import styles from './rating-widget.module.css';

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
    <div class={styles.container}>
      <div class={styles.info}>
        <div class={styles.average}>{avg > 0 ? avg.toFixed(1) : '-'} <span>/ 10</span></div>
        <div class={styles.count}>{cnt} {i18next.t("ratings.votes", { defaultValue: "votes" })}</div>
      </div>

      <div style="width: 1px; height: 30px; background: var(--border-color);"></div>

      <div style="display: flex; flex-direction: column;">
        <div class={styles.label}>{i18next.t("ratings.rate_this", { defaultValue: "Rate this!" })}</div>
        <div class={styles.stars} style={{ opacity: loading ? 0.5 : 1 }}>
          {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
            <span
              class={`${styles.star} ${userRating && n <= userRating ? styles.active : ''}`}
              onClick={() => handleRate(n)}
            >★</span>
          ))}
        </div>
        {!authStore.isLoggedIn && <div class={styles.loginMsg}>{i18next.t("ratings.login_to_rate", { defaultValue: "Login to rate" })}</div>}
      </div>
    </div>
  );
}