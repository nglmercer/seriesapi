import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { mediaService } from "./services/media-service";
import { eventBus } from "./utils/events";
import i18next from "./utils/i18n";
import { AuthModal } from "./components/shared/AuthModal";
import { PublicHeader } from "./components/layout/public-header";
import { MobileMenu } from "./components/layout/mobile-menu";
import { MediaDetail } from "./components/media/media-detail";
import { MediaEpisodes } from "./components/media/media-episodes";
import { MediaList } from "./components/media/media-list";
import { MediaFilters } from "./components/media/media-filters";
import { UserProfile } from "./components/shared/user-profile";
import { SearchBox } from "./components/shared/search-box";

export function App() {
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [currentSeasons, setCurrentSeasons] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { authStore } = await import("./services/auth-store");
        setUser(authStore.user);
        return authStore.subscribe(u => setUser(u));
      } catch (error) {
        console.error("[App] auth-store import failed:", error);
      }
    };

    let unsubAuth: (() => void) | undefined;
    setupAuth().then(unsub => { unsubAuth = unsub; });

    const listeners = [
      eventBus.on("media-select", (data) => {
        setSelectedMediaId(data.id);
        setSelectedSeasonId(null);
        setCurrentMedia(null);
        setCurrentSeasons([]);
        setShowProfile(false);
      }),
      eventBus.on("search-result", (data) => {
        if (data.entity_type === "media") {
          setSelectedMediaId(data.id || null);
          setSelectedSeasonId(null);
          setCurrentMedia(null);
          setCurrentSeasons([]);
          setShowProfile(false);
        }
      }),
      eventBus.on("season-select", (data) => {
        setSelectedSeasonId(data.seasonId);
      }),
      eventBus.on("back", () => {
        if (selectedSeasonId) {
          setSelectedSeasonId(null);
        } else {
          setSelectedMediaId(null);
          setCurrentMedia(null);
          setCurrentSeasons([]);
        }
      }),
      eventBus.on("auth-close", () => {
        setShowAuthModal(false);
      }),
      eventBus.on("media-list", (data) => {
        setMediaList(data);
        setSelectedMediaId(null);
        setSelectedSeasonId(null);
        setCurrentMedia(null);
        setCurrentSeasons([]);
        setShowProfile(false);
      })
    ];

    return () => {
      listeners.forEach(unsub => unsub());
      if (unsubAuth) unsubAuth();
    };
  }, [selectedSeasonId]);

  useEffect(() => {
    if (selectedMediaId && !mediaLoading) {
      const loadMediaData = async () => {
        setMediaLoading(true);
        try {
          const [mediaData, seasonsData] = await Promise.all([
            mediaService.fetchMediaDetail(selectedMediaId),
            mediaService.fetchMediaSeasons(selectedMediaId)
          ]);
          setCurrentMedia(mediaData);
          setCurrentSeasons(seasonsData);
        } catch (error) {
          console.error("[App] load media error:", error);
        } finally {
          setMediaLoading(false);
        }
      };
      loadMediaData();
    }
  }, [selectedMediaId]);

  const handleHomeClick = () => {
    setSelectedMediaId(null);
    setSelectedSeasonId(null);
    setCurrentMedia(null);
    setCurrentSeasons([]);
    setShowProfile(false);
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setSelectedMediaId(null);
    setSelectedSeasonId(null);
    setCurrentMedia(null);
    setCurrentSeasons([]);
  };

  const doLogout = async () => {
    try {
      const { authStore } = await import("./services/auth-store");
      await authStore.logout();
      setUser(null);
    } catch (error) {
      console.error("[App] logout failed:", error);
    }
  };

  const renderContent = () => {
    if (showProfile) {
      return (
        <div className="container" style={{ padding: '40px 0' }}>
          <UserProfile />
        </div>
      );
    }

    if (selectedSeasonId) {
      return (
        <div className="container" style={{ padding: '40px 0' }}>
          <MediaEpisodes mediaId={selectedMediaId} seasonId={selectedSeasonId} />
        </div>
      );
    }

    if (selectedMediaId) {
      if (mediaLoading) {
        return (
          <div className="container loading">
            <div className="loading-spinner"></div>
            <span>{i18next.t("media.loading", "Loading...")}</span>
          </div>
        );
      }
      return (
        <div className="container" style={{ padding: '40px 0' }}>
          <MediaDetail
            mediaId={selectedMediaId}
            media={currentMedia}
            allSeasons={currentSeasons}
          />
        </div>
      );
    }

    return (
      <Fragment>
        <section className="hero">
          <div className="container hero-content">
            <h1>{i18next.t("hero.title", "Track Your Series & Movies")}</h1>
            <p>{i18next.t("hero.subtitle", "Your personal dashboard to keep up with everything you're watching.")}</p>
            <SearchBox />
          </div>
        </section>

        <main className="container">
          <div className="section-header">
            <div>
              <h2>{i18next.t("media.latest", "Latest Media")}</h2>
              <p className="section-subtitle">{i18next.t("media.latest_subtitle", "Discover something new to watch today.")}</p>
            </div>
            <MediaFilters />
          </div>

          <div className="media-grid">
            <MediaList mediaList={mediaList} />
          </div>
        </main>
      </Fragment>
    );
  };

  return (
    <div className="app-root">
      {showAuthModal && <AuthModal onAuthClose={() => setShowAuthModal(false)} />}

      <PublicHeader
        user={user}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
        onHomeClick={handleHomeClick}
        onProfileClick={handleProfileClick}
        onNeedLogin={() => setShowAuthModal(true)}
        onLogout={doLogout}
      />

      <MobileMenu
        open={isMenuOpen}
        user={user}
        onClose={() => setIsMenuOpen(false)}
        onHomeClick={handleHomeClick}
        onProfileClick={handleProfileClick}
        onNeedLogin={() => setShowAuthModal(true)}
        onLogout={doLogout}
      />

      {renderContent()}
    </div>
  );
}