import { useState } from "react";
import { Image as ImageIcon, Loader } from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";

const ImageGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      const response = await aiServices.generateImage({
        prompt,
        style: "realistic",
        count: 1,
      });
      setGeneratedImages([...generatedImages, response.imageUrl]);
      toast.success("Image generated successfully!");
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">AI Image Generator</h1>

      <div className="card mb-8">
        <h2 className="text-2xl font-semibold mb-4">Create AI Art</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe your image
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="input-field"
              placeholder="A futuristic city at sunset..."
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Generate Image
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Generated Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {generatedImages.map((imageUrl, index) => (
              <div key={index} className="card">
                <img
                  src={imageUrl}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
