import { extractYouTubeId } from "@/lib/youtube";
import type { AILessonVideo } from "@/data/aiCourses";

export default function LessonVideoBlock({ videos }: { videos: AILessonVideo[] }) {
  return (
    <div className="space-y-6">
      {videos.map((video) => {
        const videoId = extractYouTubeId(video.url);
        if (!videoId) return null;
        return (
          <div key={video.url}>
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title={video.title}
                allow="accelerate-content; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <p className="mt-2 text-xs text-white/40">{video.title}</p>
          </div>
        );
      })}
    </div>
  );
}
