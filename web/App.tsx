import { h, Fragment } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { mediaService } from "./services/media-service";
import { eventBus } from "./utils/events";
import i18next from "./utils/i18n";
import { useAuth } from "./contexts/auth-context";
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
  const { user, logout, isLoading: authLoading } = useAuth();
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<any>(null);
  const [currentSeasons, setCurrentSeasons] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
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
      await logout();
    } catch (error) {
      console.error("[App] logout failed:", error);
    }
  };

  const renderContent = () => {
    if (showProfile) {
      return (
        <div class="container mx-auto px-5 py-10">
          <UserProfile />
        </div>
      );
    }

    if (selectedSeasonId) {
      return (
        <div class="container mx-auto px-5 py-10">
          <MediaEpisodes mediaId={selectedMediaId} seasonId={selectedSeasonId} />
        </div>
      );
    }

    if (selectedMediaId) {
      if (mediaLoading) {
        return (
          <div class="container mx-auto px-5 py-20 flex flex-col items-center justify-center">
            <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
            <span class="text-secondary">{i18next.t("media.loading", "Loading...")}</span>
          </div>
        );
      }
      return (
        <div class="container mx-auto px-5 py-10">
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
        <section class="bg-secondary py-16 text-center">
          <div class="container mx-auto px-5 max-w-4xl">
            <h1 class="text-4xl font-bold mb-4">{i18next.t("hero.title", "Track Your Series & Movies")}</h1>
            <p class="text-xl text-secondary mb-8">{i18next.t("hero.subtitle", "Your personal dashboard to keep up with everything you're watching.")}</p>
            <SearchBox />
          </div>
        </section>

        <main class="container mx-auto px-5 py-10">
          <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 class="text-2xl font-bold">{i18next.t("media.latest", "Latest Media")}</h2>
              <p class="text-secondary mt-1">{i18next.t("media.latest_subtitle", "Discover something new to watch today.")}</p>
            </div>
            <MediaFilters />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <MediaList mediaList={mediaList} />
          </div>
        </main>
      </Fragment>
    );
  };

  return (
    <div class="min-h-screen bg-primary text-primary transition-colors duration-300">
      {authLoading ? (
        <div class="flex items-center justify-center h-screen" key="loading">
          <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div class="flex flex-col min-h-screen" key="main">
          {showAuthModal && (
            <AuthModal onAuthClose={() => setShowAuthModal(false)} />
          )}

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

          <div class="flex-1">
            {renderContent()}
          </div>
        </div>
      )}
    </div>
  );
}