import { useState, useEffect, useMemo } from "react";
import {
  Image as ImageIcon,
  Loader,
  Download,
  Share2,
  Trash2,
  Sparkles,
  Copy,
  Check,
  Zap,
  Palette,
  Maximize2,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import logger from "../utils/logger";
import { authService } from "../services/auth";

/**
 * AI Image Generator Page
 * Professional UI with advanced options and features
 */
const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeTab, setActiveTab] = useState("current"); // "current" or "history"
  const [usageData, setUsageData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [options, setOptions] = useState(null);
  const { user } = useAuthStore();

  // Aspect ratio to size mapping (backend supports specific sizes)
  const aspectRatioToSize = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
  };

  // Default styles (will be loaded from backend)
  const defaultStyles = [
    { value: "realistic", label: "Realistic", icon: "🎨" },
    { value: "artistic", label: "Artistic", icon: "🖼️" },
    { value: "anime", label: "Anime", icon: "🎭" },
    { value: "3d-render", label: "3D Render", icon: "🎪" },
    { value: "oil-painting", label: "Oil Painting", icon: "🖌️" },
    { value: "watercolor", label: "Watercolor", icon: "💧" },
    { value: "vivid", label: "Vivid", icon: "✨" },
    { value: "natural", label: "Natural", icon: "🌿" },
  ];

  // Aspect ratios
  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)", size: "1024x1024" },
    { value: "16:9", label: "Landscape (16:9)", size: "1792x1024" },
    { value: "9:16", label: "Portrait (9:16)", size: "1024x1792" },
  ];

  const styles = options?.styles
    ? options.styles.map((s) => {
        const defaultStyle = defaultStyles.find((ds) => ds.value === s);
        return {
          value: s,
          label: defaultStyle?.label || s,
          icon: defaultStyle?.icon || "🎨",
        };
      })
    : defaultStyles;

  // Load usage data and options on mount
  useEffect(() => {
    loadUsageData();
    loadOptions();
    loadHistory();
  }, []);

  const loadUsageData = async () => {
    try {
      const data = await authService.getDetailedUsage();
      setUsageData(data);
    } catch (error) {
      logger.error("Failed to load usage data:", error);
    }
  };

  const loadOptions = async () => {
    try {
      const data = await aiServices.getImageOptions();
      setOptions(data);
      // Set default style from backend options if available
      if (data?.styles?.length > 0 && !data.styles.includes(style)) {
        setStyle(data.styles[0]);
      }
    } catch (error) {
      logger.error("Failed to load image options:", error);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await aiServices.getImageHistory(20, 1);
      if (data?.history) {
        // Transform backend history format to frontend format
        // Backend now provides fullUrl in response.data, so we use it directly
        const transformedHistory = data.history.map((item) => {
          const responseData = item.response?.data || {};

          // Backend provides fullUrl - use it directly, with fallback to dalleImageUrl or imageUrl
          const displayUrl =
            responseData.fullUrl ||
            responseData.dalleImageUrl ||
            responseData.imageUrl;

          return {
            id:
              item._id ||
              item.id ||
              `history-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            url: displayUrl, // Primary display URL (backend provides fullUrl)
            imageUrl: responseData.imageUrl, // Relative path (for reference)
            fullUrl: responseData.fullUrl, // Full URL with host and port (from backend)
            dalleImageUrl: responseData.dalleImageUrl, // Original provider URL (fallback)
            prompt: item.request?.prompt,
            revisedPrompt: responseData.revisedPrompt,
            originalPrompt: item.request?.prompt, // Keep original prompt
            style: responseData.style || item.request?.parameters?.style,
            size: responseData.size || item.request?.parameters?.size,
            quality: responseData.quality || item.request?.parameters?.quality,
            isStored: responseData.isStored || false,
            storageInfo: responseData.storageInfo, // Include storage info if available
            createdAt: item.createdAt || item.request?.timestamp,
          };
        });
        setImageHistory(transformedHistory);
        // Also set as generated images if empty (only on initial load)
        setGeneratedImages((prev) => {
          if (prev.length === 0) {
            return transformedHistory.slice(0, 10);
          }
          return prev;
        });
      }
    } catch (error) {
      logger.error("Failed to load image history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt to generate an image");
      return;
    }

    // Check usage limits
    const currentUsage = usageData?.usage?.aiImageGenerator?.imagesUsed || 0;
    const limit = usageData?.usage?.aiImageGenerator?.imagesLimit || 3;

    if (currentUsage >= limit) {
      toast.error(
        `Daily limit reached! You've used ${currentUsage}/${limit} images. Please upgrade your plan.`
      );
      return;
    }

    try {
      setLoading(true);

      // Map aspect ratio to size (backend uses size, not aspectRatio)
      const mappedSize = aspectRatioToSize[aspectRatio] || size;

      const response = await aiServices.generateImage({
        prompt,
        style,
        size: mappedSize,
        quality,
      });

      // Extract data from API response (could be nested in data.data or just data)
      const imageData = response.data || response;

      // Backend provides fullUrl - use it directly, with fallback to dalleImageUrl or imageUrl
      const displayUrl =
        imageData.fullUrl ||
        imageData.dalleImageUrl ||
        imageData.imageUrl ||
        imageData.url;

      const newImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
        url: displayUrl, // Primary display URL (backend provides fullUrl)
        imageUrl: imageData.imageUrl, // Relative path (for reference)
        fullUrl: imageData.fullUrl, // Full URL with host and port (from backend)
        dalleImageUrl: imageData.dalleImageUrl, // Original provider URL (fallback)
        prompt: imageData.originalPrompt || prompt,
        revisedPrompt: imageData.revisedPrompt,
        style: imageData.style || style,
        size: imageData.size || mappedSize,
        quality: imageData.quality || quality,
        isStored: imageData.isStored || false,
        storageInfo: imageData.storageInfo, // Include storage info if available
        duration: imageData.duration,
        cost: imageData.cost,
        usage: imageData.usage, // Contains imagesUsedToday, maxImages, remainingImages
        createdAt: new Date().toISOString(),
      };

      setGeneratedImages([newImage, ...generatedImages]);
      toast.success("Image generated successfully! 🎨");

      // Clear prompts
      setPrompt("");

      // Update usage data from response if available (faster than reloading)
      if (imageData.usage) {
        setUsageData((prev) => ({
          ...prev,
          usage: {
            ...prev?.usage,
            aiImageGenerator: {
              imagesUsed: imageData.usage.imagesUsedToday,
              imagesLimit: imageData.usage.maxImages,
              remainingImages: imageData.usage.remainingImages,
            },
          },
        }));
      }

      // Reload usage data and history to ensure sync
      await loadUsageData();
      await loadHistory();
    } catch (error) {
      logger.error("Image generation error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate image";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (imageUrl, index) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-generated-image-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      logger.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  const handleShare = async (imageUrl) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "AI Generated Image",
          text: "Check out this AI-generated image!",
          url: imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(imageUrl);
        toast.success("Image URL copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        logger.error("Share error:", error);
        toast.error("Failed to share image");
      }
    }
  };

  const handleDelete = (id) => {
    setGeneratedImages(generatedImages.filter((img) => img.id !== id));
    toast.success("Image removed");
  };

  const handleCopyPrompt = (promptText, index) => {
    navigator.clipboard.writeText(promptText);
    setCopiedIndex(index);
    toast.success("Prompt copied!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Calculate usage percentage
  const usagePercentage = useMemo(() => {
    if (!usageData?.usage?.aiImageGenerator) return 0;
    const { imagesUsed = 0, imagesLimit = 3 } =
      usageData.usage.aiImageGenerator;
    return imagesLimit > 0 ? Math.round((imagesUsed / imagesLimit) * 100) : 0;
  }, [usageData]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">AI Image Generator</h1>
            <p className="text-gray-600 mt-1">
              Create stunning images from text descriptions
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        {usageData?.usage?.aiImageGenerator && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Daily Usage: {usageData.usage.aiImageGenerator.imagesUsed || 0}{" "}
                / {usageData.usage.aiImageGenerator.imagesLimit || 3} images
              </span>
              <span className="text-sm font-semibold text-purple-600">
                {usagePercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercentage >= 90
                    ? "bg-red-500"
                    : usagePercentage >= 70
                    ? "bg-yellow-500"
                    : "bg-purple-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage >= 90 && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                You're running low on daily images. Consider upgrading your
                plan.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Generation Form */}
      <div className="card mb-8 shadow-lg border border-purple-100">
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-6 h-6 text-purple-600" />
            Generate New Image
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Create stunning AI-generated images with advanced customization
            options
          </p>
        </div>
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <Palette className="w-4 h-4" />
              Describe Your Image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full px-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all bg-white hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
              placeholder="A futuristic cityscape at sunset with neon lights reflecting on wet streets, cyberpunk style, highly detailed, 4k..."
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Be as detailed as possible for better results
            </p>
          </div>

          {/* Advanced Options Section */}
          <div className="space-y-6">
            {/* Style Selection - Full Width */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <Palette className="w-4 h-4 text-purple-600" />
                Style
              </label>
              <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-3">
                {styles.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStyle(s.value)}
                    disabled={loading}
                    className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                      style === s.value
                        ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 text-purple-700 shadow-md"
                        : "border-gray-200 hover:border-purple-300 bg-white hover:bg-gray-50"
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  >
                    <span className="text-3xl mb-2 block">{s.icon}</span>
                    <span className="text-xs font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size and Quality - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Size/Aspect Ratio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Zap className="w-4 h-4 text-purple-600" />
                  Size / Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => {
                    setAspectRatio(e.target.value);
                    const selectedRatio = aspectRatios.find(
                      (r) => r.value === e.target.value
                    );
                    if (selectedRatio) {
                      setSize(selectedRatio.size);
                    }
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aspectRatios.map((ratio) => (
                    <option key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  Choose image dimensions
                </p>
              </div>

              {/* Quality */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-white hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="standard">Standard Quality</option>
                  <option value="hd">HD (Higher Quality)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1.5">
                  {quality === "hd"
                    ? "Higher resolution, longer generation time"
                    : "Faster generation, good quality"}
                </p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading || !prompt.trim() || usagePercentage >= 100}
              className="w-full bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transform duration-200"
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Generating Image...</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  <span className="text-lg">Generate Image</span>
                </>
              )}
            </button>
            {usagePercentage >= 100 && (
              <p className="text-center text-sm text-red-600 mt-3 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Daily limit reached. Please upgrade your plan.
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Images Gallery with Tabs */}
      <div className="card shadow-lg border border-purple-100">
        {/* Tabs Header */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-purple-600" />
              Your Images
            </h2>
            <div className="flex items-center gap-3">
              {activeTab === "history" && (
                <button
                  onClick={loadHistory}
                  disabled={loadingHistory}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      loadingHistory ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </button>
              )}
              {activeTab === "current" && generatedImages.length > 0 && (
                <button
                  onClick={() => setGeneratedImages([])}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Session
                </button>
              )}
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("current")}
              className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-all relative ${
                activeTab === "current"
                  ? "text-purple-600 bg-white border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Current Session
              {generatedImages.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {generatedImages.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                if (imageHistory.length === 0) {
                  loadHistory();
                }
              }}
              className={`px-6 py-3 font-semibold text-sm rounded-t-lg transition-all relative ${
                activeTab === "history"
                  ? "text-purple-600 bg-white border-b-2 border-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              All History
              {imageHistory.length > 0 && (
                <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {imageHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}

        {/* Current Session Tab */}
        {activeTab === "current" && (
          <>
            {generatedImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((image, index) => (
                  <div
                    key={image.id}
                    className="card group hover:shadow-xl transition-all overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={image.url}
                        alt={`Generated ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setSelectedImage(image)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="View full size"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(image.url, index)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="Download image"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleShare(image.url)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="Share image"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(image.id)}
                          className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                          aria-label="Delete image"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Prompt
                          </span>
                          <button
                            onClick={() =>
                              handleCopyPrompt(image.prompt, index)
                            }
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {image.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {styles.find((s) => s.value === image.style)?.label ||
                            image.style}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {image.size || "1024x1024"}
                        </span>
                        {image.quality && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full uppercase">
                            {image.quality}
                          </span>
                        )}
                      </div>
                      {image.revisedPrompt &&
                        image.revisedPrompt !== image.prompt && (
                          <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-gray-600">
                            <span className="font-semibold">
                              Revised Prompt:{" "}
                            </span>
                            {image.revisedPrompt}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Images in This Session
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Generate images using the form above, or check your{" "}
                  <button
                    onClick={() => setActiveTab("history")}
                    className="text-purple-600 hover:text-purple-700 underline font-medium"
                  >
                    complete history
                  </button>{" "}
                  to see all previously generated images.
                </p>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <>
            {loadingHistory ? (
              <div className="text-center py-16">
                <Loader className="w-10 h-10 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your image history...</p>
              </div>
            ) : imageHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {imageHistory.map((image, index) => (
                  <div
                    key={image.id || index}
                    className="card group hover:shadow-xl transition-all overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={image.url}
                        alt={`History ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => setSelectedImage(image)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="View full size"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDownload(image.url, index)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="Download image"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleShare(image.url)}
                          className="bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          aria-label="Share image"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Info */}
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            Prompt
                          </span>
                          <button
                            onClick={() =>
                              handleCopyPrompt(image.prompt, `history-${index}`)
                            }
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            {copiedIndex === `history-${index}` ? (
                              <>
                                <Check className="w-3 h-3" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {image.prompt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {styles.find((s) => s.value === image.style)?.label ||
                            image.style}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          {image.size || "1024x1024"}
                        </span>
                        {image.quality && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full uppercase">
                            {image.quality}
                          </span>
                        )}
                        {image.createdAt && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {new Date(image.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {image.revisedPrompt &&
                        image.revisedPrompt !== image.prompt && (
                          <div className="mt-2 p-2 bg-purple-50 rounded text-xs text-gray-600">
                            <span className="font-semibold">Revised: </span>
                            {image.revisedPrompt}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No History Yet
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Your generated images will appear here. Start creating images
                  to build your history!
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Full-size Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 z-10"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.url}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg">
              <p className="text-sm">{selectedImage.prompt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
