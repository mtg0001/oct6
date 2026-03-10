import { useState, useRef, useCallback } from "react";
import { Play, Pause, Music2 } from "lucide-react";

interface Genre {
  id: string;
  label: string;
  emoji: string;
  color: string;
  youtubePlaylistId: string;
}

const GENRES: Genre[] = [
  { id: "rock", label: "Rock", emoji: "🎸", color: "from-destructive/20 to-destructive/5", youtubePlaylistId: "PLGBuKfnErZlCkROfsvkNGiPtmWpSBcaBA" },
  { id: "sertanejo", label: "Sertanejo", emoji: "🤠", color: "from-accent/20 to-accent/5", youtubePlaylistId: "PL_Q15fKxrBb6NqOc7utqCdIsfI9zqgzQ_" },
  { id: "hiphop", label: "Hip Hop", emoji: "🎤", color: "from-primary/20 to-primary/5", youtubePlaylistId: "PLFPg_IUIskhdr1dkJCH_l6I1SNT7wYzEr" },
  { id: "eletronica", label: "Eletrônica", emoji: "🎧", color: "from-success/20 to-success/5", youtubePlaylistId: "UYOb37KRFqk" },
  { id: "pop", label: "Pop", emoji: "🎵", color: "from-warning/20 to-warning/5", youtubePlaylistId: "x-JC7sJJUW8" },
];

export function MusicCards() {
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleToggle = useCallback((genreId: string, playlistId: string) => {
    if (activeGenre === genreId) {
      setActiveGenre(null);
    } else {
      setActiveGenre(genreId);
    }
  }, [activeGenre]);

  const activePlaylist = GENRES.find(g => g.id === activeGenre);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {GENRES.map((genre) => {
          const isPlaying = activeGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => handleToggle(genre.id, genre.youtubePlaylistId)}
              className={`
                relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 shrink-0
                ${isPlaying
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                  : "bg-card text-foreground border-border hover:border-primary/40 hover:shadow-sm"
                }
              `}
            >
              <span className="text-lg">{genre.emoji}</span>
              <span className="text-xs font-bold whitespace-nowrap">{genre.label}</span>
              <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                isPlaying ? "bg-primary-foreground/20" : "bg-primary/10"
              }`}>
                {isPlaying ? (
                  <Pause className={`h-3 w-3 ${isPlaying ? "text-primary-foreground" : "text-primary"}`} />
                ) : (
                  <Play className={`h-3 w-3 ${isPlaying ? "text-primary-foreground" : "text-primary"}`} />
                )}
              </div>
              {isPlaying && (
                <div className="flex items-end gap-[2px] ml-1">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-[3px] bg-primary-foreground/70 rounded-full animate-pulse"
                      style={{
                        height: `${8 + i * 3}px`,
                        animationDelay: `${i * 150}ms`,
                        animationDuration: '0.6s',
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Hidden YouTube iframe for audio */}
      {activePlaylist && (
        <iframe
          ref={iframeRef}
          key={activePlaylist.id}
          src={
            activePlaylist.id === "eletronica" || activePlaylist.id === "pop"
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
