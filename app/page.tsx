"use client";

import { useState } from "react";
import Hls from "hls.js";

export default function Home() {
  const [url, setUrl] = useState("");
  const [cookie, setCookie] = useState("");
  const [hls, setHls] = useState<Hls | null>(null);

  const playStream = () => {
    const video = document.getElementById("video") as HTMLVideoElement;
    if (!url) return alert("Enter M3U8 URL");

    if (hls) {
      hls.destroy();
    }

    if (Hls.isSupported()) {
      const newHls = new Hls({
        xhrSetup: function (xhr) {
          if (cookie) {
            xhr.setRequestHeader("Cookie", cookie);
          }
        },
      });
      newHls.loadSource(url);
      newHls.attachMedia(video);
      setHls(newHls);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      alert("HLS not supported in this browser.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">M3U8 Player with Cookie Support</h1>

      <input
        type="text"
        placeholder="Enter M3U8 URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <input
        type="text"
        placeholder="Enter Cookie (e.g. session=abcd1234)"
        value={cookie}
        onChange={(e) => setCookie(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button
        onClick={playStream}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Play
      </button>

      <video
        id="video"
        controls
        autoPlay
        width="640"
        height="360"
        className="rounded border"
      />
    </div>
  );
}
