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
  const [filters, setFilters] = useState<Record<string, string>>({});
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
      eventBus.on("search", (data) => {
        setFilters(prev => ({ ...prev, q: data.query }));
        setSelectedMediaId(null);
        setSelectedSeasonId(null);
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
    setFilters({});
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
        <section class="bg-base-200 py-24 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
          <div class="container mx-auto px-5 max-w-4xl relative z-10">
            <h1 class="text-5xl md:text-6xl font-black mb-6 tracking-tight text-base-content">
              {i18next.t("hero.title", "Track Your Series & Movies")}
            </h1>
            <p class="text-xl text-base-content/60 mb-12 max-w-2xl mx-auto leading-relaxed">
              {i18next.t("hero.subtitle", "Your personal dashboard to keep up with everything you're watching.")}
            </p>
            <SearchBox />
          </div>
        </section>

        <main class="container mx-auto px-5 py-16">
          <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 class="text-3xl font-black text-base-content tracking-tight">{i18next.t("media.latest", "Latest Media")}</h2>
              <p class="text-base-content/50 mt-2 font-medium">{i18next.t("media.latest_subtitle", "Discover something new to watch today.")}</p>
            </div>
          </div>
          
          <MediaFilters 
            state={filters} 
            onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))} 
          />

          <MediaList filters={filters} />
        </main>
      </Fragment>
    );
  };

  return (
    <div class="min-h-screen text-base-content transition-colors duration-300">
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