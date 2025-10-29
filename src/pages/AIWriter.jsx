import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { Sparkles, Loader, Copy } from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";

const AIWriter = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);

  // Options from API
  const [options, setOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Selected values
  const [contentType, setContentType] = useState("blog_post");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  // Streaming toggle
  const [streaming, setStreaming] = useState(true); // Enable streaming by default

  const navigate = useNavigate();

  // Fetch options on mount
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setOptionsLoading(true);
      const data = await aiServices.getServiceOptions();
      setOptions(data);

      // Set default values
      if (data.contentTypes?.length > 0) {
        setContentType(data.contentTypes[0].value);
      }
      if (data.tones?.length > 0) {
        setTone(data.tones[0].value);
      }
      if (data.lengths?.length > 0) {
        setLength(data.lengths[0].value);
      }
    } catch (error) {
      console.error("Failed to load options:", error);
      toast.error("Failed to load options");
    } finally {
      setOptionsLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setLoading(true);
    setGeneratedText(""); // Clear previous text

    if (streaming) {
      // Use streaming
      await aiServices.generateTextStream(
        {
          prompt,
          contentType,
          tone,
          length,
        },
        // On chunk received
        (chunk, partial) => {
          setGeneratedText(partial);
        },
        // On complete
        (data) => {
          setGeneratedText(data.fullText || "");
          toast.success(`Text generated! (${data.wordsGenerated} words)`);
          setLoading(false);
        },
        // On error
        (error) => {
          toast.error(error || "Failed to generate text");
          setLoading(false);
        }
      );
    } else {
      // Use non-streaming
      try {
        const response = await aiServices.generateText({
          prompt,
          contentType,
          tone,
          length,
        });
        setGeneratedText(response.generatedText || response.content || "");
        toast.success("Text generated successfully!");
      } catch (error) {
        toast.error(error.message || "Failed to generate text");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      toast.success("Text copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy text");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">AI Text Writer</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Write Your Content</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Content Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="input-field"
                  disabled={optionsLoading}
                >
                  {options?.contentTypes?.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {options?.contentTypes?.find((t) => t.value === contentType)
                  ?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {
                      options.contentTypes.find((t) => t.value === contentType)
                        .description
                    }
                  </p>
                )}
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="input-field"
                  disabled={optionsLoading}
                >
                  {options?.tones?.map((toneOpt) => (
                    <option key={toneOpt.value} value={toneOpt.value}>
                      {toneOpt.label}
                    </option>
                  ))}
                </select>
                {options?.tones?.find((t) => t.value === tone)?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {options.tones.find((t) => t.value === tone).description}
                  </p>
                )}
              </div>

              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Length
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="input-field"
                  disabled={optionsLoading}
                >
                  {options?.lengths?.map((lengthOpt) => (
                    <option key={lengthOpt.value} value={lengthOpt.value}>
                      {lengthOpt.label}
                    </option>
                  ))}
                </select>
                {options?.lengths?.find((l) => l.value === length)
                  ?.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {
                      options.lengths.find((l) => l.value === length)
                        .description
                    }
                  </p>
                )}
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field h-32"
                  placeholder="Write a blog post about artificial intelligence..."
                />
              </div>

              {/* Streaming Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="streaming"
                  checked={streaming}
                  onChange={(e) => setStreaming(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label
                  htmlFor="streaming"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Enable streaming (real-time generation)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || optionsLoading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Content
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Generated Content</h2>
              {generatedText && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-6 min-h-[300px]">
              {generatedText ? (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {generatedText}
                </p>
              ) : (
                <p className="text-gray-400 text-center">
                  Generated text will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWriter;
