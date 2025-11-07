import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Loader,
  Copy,
  AlertTriangle,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { aiServices } from "../services/aiServices";
import { toast } from "react-hot-toast";
import AIWriterHistoryPanel from "../components/AIWriterHistoryPanel";
import UpgradeLimitModal from "../components/UpgradeLimitModal";
import { useSocket } from "../hooks/useSocket";
import logger from "../utils/logger";
import { EVENTS } from "../constants/events";
import { TIMING } from "../constants/timing";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants/messages";
import { authService } from "../services/auth";

// Typing animation constants (moved to TIMING constants)
const TYPING_SPEED_MS = TIMING.TYPING_SPEED_MS;
const CHARS_PER_UPDATE = TIMING.CHARS_PER_UPDATE;
const CATCH_UP_THRESHOLD = TIMING.CATCH_UP_THRESHOLD;

const AIWriter = () => {
  const [prompt, setPrompt] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [limitExceededData, setLimitExceededData] = useState(null);
  const [showModal, setShowModal] = useState(false); // Control modal visibility separately

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
  const modalShownRef = useRef(false); // Prevent modal reset on re-renders

  const navigate = useNavigate();

  // Initialize Socket.IO connection for real-time usage updates
  const { isConnected: socketConnected } = useSocket();

  // Usage data state
  const [usageData, setUsageData] = useState(null);

  // Load usage data function - defined before useEffect
  const loadUsageData = useCallback(async () => {
    try {
      const data = await authService.getDetailedUsage();
      setUsageData(data);
    } catch (error) {
      // Don't log 429 errors - too noisy
      if (error?.response?.status !== 429) {
        logger.error("Failed to load usage data:", error);
      }
    }
  }, []);

  // Load usage data on mount and after generation
  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  // Calculate usage percentage
  const usagePercentage = useMemo(() => {
    if (!usageData?.usage?.aiTextWriter) return 0;
    const { wordsUsed = 0, wordsLimit = 0 } = usageData.usage.aiTextWriter;
    return wordsLimit > 0 ? Math.round((wordsUsed / wordsLimit) * 100) : 0;
  }, [usageData]);

  // Check initial usage on mount to show modal if already exceeded
  useEffect(() => {
    // Use a ref flag to persist across re-renders (better than local variable)
    if (modalShownRef.current) {
      // Already checked or modal shown - skip
      return;
    }

    let isCancelled = false;

    const checkInitialUsage = async () => {
      try {
        const { authService } = await import("../services/auth");
        const usageData = await authService.getDetailedUsage();

        // Check if component is still mounted and not cancelled
        if (isCancelled || modalShownRef.current) {
          return;
        }

        if (usageData?.usage?.aiTextWriter) {
          const { wordsUsed = 0, wordsLimit = 0 } =
            usageData.usage.aiTextWriter;
          const percentage =
            wordsLimit > 0 ? Math.round((wordsUsed / wordsLimit) * 100) : 0;

          // Always show modal if usage >= 100% and not already shown (INITIAL PAGE LOAD ONLY)
          if (percentage >= 100 && !modalShownRef.current) {
            logger.warn(
              `Usage limit exceeded (${percentage}%), showing upgrade modal on initial load`
            );
            modalShownRef.current = true;
            setLimitExceeded(true);
            setShowModal(true); // Show modal only on initial page load
            setLimitExceededData({
              service: "ai_text_writer",
              usage: {
                used: wordsUsed,
                limit: wordsLimit,
                percentage: percentage,
                remaining: Math.max(0, wordsLimit - wordsUsed),
              },
              message: `You've used ${percentage}% of your daily word limit. Please upgrade your plan.`,
              limitExceeded: true,
            });
          }
        }
      } catch (error) {
        // Don't log 429 errors - too noisy
        if (error?.response?.status !== 429) {
          logger.error("Failed to check initial usage:", error);
        }
      }
    };

    // Run check once on mount
    checkInitialUsage();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, []); // Empty deps - only run once on mount

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
          logger.error("Failed to load options:", error);
          toast.error(ERROR_MESSAGES.OPTIONS_LOAD_FAILED);
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

  // Listen for Socket.IO usage events
  useEffect(() => {
    // Handle usage limit exceeded (100%)
    const handleLimitExceeded = (event) => {
      const data = event.detail;
      logger.warn("AIWriter: Usage limit exceeded event received:", data);

      // Stop generation immediately
      if (loading) {
        logger.info("Stopping generation due to limit exceeded");
        setLoading(false);
        setIsStreaming(false);
        cleanupTypingAnimation();
      }

      // Show error in Generated Content area (NO MODAL during generation)
      logger.info(
        "Limit exceeded during generation - showing in content area only"
      );

      // Prepare data for content area display
      const errorData = {
        ...data,
        service: data?.service || "ai_text_writer",
        usage: {
          used: data?.usage?.used || 0,
          limit: data?.usage?.limit || 0,
          percentage: data?.usage?.percentage || 100,
          remaining: data?.usage?.remaining || 0,
        },
        message: data?.message || data?.error || ERROR_MESSAGES.LIMIT_EXCEEDED,
        limitExceeded: true,
        timestamp: data?.timestamp || new Date(),
      };

      // Set state for content area display (NO MODAL)
      setLimitExceeded(true);
      setLimitExceededData(errorData);
      // DON'T show modal - content area already shows error
    };

    // Handle usage limit warning (will exceed)
    const handleLimitWarning = (event) => {
      const data = event.detail;
      logger.warn("Usage limit warning:", data);

      // Stop generation
      if (loading) {
        setLoading(false);
        setIsStreaming(false);
        cleanupTypingAnimation();
      }

      // Show in content area only (NO MODAL) if already at 100%+
      if (data?.usage?.percentage >= 100) {
        setLimitExceeded(true);
        setLimitExceededData(data);
        // DON'T show modal - content area already shows error
      }
    };

    // Handle usage warning (80%+)
    const handleUsageWarning = (event) => {
      const data = event.detail;
      logger.debug("Usage warning:", data);

      // Show in content area only (NO MODAL) if 100%+ reached
      if (data?.usage?.percentage >= 100) {
        setLimitExceeded(true);
        setLimitExceededData(data);
        // DON'T show modal - content area already shows error
      }
    };

    // Handle usage updated (after generation)
    const handleUsageUpdated = (event) => {
      const data = event.detail;
      logger.debug("Usage updated:", data);

      // Check if limit exceeded after generation
      const percentage = data?.usage?.percentage || 0;
      if (percentage >= 100) {
        // Show in content area only (NO MODAL)
        logger.info(
          "Usage exceeded after generation - showing in content area only"
        );
        setLimitExceeded(true);
        setLimitExceededData(data);
        // DON'T show modal - content area already shows error
      }
    };

    // Add event listeners
    window.addEventListener(EVENTS.USAGE_LIMIT_EXCEEDED, handleLimitExceeded);
    window.addEventListener(EVENTS.USAGE_LIMIT_WARNING, handleLimitWarning);
    window.addEventListener(EVENTS.USAGE_WARNING, handleUsageWarning);
    window.addEventListener(EVENTS.USAGE_UPDATED, handleUsageUpdated);

    // Cleanup
    return () => {
      window.removeEventListener(
        EVENTS.USAGE_LIMIT_EXCEEDED,
        handleLimitExceeded
      );
      window.removeEventListener(
        EVENTS.USAGE_LIMIT_WARNING,
        handleLimitWarning
      );
      window.removeEventListener(EVENTS.USAGE_WARNING, handleUsageWarning);
      window.removeEventListener(EVENTS.USAGE_UPDATED, handleUsageUpdated);
    };
  }, [loading, cleanupTypingAnimation]); // Keep dependencies to ensure latest handlers are used

  // Handle chunk received during streaming
  const handleChunkReceived = useCallback((chunk, partial) => {
    if (!isMountedRef.current) return;

    // BEST PRACTICE: Process chunks immediately, no delays
    // Update accumulated text buffer - animation will gradually reveal it
    accumulatedTextRef.current = partial;
    setGeneratedText(partial); // Store full text for copy button

    // Chunk received - animation handles display

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
        toast.success(
          SUCCESS_MESSAGES.TEXT_GENERATED(data.wordsGenerated || 0)
        );

        // Refresh history after successful generation
        if (window.refreshHistoryPanel) {
          window.refreshHistoryPanel();
        }

        // Reload usage data
        loadUsageData();
      }, TIMING.MODAL_DELAY);
    },
    [cleanupTypingAnimation, loadUsageData]
  );

  // Handle streaming error
  const handleStreamError = useCallback(
    (error) => {
      if (!isMountedRef.current) return;

      setIsStreaming(false);
      setLoading(false);
      cleanupTypingAnimation();

      // Check if error is limit exceeded
      const errorLower = error?.toLowerCase() || "";
      if (
        errorLower.includes("limit") ||
        errorLower.includes("exceeded") ||
        errorLower.includes("upgrade")
      ) {
        logger.warn(
          "Limit exceeded error detected in handleStreamError:",
          error
        );

        toast.error(error || ERROR_MESSAGES.LIMIT_EXCEEDED);

        // Extract usage from error message if possible, or use default
        // Error format: "Daily word limit reached (800 words used)"
        let used = 0;
        let limit = 0;
        let percentage = 100;

        // Try to parse usage from error message
        const match = error.match(
          /(\d+)\s*words?\s*(?:used|of)\s*(?:out\s*of\s*)?(\d+)?/i
        );
        if (match) {
          used = parseInt(match[1]) || 0;
          limit = parseInt(match[2]) || 800;
          percentage = Math.round((used / limit) * 100);
        }

        // Show error in Generated Content area (NO MODAL during generation)
        logger.debug(
          "Limit exceeded in stream error - showing in content area only:",
          {
            used,
            limit,
            percentage,
          }
        );

        // Set state for content area display (NO MODAL)
        setLimitExceeded(true);
        setLimitExceededData({
          service: "ai_text_writer",
          usage: {
            used: used,
            limit: limit,
            percentage: percentage,
            remaining: Math.max(0, limit - used),
          },
          message: error || ERROR_MESSAGES.LIMIT_EXCEEDED,
          limitExceeded: true,
        });
        // DON'T show modal - content area already shows error
      } else {
        toast.error(error || ERROR_MESSAGES.GENERATION_FAILED);
      }
    },
    [cleanupTypingAnimation]
  );

  // Handle form submission
  const handleGenerate = useCallback(
    async (e) => {
      e.preventDefault();

      if (!prompt.trim()) {
        toast.error(ERROR_MESSAGES.PROMPT_REQUIRED);
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
      limitExceeded,
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
      toast.success(SUCCESS_MESSAGES.TEXT_COPIED);
    } catch (error) {
      logger.error("Failed to copy:", error);
      toast.error("Failed to copy text");
    }
  }, [generatedText]);

  // Handle load from history
  const handleLoadHistory = useCallback((content, prompt = "") => {
    setGeneratedText(content);
    setDisplayedText(content);
    if (prompt) {
      setPrompt(prompt);
    }
    // Scroll to top of output section
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">AI Text Writer</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">
              Create professional content with AI-powered writing assistant
            </p>
          </div>
        </div>

        {/* Usage Stats */}
        {usageData?.usage?.aiTextWriter && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Daily Usage:{" "}
                {usageData.usage.aiTextWriter.wordsUsed?.toLocaleString() || 0}{" "}
                /{" "}
                {usageData.usage.aiTextWriter.wordsLimit?.toLocaleString() || 0}{" "}
                words
              </span>
              <span className="text-sm font-semibold text-blue-600">
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
                    : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {usagePercentage >= 90 && (
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                You're running low on daily words. Consider upgrading your plan.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative">
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
            ) : limitExceeded && limitExceededData ? (
              // Limit exceeded state - Show error message in content area
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                <div className="bg-red-100 rounded-full p-4 mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Daily Limit Reached
                </h3>
                <p className="text-gray-600 text-base mb-1 max-w-md">
                  You've used{" "}
                  <span className="font-semibold text-red-600">
                    {limitExceededData?.usage?.percentage || 100}% (
                    {limitExceededData?.usage?.used?.toLocaleString() || 0} /{" "}
                    {limitExceededData?.usage?.limit?.toLocaleString() || 0}{" "}
                    words)
                  </span>{" "}
                  of your daily word limit.
                </p>
                <p className="text-gray-500 text-sm mb-6 max-w-md">
                  Please upgrade your plan to continue generating content.
                </p>
                <Link
                  to="/upgrade-plans"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors"
                  onClick={() => {
                    setLimitExceeded(false);
                    setLimitExceededData(null);
                  }}
                >
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              // Empty state - No content yet
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

      {/* History Panel (Floating Drawer) */}
      <AIWriterHistoryPanel onLoadHistory={handleLoadHistory} />

      {/* Upgrade Limit Modal - Only show on initial page load, not during generation errors */}
      {showModal && limitExceeded && limitExceededData && (
        <UpgradeLimitModal
          isOpen={true}
          onClose={() => {
            setShowModal(false);
            // Keep limitExceeded true so content area still shows error
            // Keep modalShownRef true to prevent immediate reopen
            modalShownRef.current = true;
          }}
          usageData={limitExceededData}
        />
      )}
    </div>
  );
};

export default AIWriter;
