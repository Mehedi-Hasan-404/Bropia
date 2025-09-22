"use client";

import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";

export default function Home() {
  const [url, setUrl] = useState("");
  const [cookie, setCookie] = useState("");
  const [hls, setHls] = useState<Hls | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [hls]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('playlist');
    } catch {
      return false;
    }
  };

  const playStream = async () => {
    const video = videoRef.current;
    if (!video) return;

    setError(null);
    setLoading(true);

    // Validation
    if (!url.trim()) {
      setError("Please enter a valid M3U8 URL");
      setLoading(false);
      return;
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid M3U8 URL (should contain .m3u8 or playlist)");
      setLoading(false);
      return;
    }

    // Cleanup previous instance
    if (hls) {
      hls.destroy();
      setHls(null);
    }

    try {
      if (Hls.isSupported()) {
        const newHls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          xhrSetup: function (xhr, url) {
            // Add cookie if provided
            if (cookie.trim()) {
              xhr.setRequestHeader("Cookie", cookie);
            }
            // Add common headers that might help with CORS
            xhr.setRequestHeader("Accept", "*/*");
            xhr.setRequestHeader("User-Agent", navigator.userAgent);
          },
        });

        // Error handling
        newHls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS Error:", data);
          if (data.fatal) {
            setError(`Stream error: ${data.details || 'Unknown error'}`);
            setLoading(false);
            setIsPlaying(false);
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Network error: Check your connection or stream URL");
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Media error: Stream format not supported");
                break;
              default:
                newHls.destroy();
                break;
            }
          }
        });

        newHls.on(Hls.Events.MANIFEST_LOADED, () => {
          console.log("Stream loaded successfully");
          setLoading(false);
          setError(null);
        });

        newHls.on(Hls.Events.LEVEL_LOADED, () => {
          setIsPlaying(true);
        });

        newHls.loadSource(url);
        newHls.attachMedia(video);
        setHls(newHls);
        
        // Auto-play after load
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => {
            console.warn("Auto-play prevented:", e);
            setError("Auto-play prevented. Please click play manually.");
          });
        });

      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS support (mainly Safari)
        video.src = url;
        video.addEventListener('loadstart', () => setLoading(false));
        video.addEventListener('error', (e) => {
          setError("Failed to load stream. Check URL or try a different browser.");
          setLoading(false);
        });
        
        video.play().catch(e => {
          console.warn("Auto-play prevented:", e);
          setError("Auto-play prevented. Please click play manually.");
        });
      } else {
        setError("HLS streaming is not supported in this browser. Try Chrome, Firefox, or Safari.");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to initialize player. Please try again.");
      setLoading(false);
      console.error("Player initialization error:", err);
    }
  };

  const stopStream = () => {
    if (hls) {
      hls.destroy();
      setHls(null);
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
    }
    setIsPlaying(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            M3U8 Stream Player
          </h1>
          <p className="text-gray-600">
            Play HLS video streams with optional cookie authentication
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              M3U8 Stream URL
            </label>
            <input
              id="url"
              type="url"
              placeholder="https://example.com/stream/playlist.m3u8"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="cookie" className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Cookie (Optional)
            </label>
            <input
              id="cookie"
              type="text"
              placeholder="session=abc123; token=xyz789"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Note: Cookie authentication may be blocked by CORS policies
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={playStream}
              disabled={loading || !url.trim()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Play Stream"}
            </button>
            <button
              onClick={stopStream}
              disabled={!isPlaying}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Stop
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <video
            ref={videoRef}
            controls
            className="w-full h-auto"
            style={{ minHeight: "300px", backgroundColor: "#000" }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
          <h3 className="font-semibold mb-2">Usage Tips:</h3>
          <ul className="text-sm space-y-1">
            <li>• Use HTTPS URLs when possible for better compatibility</li>
            <li>• Some streams may require specific referrer headers</li>
            <li>• Cookie authentication works best with streams from the same domain</li>
            <li>• If auto-play fails, click the play button manually</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
