import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Loader, Copy } from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";

// Constants - Optimized for smooth typing effect (ChatGPT-like)
const TYPING_SPEED_MS = 20; // 20ms per update (~50 chars/sec - visible typing speed)
const CHARS_PER_UPDATE = 1; // Characters to reveal per update (smooth one-by-one)
const CATCH_UP_THRESHOLD = 200; // Characters behind before catching up (prevents lag)

const AIWriter = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Options from API
  const [options, setOptions] = useState(null);
  const [optionsLoading, setOptionsLoading] = useState(true);

  // Selected values
  const [contentType, setContentType] = useState("blog_post");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");

  // Streaming is always enabled (removed toggle for simplicity)
  const streaming = true;

  // Refs for typing effect and cleanup
  const typingAnimationRef = useRef(null);
  const accumulatedTextRef = useRef(""); // Buffer for all received chunks
  const displayedIndexRef = useRef(0); // Current displayed character index
  const isMountedRef = useRef(true); // Component mount status
  const abortControllerRef = useRef(null); // Request cancellation

  const navigate = useNavigate();

  // Memoized content type description
  const contentTypeDescription = useMemo(() => {
    return options?.contentTypes?.find((t) => t.value === contentType)
      ?.description;
  }, [options, contentType]);

  // Memoized tone description
  const toneDescription = useMemo(() => {
    return options?.tones?.find((t) => t.value === tone)?.description;
  }, [options, tone]);

  // Memoized length description
  const lengthDescription = useMemo(() => {
    return options?.lengths?.find((l) => l.value === length)?.description;
  }, [options, length]);

  // Cleanup typing animation
  const cleanupTypingAnimation = useCallback(() => {
    if (typingAnimationRef.current) {
      cancelAnimationFrame(typingAnimationRef.current);
      typingAnimationRef.current = null;
    }
  }, []);

  // Typing effect using requestAnimationFrame (better performance)
  useEffect(() => {
    // Start animation when streaming starts, even if no text yet
    if (!isStreaming) {
      cleanupTypingAnimation();
      return;
    }

    let lastTime = 0;

    const animateTyping = (currentTime) => {
      if (!isMountedRef.current || !isStreaming) {
        cleanupTypingAnimation();
        return;
      }

      // Throttle to TYPING_SPEED_MS
      if (currentTime - lastTime < TYPING_SPEED_MS) {
        typingAnimationRef.current = requestAnimationFrame(animateTyping);
        return;
      }

      lastTime = currentTime;

      // Use refs to avoid dependency issues - check target vs current
      const targetLength = accumulatedTextRef.current.length;
      const currentDisplayedLength = displayedIndexRef.current;
      const charsBehind = targetLength - currentDisplayedLength;

      // If there's more text to reveal, do it gradually
      if (currentDisplayedLength < targetLength && targetLength > 0) {
        // Dynamic speed: If too far behind, reveal faster to catch up
        let charsToReveal = CHARS_PER_UPDATE;
        if (charsBehind > CATCH_UP_THRESHOLD) {
          // If too far behind, reveal 3 chars at a time to catch up faster
          charsToReveal = 3;
        } else if (charsBehind > CATCH_UP_THRESHOLD / 2) {
          // Medium behind - reveal 2 chars at a time
          charsToReveal = 2;
        }

        charsToReveal = Math.min(charsToReveal, charsBehind);
        const newLength = currentDisplayedLength + charsToReveal;
        displayedIndexRef.current = newLength;

        // Update displayed text - substring from accumulated buffer
        setDisplayedText(accumulatedTextRef.current.substring(0, newLength));

        // Continue animation loop immediately
        typingAnimationRef.current = requestAnimationFrame(animateTyping);
      } else {
        // All available text displayed, keep checking for new chunks
        // This ensures new chunks are processed immediately
        typingAnimationRef.current = requestAnimationFrame(animateTyping);
      }
    };

    typingAnimationRef.current = requestAnimationFrame(animateTyping);

    return cleanupTypingAnimation;
  }, [isStreaming, cleanupTypingAnimation]); // Removed displayedText to prevent restart loop

  // Reset all states
  const resetStates = useCallback(() => {
    setGeneratedText("");
    setDisplayedText("");
    setIsStreaming(false);
    accumulatedTextRef.current = "";
    displayedIndexRef.current = 0;
    cleanupTypingAnimation();
  }, [cleanupTypingAnimation]);

  // Fetch options on mount
  useEffect(() => {
    let isCancelled = false;

    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        const data = await aiServices.getServiceOptions();

        if (isCancelled) return;

        setOptions(data);

        // Set default values - always set from API if available
        // This ensures we use the latest options from server
        if (data.contentTypes?.length > 0) {
          setContentType((prev) => prev || data.contentTypes[0].value);
        }
        if (data.tones?.length > 0) {
          setTone((prev) => prev || data.tones[0].value);
        }
        if (data.lengths?.length > 0) {
          setLength((prev) => prev || data.lengths[0].value);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Failed to load options:", error);
          toast.error("Failed to load options");
        }
      } finally {
        if (!isCancelled) {
          setOptionsLoading(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isCancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupTypingAnimation();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupTypingAnimation]);

  // Handle chunk received during streaming
  const handleChunkReceived = useCallback((chunk, partial) => {
    if (!isMountedRef.current) return;

    // BEST PRACTICE: Process chunks immediately, no delays
    // Update accumulated text buffer - animation will gradually reveal it
    accumulatedTextRef.current = partial;
    setGeneratedText(partial); // Store full text for copy button

    // Debug: Log chunk reception (can remove in production)
    // console.log(`📥 Chunk received: ${chunk?.length || 0} chars, Total: ${partial.length}`);

    // Animation useEffect handles gradual display automatically
    // No direct displayText manipulation here - ensures smooth typing effect
    // The animation loop continuously checks accumulatedTextRef and displays gradually
  }, []);

  // Handle streaming complete
  const handleStreamComplete = useCallback(
    (data) => {
      if (!isMountedRef.current) return;

      const finalText = data.fullText || "";
      setGeneratedText(finalText);
      accumulatedTextRef.current = finalText;

      // Don't set all text at once - let typing animation complete naturally
      // Only if we're way behind, catch up
      if (displayedIndexRef.current < finalText.length - 20) {
        displayedIndexRef.current = finalText.length - 20;
        setDisplayedText(
          accumulatedTextRef.current.substring(0, displayedIndexRef.current)
        );
      }

      // Set streaming to false - animation will complete naturally
      setIsStreaming(false);
      setLoading(false);

      // After delay, ensure all text is displayed
      setTimeout(() => {
        if (isMountedRef.current) {
          displayedIndexRef.current = finalText.length;
          setDisplayedText(finalText);
        }
        cleanupTypingAnimation();
        toast.success(`Text generated! (${data.wordsGenerated || 0} words)`);
      }, 800);
    },
    [cleanupTypingAnimation]
  );

  // Handle streaming error
  const handleStreamError = useCallback(
    (error) => {
      if (!isMountedRef.current) return;

      setIsStreaming(false);
      setLoading(false);
      cleanupTypingAnimation();
      toast.error(error || "Failed to generate text");
    },
    [cleanupTypingAnimation]
  );

  // Handle form submission
  const handleGenerate = useCallback(
    async (e) => {
      e.preventDefault();

      if (!prompt.trim()) {
        toast.error("Please enter a prompt");
        return;
      }

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Reset states
      setLoading(true);
      resetStates();

      // IMPORTANT: Set streaming to true FIRST, then start receiving chunks
      // This ensures typing animation starts before chunks arrive
      setIsStreaming(true);

      // Initialize typing animation state
      displayedIndexRef.current = 0;
      accumulatedTextRef.current = "";
      setDisplayedText("");

      try {
        await aiServices.generateTextStream(
          {
            prompt,
            contentType,
            tone,
            length,
          },
          handleChunkReceived,
          handleStreamComplete,
          handleStreamError
        );
      } catch (error) {
        if (error.name !== "AbortError" && isMountedRef.current) {
          handleStreamError(error.message);
        }
      }
    },
    [
      prompt,
      contentType,
      tone,
      length,
      resetStates,
      handleChunkReceived,
      handleStreamComplete,
      handleStreamError,
    ]
  );

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!generatedText) return;

    try {
      await navigator.clipboard.writeText(generatedText);
      toast.success("Text copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy text");
    }
  }, [generatedText]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text">
          AI Text Writer
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Create professional content with AI-powered writing assistant
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Input Section */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-primary-600" aria-hidden="true" />
            <h2 className="text-2xl font-semibold">Write Your Content</h2>
          </div>
          <form onSubmit={handleGenerate} className="space-y-5">
            {/* Content Type */}
            <div>
              <label
                htmlFor="contentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content Type
              </label>
              <select
                id="contentType"
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="input-field"
                disabled={optionsLoading || loading}
                aria-label="Content type selector"
              >
                {options?.contentTypes?.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {contentTypeDescription && (
                <p className="text-xs text-gray-500 mt-1" role="note">
                  {contentTypeDescription}
                </p>
              )}
            </div>

            {/* Tone */}
            <div>
              <label
                htmlFor="tone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tone
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="input-field"
                disabled={optionsLoading || loading}
                aria-label="Tone selector"
              >
                {options?.tones?.map((toneOpt) => (
                  <option key={toneOpt.value} value={toneOpt.value}>
                    {toneOpt.label}
                  </option>
                ))}
              </select>
              {toneDescription && (
                <p className="text-xs text-gray-500 mt-1" role="note">
                  {toneDescription}
                </p>
              )}
            </div>

            {/* Length */}
            <div>
              <label
                htmlFor="length"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Length
              </label>
              <select
                id="length"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="input-field"
                disabled={optionsLoading || loading}
                aria-label="Length selector"
              >
                {options?.lengths?.map((lengthOpt) => (
                  <option key={lengthOpt.value} value={lengthOpt.value}>
                    {lengthOpt.label}
                  </option>
                ))}
              </select>
              {lengthDescription && (
                <p className="text-xs text-gray-500 mt-1" role="note">
                  {lengthDescription}
                </p>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Enter your prompt
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input-field min-h-[120px] resize-y"
                placeholder="Example: Write a blog post about artificial intelligence and its impact on modern technology..."
                disabled={loading}
                aria-label="Prompt input"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                {prompt.length > 0 && `${prompt.length} characters`}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || optionsLoading || !prompt.trim()}
                className="btn-primary flex-1 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Generate content"
              >
                {loading ? (
                  <>
                    <Loader
                      className="w-5 h-5 animate-spin mr-2"
                      aria-hidden="true"
                    />
                    <span>
                      {isStreaming ? "Streaming..." : "Generating..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" aria-hidden="true" />
                    <span>Generate Content</span>
                  </>
                )}
              </button>
              {loading && (
                <button
                  type="button"
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }
                    resetStates();
                    setLoading(false);
                  }}
                  className="btn-secondary px-4"
                  aria-label="Stop generation"
                >
                  Stop
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Output Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-primary-600 to-purple-600 rounded-full"></div>
              <h2 className="text-2xl font-semibold">Generated Content</h2>
            </div>
            {generatedText && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 hidden sm:inline">
                  {
                    generatedText
                      .trim()
                      .split(/\s+/)
                      .filter((w) => w).length
                  }{" "}
                  words
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded-lg transition-colors font-medium"
                  title="Copy to clipboard"
                  aria-label="Copy generated text to clipboard"
                >
                  <Copy className="w-4 h-4" aria-hidden="true" />
                  <span>Copy</span>
                </button>
              </div>
            )}
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 min-h-[400px] max-h-[600px] overflow-y-auto border border-gray-200">
            {displayedText || loading ? (
              <div className="relative">
                <p
                  className="text-gray-800 whitespace-pre-wrap leading-relaxed text-base sm:text-[15px]"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {displayedText}
                  {isStreaming && (
                    <span
                      className="inline-block w-[2px] h-5 bg-primary-600 ml-1 animate-pulse align-middle"
                      aria-hidden="true"
                    >
                      |
                    </span>
                  )}
                </p>
                {loading && !displayedText && (
                  <div className="flex items-center justify-center py-8">
                    <Loader
                      className="w-6 h-6 animate-spin text-primary-600"
                      aria-hidden="true"
                    />
                    <span className="ml-3 text-gray-600">
                      Starting generation...
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <Sparkles
                  className="w-12 h-12 text-gray-300 mb-4"
                  aria-hidden="true"
                />
                <p className="text-gray-400 text-base mb-1" role="status">
                  Generated text will appear here
                </p>
                <p className="text-gray-400 text-sm">
                  Enter a prompt and click Generate to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWriter;
