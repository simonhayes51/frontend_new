import { useState } from "react";
import { X, Type, Image, Bold, Italic, List } from "lucide-react";
import { GradientButton } from "../ui/GradientButton";
import toast from "react-hot-toast";

export function ArticleEditorModal({ isOpen, onClose, onSubmit }) {
  const [articleData, setArticleData] = useState({
    title: "",
    content: "",
    thumbnail: null,
    tags: "",
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setArticleData({ ...articleData, thumbnail: reader.result });
        toast.success("Thumbnail attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!articleData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!articleData.content.trim()) {
      toast.error("Please enter article content");
      return;
    }

    try {
      await onSubmit({
        post_type: "analysis",
        content: `${articleData.title}\n\n${articleData.content}`,
        tags: articleData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      
      toast.success("Article published!");
      setArticleData({
        title: "",
        content: "",
        thumbnail: null,
        tags: "",
      });
      onClose();
    } catch (error) {
      console.error("Failed to publish article:", error);
      toast.error("Failed to publish article");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Write Article</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Article Title
            </label>
            <input
              type="text"
              placeholder="Enter a catchy title..."
              value={articleData.title}
              onChange={(e) => setArticleData({ ...articleData, title: e.target.value })}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Thumbnail Image (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/70 text-foreground rounded-lg cursor-pointer transition-colors">
                <Image className="w-4 h-4" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              {articleData.thumbnail && (
                <div className="relative">
                  <img
                    src={articleData.thumbnail}
                    alt="Thumbnail preview"
                    className="h-16 w-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setArticleData({ ...articleData, thumbnail: null })}
                    className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-border">
            <button className="p-2 hover:bg-muted rounded transition-colors" title="Bold">
              <Bold className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded transition-colors" title="Italic">
              <Italic className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded transition-colors" title="List">
              <List className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {articleData.content.length} characters
            </span>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Article Content
            </label>
            <textarea
              placeholder="Write your trading insights, market analysis, or tips here..."
              value={articleData.content}
              onChange={(e) => setArticleData({ ...articleData, content: e.target.value })}
              rows={12}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-sans"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. FIFA 24, Trading Tips, Market Analysis"
              value={articleData.tags}
              onChange={(e) => setArticleData({ ...articleData, tags: e.target.value })}
              className="w-full bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <GradientButton onClick={handleSubmit}>
            Publish Article
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
