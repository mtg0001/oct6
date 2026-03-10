import { useState, useRef, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

interface Genre {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  activeGradient: string;
  youtubePlaylistId: string;
}

const GENRES: Genre[] = [
  { id: "rock", label: "Rock", emoji: "🎸", gradient: "from-red-500/10 via-orange-500/5 to-transparent", activeGradient: "from-red-500 via-red-600 to-orange-600", youtubePlaylistId: "PL_bKAgO9uCN37CcZfL6sOgSfOvSyLcncP" },
  { id: "sertanejo", label: "Sertanejo", emoji: "🤠", gradient: "from-amber-500/10 via-yellow-500/5 to-transparent", activeGradient: "from-amber-500 via-amber-600 to-yellow-600", youtubePlaylistId: "PL_Q15fKxrBb6NqOc7utqCdIsfI9zqgzQ_" },
  { id: "hiphop", label: "Hip Hop", emoji: "🎤", gradient: "from-violet-500/10 via-purple-500/5 to-transparent", activeGradient: "from-violet-500 via-purple-600 to-indigo-600", youtubePlaylistId: "PLOhV0FrFphUdkuWPE2bzJEsGxXMRKVkoM" },
  { id: "eletronica", label: "Eletrônica", emoji: "🎧", gradient: "from-cyan-500/10 via-teal-500/5 to-transparent", activeGradient: "from-cyan-500 via-teal-500 to-emerald-500", youtubePlaylistId: "PL7wr9BYcCCyNb0IhqqebdLEMkklMSOttA" },
  { id: "pop", label: "Pop", emoji: "🎵", gradient: "from-pink-500/10 via-rose-500/5 to-transparent", activeGradient: "from-pink-500 via-rose-500 to-fuchsia-500", youtubePlaylistId: "x-JC7sJJUW8" },
  { id: "pagode", label: "Pagode", emoji: "🥁", gradient: "from-emerald-500/10 via-green-500/5 to-transparent", activeGradient: "from-emerald-500 via-green-600 to-lime-600", youtubePlaylistId: "PL_Q15fKxrBb5pckIW2RHwZbgf-FwRiCWr" },
];

export function MusicCards() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleToggle = useCallback((genreId: string) => {
    setActiveGenre(prev => prev === genreId ? null : genreId);
  }, []);

  const postCommand = useCallback((func: string) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    }
  }, []);

  const activePlaylist = GENRES.find(g => g.id === activeGenre);

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map((genre) => {
          const isPlaying = activeGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => handleToggle(genre.id)}
              className={`
                group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border transition-all duration-500 shrink-0 overflow-hidden
                ${isPlaying
                  ? `bg-gradient-to-r ${genre.activeGradient} text-white border-transparent shadow-lg shadow-black/10 scale-[1.03]`
                  : `bg-gradient-to-r ${genre.gradient} border-border/60 hover:border-border hover:shadow-md hover:scale-[1.02] backdrop-blur-sm`
                }
              `}
            >
              {/* Shimmer effect on active */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_2s_infinite] pointer-events-none" />
              )}

              <span className="text-xl relative z-10 drop-shadow-sm">{genre.emoji}</span>
              <span className={`text-sm font-bold whitespace-nowrap relative z-10 ${isPlaying ? 'text-white' : 'text-foreground'}`}>
                {genre.label}
              </span>

              {/* Play/Pause button */}
              <div className={`relative z-10 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                isPlaying
                  ? "bg-white/25 backdrop-blur-sm"
                  : "bg-foreground/5 group-hover:bg-foreground/10"
              }`}>
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>

              {/* Skip & Audio bars */}
              {isPlaying && (
                <div className="flex items-center gap-1 ml-0.5 relative z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); postCommand("previousVideo"); }}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/35 transition-colors"
                  >
                    <SkipBack className="h-3 w-3 text-white" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); postCommand("nextVideo"); }}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/35 transition-colors"
                  >
                    <SkipForward className="h-3 w-3 text-white" />
                  </button>
                  <div className="flex items-end gap-[3px] ml-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="w-[3px] bg-white/80 rounded-full"
                        style={{
                          animation: `musicBar ${0.4 + i * 0.15}s ease-in-out infinite alternate`,
                          height: `${6 + i * 3}px`,
                          animationDelay: `${i * 100}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes musicBar {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1.2); }
        }
      `}</style>

      {/* Hidden YouTube iframe for audio */}
      {activePlaylist && (
        <iframe
          ref={iframeRef}
          key={activePlaylist.id}
          src={
            activePlaylist.id === "pop"
              ? `https://www.youtube.com/embed/${activePlaylist.youtubePlaylistId}?autoplay=1&loop=1`
              : `https://www.youtube.com/embed/videoseries?list=${activePlaylist.youtubePlaylistId}&autoplay=1&loop=1&shuffle=1`
          }
          allow="autoplay"
          className="absolute w-0 h-0 opacity-0 pointer-events-none"
          title="Music Player"
        />
      )}
    </>
  );
}
