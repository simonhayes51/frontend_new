import { useState, useEffect } from "react";
import { Upload, ChevronRight, TrendingUp, Eye, Heart } from "lucide-react";
import { getFeed } from "../../api/social";

export function CommunityUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      const { data } = await getFeed({ limit: 20 });
      const items = Array.isArray(data)
        ? data
        : data?.posts || data?.items || data?.results || [];
      
      // For now, show placeholder images for analysis/tip posts until backend supports image_url
      // Filter for analysis and tip posts (articles and tips)
      const imageUploads = items
        .filter(post => post.post_type === 'analysis' || post.post_type === 'tip')
        .slice(0, 6)
        .map(post => ({
          id: post.id,
          image: post.image_url || `https://picsum.photos/seed/${post.id}/300/300`, // Placeholder until backend supports images
          author: post.author?.username || 'Anonymous',
          likes: post.like_count || 0,
          views: post.view_count || 0,
        }));
      
      setUploads(imageUploads);
    } catch (error) {
      console.error("Failed to load uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted/30 rounded w-40" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted/30 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-secondary" />
          <h2 className="font-semibold text-foreground">Community Uploads</h2>
        </div>
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          See all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {uploads.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
            >
              <img
                src={upload.image}
                alt="Community upload"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-xs text-white font-medium truncate mb-1">
                    @{upload.author}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/80">
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {upload.likes}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {upload.views}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Upload className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No uploads yet</p>
        </div>
      )}
    </div>
  );
}
