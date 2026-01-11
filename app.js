(() => {
  const buttons = document.querySelectorAll("[data-copy]");

  const showToast = (toast) => {
    if (!toast) return;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1500);
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      const toast = btn.closest(".code-card")?.querySelector(".toast");
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const temp = document.createElement("textarea");
          temp.value = text;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand("copy");
          temp.remove();
        }
        showToast(toast);
      } catch (err) {
        if (toast) {
          toast.textContent = "copy failed";
          showToast(toast);
        }
      }
    });
  });

  const trackCards = document.querySelectorAll(".music-card");
  const bgVideo = document.getElementById("bg-video");
  const dockCover = document.getElementById("dock-cover");
  const dockTitle = document.getElementById("dock-title");
  const dockArtist = document.getElementById("dock-artist");
  const dockPlay = document.getElementById("dock-play");
  const dockRewind = document.getElementById("dock-rewind");
  const dockForward = document.getElementById("dock-forward");
  const dockSeek = document.getElementById("dock-seek");
  const dockCurrent = document.getElementById("dock-current");
  const dockDuration = document.getElementById("dock-duration");
  const dockVolume = document.getElementById("dock-volume");
  const snowCanvas = document.getElementById("snow-canvas");
  const mediaDock = document.querySelector(".media-dock");
  const musicPanel = document.getElementById("music-panel");
  const panelCards = document.querySelectorAll(".music-panel-card");

  if (snowCanvas) {
    const snowCtx = snowCanvas.getContext("2d");
    let flakes = [];
    const snowActive = true;

    const initFlakes = () => {
      const w = Math.max(window.innerWidth, document.documentElement.clientWidth, 800);
      const h = Math.max(window.innerHeight, document.documentElement.clientHeight, 600);
      snowCanvas.width = w;
      snowCanvas.height = h;

      flakes = Array.from({ length: 120 }).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.6,
        s: Math.random() * 0.6 + 0.4,
        drift: Math.random() * 0.6 - 0.3,
      }));
    };

    const resize = () => {
      const w = Math.max(window.innerWidth, document.documentElement.clientWidth, 800);
      const h = Math.max(window.innerHeight, document.documentElement.clientHeight, 600);
      snowCanvas.width = w;
      snowCanvas.height = h;
    };

    window.addEventListener("resize", resize);
    initFlakes();
    resize();

    const draw = () => {
      if (!snowCtx || !snowActive) {
        requestAnimationFrame(draw);
        return;
      }
      
      if (flakes.length === 0) {
        initFlakes();
      }
      
      snowCtx.clearRect(0, 0, snowCanvas.width, snowCanvas.height);
      snowCtx.fillStyle = "rgba(255,255,255,0.8)";
      flakes.forEach((f) => {
        snowCtx.beginPath();
        snowCtx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        snowCtx.fill();
        f.y += f.s;
        f.x += f.drift;
        if (f.y > snowCanvas.height) f.y = -2;
        if (f.x > snowCanvas.width) f.x = 0;
        if (f.x < 0) f.x = snowCanvas.width;
      });
      requestAnimationFrame(draw);
    };
    
    draw();
  }

  const formatTime = (s) => {
    if (!Number.isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${r}`;
  };

  if (
    trackCards.length &&
    dockCover &&
    dockTitle &&
    dockArtist &&
    dockPlay &&
    dockRewind &&
    dockForward &&
    dockSeek &&
    dockCurrent &&
    dockDuration
  ) {
    const tracks = Array.from(trackCards).map((card) => ({
      src: card.getAttribute("data-src"),
      video: card.getAttribute("data-video"),
      title: card.getAttribute("data-title"),
      artist: card.getAttribute("data-artist"),
      cover: card.getAttribute("data-cover"),
      node: card,
    }));

    const audio = new Audio();
    audio.preload = "auto";
    audio.volume = 1;

    let currentIndex = 0;
    let isPlaying = false;
    let fadeInterval;
    let seeking = false;

    const fadeVolume = (target) => {
      clearInterval(fadeInterval);
      const maxVol = dockVolume ? Number(dockVolume.value) / 100 : 1;
      const targetVol = target * maxVol;
      fadeInterval = setInterval(() => {
        const step = 0.05 * maxVol;
        if (Math.abs(audio.volume - targetVol) <= step) {
          audio.volume = targetVol;
          clearInterval(fadeInterval);
          if (target === 0) audio.pause();
          return;
        }
        audio.volume += audio.volume < targetVol ? step : -step;
      }, 70);
    };

    const setActive = (index) => {
      tracks.forEach((t, i) => {
        if (t.node) {
          t.node.classList.toggle("active", i === index);
        }
      });
      panelCards.forEach((card, i) => {
        card.classList.toggle("active", i === index);
      });
    };

    const setVideo = (track) => {
      if (!bgVideo) return;
      const hasVideo = !!track.video;
      if (hasVideo) {
        bgVideo.src = track.video;
        bgVideo.classList.add("show");
        bgVideo.play().catch(() => {});
      } else {
        bgVideo.pause();
        bgVideo.classList.remove("show");
        bgVideo.removeAttribute("src");
      }
    };

    const loadTrack = (index) => {
      const track = tracks[index];
      if (!track) return;
      currentIndex = index;
      audio.src = track.src;
      dockTitle.textContent = track.title || "track";
      dockArtist.textContent = track.artist || "unknown";
      dockCover.style.backgroundImage = `url('${track.cover || ""}')`;
      dockSeek.value = 0;
      dockCurrent.textContent = "0:00";
      dockDuration.textContent = "0:00";
      setActive(index);
      setVideo(track);
    };

    const play = () => {
      audio
        .play()
        .then(() => {
          isPlaying = true;
          dockPlay.textContent = "⏸";
          fadeVolume(1);
        })
        .catch(() => {
        });
    };

    const pause = () => {
      isPlaying = false;
      dockPlay.textContent = "▶";
      fadeVolume(0);
    };

    const next = () => {
      const nxt = (currentIndex + 1) % tracks.length;
      loadTrack(nxt);
      play();
    };

    const prev = () => {
      const prv = (currentIndex - 1 + tracks.length) % tracks.length;
      loadTrack(prv);
      play();
    };

    dockPlay.addEventListener("click", () => {
      if (isPlaying) pause();
      else play();
    });

    dockForward.addEventListener("click", next);
    dockRewind.addEventListener("click", prev);

    dockSeek.addEventListener("input", (e) => {
      seeking = true;
      const pct = Number(e.target.value) / 100;
      if (audio.duration) {
        const t = pct * audio.duration;
        dockCurrent.textContent = formatTime(t);
      }
    });

    dockSeek.addEventListener("change", (e) => {
      if (!audio.duration) return;
      const pct = Number(e.target.value) / 100;
      audio.currentTime = pct * audio.duration;
      seeking = false;
    });

    audio.addEventListener("timeupdate", () => {
      if (!audio.duration) return;
      dockDuration.textContent = formatTime(audio.duration);
      if (!seeking) {
        dockCurrent.textContent = formatTime(audio.currentTime);
        dockSeek.value = ((audio.currentTime / audio.duration) * 100).toFixed(2);
      }
    });

    trackCards.forEach((card, idx) => {
      card.addEventListener("click", () => {
        loadTrack(idx);
        play();
      });
    });

    audio.addEventListener("ended", next);

    if (dockVolume) {
      const updateVolumeIcon = (vol) => {
        const volumeContainer = dockVolume.closest(".media-volume");
        if (volumeContainer) {
          const icon = volumeContainer.querySelector(".volume-icon");
          if (icon) {
            if (vol === 0) {
              icon.textContent = "🔇";
            } else if (vol < 0.5) {
              icon.textContent = "🔉";
            } else {
              icon.textContent = "🔊";
            }
          }
        }
      };

      dockVolume.addEventListener("input", (e) => {
        const vol = Number(e.target.value) / 100;
        if (isPlaying) {
          audio.volume = vol;
        }
        updateVolumeIcon(vol);
      });
      dockVolume.value = 100;
      updateVolumeIcon(1);
    }

    panelCards.forEach((card, idx) => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        loadTrack(idx);
        play();
      });
    });

    if (mediaDock && musicPanel) {
      let hideTimeout;
      let cursorCheckInterval;
      let lastCursorDetectedTime = 0;
      let lastMouseX = 0;
      let lastMouseY = 0;
      
      const isCursorOverMediaPlayer = (x, y) => {
        const dockRect = mediaDock.getBoundingClientRect();
        const panelRect = musicPanel.getBoundingClientRect();
        
        const isOverDock = x >= dockRect.left && x <= dockRect.right && 
                          y >= dockRect.top && y <= dockRect.bottom;
        const isOverPanel = x >= panelRect.left && x <= panelRect.right && 
                           y >= panelRect.top && y <= panelRect.bottom;
        const isInGap = x >= Math.min(dockRect.left, panelRect.left) - 20 && 
                       x <= Math.max(dockRect.right, panelRect.right) + 20 &&
                       y >= Math.min(dockRect.top, panelRect.top) - 20 && 
                       y <= Math.max(dockRect.bottom, panelRect.bottom) + 20;
        
        return isOverDock || isOverPanel || isInGap;
      };
      
      const startCursorTracking = () => {
        lastCursorDetectedTime = Date.now();
        
        if (cursorCheckInterval) {
          clearInterval(cursorCheckInterval);
        }
        
        cursorCheckInterval = setInterval(() => {
          if (mediaDock.classList.contains("show-panel")) {
            const timeSinceLastDetected = Date.now() - lastCursorDetectedTime;
            if (timeSinceLastDetected >= 2000) {
              if (!isCursorOverMediaPlayer(lastMouseX, lastMouseY)) {
                mediaDock.classList.remove("show-panel");
                clearInterval(cursorCheckInterval);
                cursorCheckInterval = null;
              } else {
                lastCursorDetectedTime = Date.now();
              }
            }
          } else {
            clearInterval(cursorCheckInterval);
            cursorCheckInterval = null;
          }
        }, 100);
      };
      
      const showPanel = () => {
        clearTimeout(hideTimeout);
        mediaDock.classList.add("show-panel");
        lastCursorDetectedTime = Date.now();
        startCursorTracking();
      };
      
      const hidePanel = () => {
        clearTimeout(hideTimeout);
        if (cursorCheckInterval) {
          clearInterval(cursorCheckInterval);
          cursorCheckInterval = null;
        }
        hideTimeout = setTimeout(() => {
          if (!mediaDock.matches(":hover") && !musicPanel.matches(":hover")) {
            mediaDock.classList.remove("show-panel");
          }
        }, 200);
      };

      mediaDock.addEventListener("mouseenter", showPanel);
      mediaDock.addEventListener("mouseleave", hidePanel);
      musicPanel.addEventListener("mouseenter", showPanel);
      musicPanel.addEventListener("mouseleave", hidePanel);

      document.addEventListener("mousemove", (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        
        if (mediaDock.classList.contains("show-panel")) {
          if (isCursorOverMediaPlayer(lastMouseX, lastMouseY)) {
            lastCursorDetectedTime = Date.now();
            clearTimeout(hideTimeout);
          }
        }
      });

      mediaDock.addEventListener("click", (e) => {
        if (window.matchMedia("(hover: none)").matches) {
          mediaDock.classList.toggle("show-panel");
          if (mediaDock.classList.contains("show-panel")) {
            startCursorTracking();
          } else {
            if (cursorCheckInterval) {
              clearInterval(cursorCheckInterval);
              cursorCheckInterval = null;
            }
          }
        }
      });
      
      document.addEventListener("click", (e) => {
        if (mediaDock && !mediaDock.contains(e.target) && !musicPanel.contains(e.target)) {
          mediaDock.classList.remove("show-panel");
          if (cursorCheckInterval) {
            clearInterval(cursorCheckInterval);
            cursorCheckInterval = null;
          }
        }
      });
    }

    loadTrack(currentIndex);
    play();
  } else if (dockCover && trackCards.length === 0) {
    const defaultCover = 'https://i1.sndcdn.com/artworks-fkS9QjUdEtWtgGtU-0yxyWA-t1080x1080.jpg';
    dockCover.style.backgroundImage = `url('${defaultCover}')`;
  }
})();
