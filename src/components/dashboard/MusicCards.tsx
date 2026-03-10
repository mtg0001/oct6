import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { GENRES, useMusicPlayer } from "@/contexts/MusicPlayerContext";

export function MusicCards() {
  const { activeGenre, handleToggle, postCommand } = useMusicPlayer();

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
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_2s_infinite] pointer-events-none" />
              )}

              <span className="text-xl relative z-10 drop-shadow-sm">{genre.emoji}</span>
              <span className={`text-sm font-bold whitespace-nowrap relative z-10 ${isPlaying ? 'text-white' : 'text-foreground'}`}>
                {genre.label}
              </span>

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

              {isPlaying && (
                <div className="flex items-center gap-1 ml-0.5 relative z-10">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); postCommand("previousVideo"); }}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/35 transition-colors cursor-pointer"
                  >
                    <SkipBack className="h-3 w-3 text-white" />
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); postCommand("nextVideo"); }}
                    className="h-6 w-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/35 transition-colors cursor-pointer"
                  >
                    <SkipForward className="h-3 w-3 text-white" />
                  </div>
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
    </>
  );
}
