// YouTube playback via the official IFrame Player API rather than a raw
// <iframe src="..."> tag. Two things caused "Error 153 / configuration
// error" in the previous prototype: (1) no `origin` was ever sent, which the
// API sets automatically and correctly, and (2) there was no way to detect a
// genuinely embed-disabled video, so YouTube's own broken frame showed
// through instead of a friendly fallback. onError below covers that case.
const EMBED_DISABLED_CODES = new Set([101, 150]);

let apiReadyPromise = null;
function loadYouTubeAPI() {
  if (apiReadyPromise) return apiReadyPromise;
  apiReadyPromise = new Promise(resolve => {
    if (window.YT && window.YT.Player) { resolve(window.YT); return; }
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiReadyPromise;
}

export function createPlayer(container) {
  let player = null;
  let mountId = 'cx-yt-mount';
  let requestToken = 0;

  function setContent(html) {
    if (player) { try { player.destroy(); } catch (e) { /* already gone */ } player = null; }
    container.innerHTML = html;
  }

  function showEmpty() {
    setContent('<div class="cx-player-empty">Select an example on the map to play it here.</div>');
  }

  function showNoLink() {
    setContent('<div class="cx-player-empty">No YouTube link added yet for this example.</div>');
  }

  function showFallback(track) {
    setContent(`
      <div class="cx-player-fallback">
        <img src="https://img.youtube.com/vi/${track.youtubeId}/hqdefault.jpg" alt="" />
        <div class="cx-player-fallback-text">This video can't be played here.</div>
        <a class="btn btn-ghost" href="https://www.youtube.com/watch?v=${track.youtubeId}" target="_blank" rel="noopener">Watch on YouTube ↗</a>
      </div>
    `);
  }

  async function play(track) {
    if (!track.youtubeId) { showNoLink(); return; }
    const token = ++requestToken;
    setContent(`<div class="cx-player-mount"><div id="${mountId}"></div></div>`);
    const YT = await loadYouTubeAPI();
    if (token !== requestToken) return; // a newer selection arrived while loading

    player = new YT.Player(mountId, {
      videoId: track.youtubeId,
      playerVars: { rel: 0, autoplay: 1, origin: window.location.origin },
      events: {
        onError: (e) => {
          if (token !== requestToken) return;
          if (EMBED_DISABLED_CODES.has(e.data)) showFallback(track);
        }
      }
    });
  }

  showEmpty();
  return { play, showEmpty };
}
