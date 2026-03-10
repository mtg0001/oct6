import { createContext, useContext, useState, useRef, useCallback, useEffect, type ReactNode } from "react";

interface Genre {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  activeGradient: string;
  youtubePlaylistId: string;
  isVideo?: boolean;
}

export const GENRES: Genre[] = [
  { id: "rock", label: "Rock", emoji: "🎸", gradient: "from-red-500/10 via-orange-500/5 to-transparent", activeGradient: "from-red-500 via-red-600 to-orange-600", youtubePlaylistId: "PL_bKAgO9uCN37CcZfL6sOgSfOvSyLcncP" },
  { id: "sertanejo", label: "Sertanejo", emoji: "🤠", gradient: "from-amber-500/10 via-yellow-500/5 to-transparent", activeGradient: "from-amber-500 via-amber-600 to-yellow-600", youtubePlaylistId: "PL_Q15fKxrBb6NqOc7utqCdIsfI9zqgzQ_" },
  { id: "hiphop", label: "Hip Hop", emoji: "🎤", gradient: "from-violet-500/10 via-purple-500/5 to-transparent", activeGradient: "from-violet-500 via-purple-600 to-indigo-600", youtubePlaylistId: "PLOhV0FrFphUdkuWPE2bzJEsGxXMRKVkoM" },
  { id: "eletronica", label: "Eletrônica", emoji: "🎧", gradient: "from-cyan-500/10 via-teal-500/5 to-transparent", activeGradient: "from-cyan-500 via-teal-500 to-emerald-500", youtubePlaylistId: "PL7wr9BYcCCyNb0IhqqebdLEMkklMSOttA" },
  { id: "pop", label: "Pop", emoji: "🎵", gradient: "from-pink-500/10 via-rose-500/5 to-transparent", activeGradient: "from-pink-500 via-rose-500 to-fuchsia-500", youtubePlaylistId: "x-JC7sJJUW8", isVideo: true },
  { id: "pagode", label: "Pagode", emoji: "🥁", gradient: "from-emerald-500/10 via-green-500/5 to-transparent", activeGradient: "from-emerald-500 via-green-600 to-lime-600", youtubePlaylistId: "PL_Q15fKxrBb5pckIW2RHwZbgf-FwRiCWr" },
];

interface MusicPlayerContextType {
  activeGenre: string | null;
  handleToggle: (genreId: string) => void;
  postCommand: (func: string) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerReady = useRef(false);
  const pendingGenre = useRef<string | null>(null);

  const postCommand = useCallback((func: string, args?: unknown[]) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args: args ?? [] }),
        "*"
      );
    }
  }, []);

  const loadGenre = useCallback((genreId: string) => {
    const genre = GENRES.find(g => g.id === genreId);
    if (!genre) return;

    if (genre.isVideo) {
      postCommand("loadVideoById", [{ videoId: genre.youtubePlaylistId }]);
    } else {
      postCommand("loadPlaylist", [{ list: genre.youtubePlaylistId, listType: "playlist" }]);
    }
    postCommand("setShuffle", [true]);
  }, [postCommand]);

  // Listen for player ready event
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "onReady" || data?.info === "onReady" || data?.event === "initialDelivery") {
          playerReady.current = true;
          if (pendingGenre.current) {
            loadGenre(pendingGenre.current);
            pendingGenre.current = null;
          }
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [loadGenre]);

  const handleToggle = useCallback((genreId: string) => {
    setActiveGenre(prev => {
      if (prev === genreId) {
        // Pause
        postCommand("pauseVideo");
        return null;
      }
      // If iframe already exists and player is ready, just load new playlist
      if (prev !== null && playerReady.current) {
        loadGenre(genreId);
      } else if (prev !== null) {
        // iframe exists but not ready yet, queue it
        pendingGenre.current = genreId;
      }
      // If prev is null, iframe will be created and autoplay handles it
      return genreId;
    });
  }, [postCommand, loadGenre]);

  const activePlaylist = GENRES.find(g => g.id === activeGenre);

  // Build initial URL for the first genre selected
  const getInitialSrc = () => {
    if (!activePlaylist) return "";
    if (activePlaylist.isVideo) {
      return `https://www.youtube.com/embed/${activePlaylist.youtubePlaylistId}?autoplay=1&loop=1&enablejsapi=1&playsinline=1&origin=${window.location.origin}`;
    }
    return `https://www.youtube.com/embed/videoseries?list=${activePlaylist.youtubePlaylistId}&autoplay=1&loop=1&shuffle=1&enablejsapi=1&playsinline=1&origin=${window.location.origin}`;
  };

  return (
    <MusicPlayerContext.Provider value={{ activeGenre, handleToggle, postCommand }}>
      {children}
      {activeGenre && (
        <iframe
          ref={iframeRef}
          src={getInitialSrc()}
          allow="autoplay; encrypted-media"
          className="w-full h-[1px] opacity-[0.01] pointer-events-none overflow-hidden"
          style={{ position: 'fixed', bottom: 0, left: 0, zIndex: -1 }}
          title="Music Player"
        />
      )}
    </MusicPlayerContext.Provider>
  );
}
