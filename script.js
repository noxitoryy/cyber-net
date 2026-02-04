window.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const sections = document.querySelectorAll(".section");

  const mediaVisual = document.getElementById("mediaVisual");
  const videoPlayer = document.getElementById("videoPlayer");
  const audioPlayer = document.getElementById("audioPlayer");
  const musicPlayer = document.getElementById("musicPlayer");

  /* Player UI Elements */
  const btnPlay = document.getElementById("btnPlay");
  const btnFullscreen = document.getElementById("btnFullscreen");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");
  const timeDisplay = document.getElementById("timeDisplay");
  const volSlider = document.getElementById("volSlider");
  const volLabel = document.getElementById("volLabel");

  /* Home Player UI Elements */
  const homeBtnPlay = document.getElementById("homeBtnPlay");
  const homeProgressBar = document.getElementById("homeProgressBar");
  const homeProgressFill = document.getElementById("homeProgressFill");
  const homeTimeDisplay = document.getElementById("homeTimeDisplay");
  const homeVolSlider = document.getElementById("homeVolSlider");
  const homeBtnPrev = document.getElementById("homeBtnPrev");
  const homeBtnNext = document.getElementById("homeBtnNext");
  const homeBtnLoop = document.getElementById("homeBtnLoop");
  const homeMediaTitle = document.getElementById("homeMediaTitle");

  /* System Screens */
  const bootScreen = document.getElementById("bootScreen");
  const powerOffScreen = document.getElementById("powerOffScreen");
  const loginScreen = document.getElementById("loginScreen");
  const powerButton = document.getElementById("powerButton");
  const loginUser = document.getElementById("loginUser");
  const loginPass = document.getElementById("loginPass");
  const btnLogin = document.getElementById("btnLogin");
  const btnPurge = document.getElementById("btnPurge");

  let soundToggle = true;
  let clickToggle = true;
  let visualizerToggle = true;
  let autoStopMusic = true;
  let activeMediaPlayer = null;
  let mediaTimeout = null;
  let hasAuthenticated = false;
  let godModeUnlocked = false;
  let ambiancePlayer = null;
  let currentTheme = "green";
  let starfieldAnimationId = null;

  /* Visualizer Setup */
  let audioContext, analyser, dataArray, canvas, ctx;
  let isVisualizerInit = false;

  function initVisualizer() {
    if (isVisualizerInit) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;

      const audioSrc = audioContext.createMediaElementSource(audioPlayer);
      const videoSrc = audioContext.createMediaElementSource(videoPlayer);
      const musicSrc = audioContext.createMediaElementSource(musicPlayer);
      audioSrc.connect(analyser);
      videoSrc.connect(analyser);
      musicSrc.connect(analyser);
      analyser.connect(audioContext.destination);

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      canvas = document.getElementById("audioVisualizer");
      if (canvas) {
        ctx = canvas.getContext("2d");
        renderVisualizer();
      }
      isVisualizerInit = true;
    } catch (e) {
      console.warn("Visualizer init failed:", e);
    }
  }

  function renderVisualizer() {
    requestAnimationFrame(renderVisualizer);
    if (!visualizerToggle) {
      if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (!analyser || !ctx || !canvas) return;

    analyser.getByteFrequencyData(dataArray);
    const width = (canvas.width = canvas.clientWidth);
    const height = (canvas.height = canvas.clientHeight);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-color")
      .trim();

    const barWidth = (width / dataArray.length) * 1.0;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * height;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  }

  /* Media setup */
  const mediaFiles = {
    empty_click: {
      type: "audio",
      subtype: "sfx_file",
      src: "assets/empty_click.mp3",

      volume: 0.6,
      currentTime: 0,
      loop: false,
    },
    button_click: {
      type: "audio",
      subtype: "sfx_file",
      src: "assets/button_click.mp3",

      volume: 0.4,
      loop: false,
    },
    terminal_beep: {
      type: "audio",
      subtype: "sfx_file",
      src: "assets/terminal_beep.wav",

      volume: 0.25,
      loop: false,
    },
    static_noise: {
      type: "audio",
      subtype: "sfx_file",
      src: "assets/theme_Folder/nightmare/static_noise.wav",
      volume: 0.4,
      loop: false,
    },
    nightmare_ambiance: {
      type: "audio",
      subtype: "sfx_file",
      src: "assets/theme_Folder/nightmare/silenthill_ambiance.wav",
      volume: 0.5,
      loop: true,
    },
  };

  /* Media Loading */
  async function loadFolderContents(path, type) {
    try {
      const response = await fetch(path);
      if (!response.ok) return;

      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");

      Array.from(doc.querySelectorAll("a")).forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || href.includes("..") || href.endsWith("/")) return;

        const fileName = decodeURIComponent(href.split("/").pop());
        const ext = fileName.split(".").pop().toLowerCase();
        const key = fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9]/g, "_");

        if (mediaFiles[key]) return;
        let newMedia = null;

        const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"];
        const videoExts = [
          "mp4",
          "webm",
          "mkv",
          "mov",
          "avi",
          "wmv",
          "flv",
          "m4v",
          "3gp",
        ];
        const imageExts = [
          "jpg",
          "jpeg",
          "png",
          "gif",
          "webp",
          "bmp",
          "svg",
          "ico",
          "tiff",
          "tif",
        ];

        if (type === "music" && audioExts.includes(ext)) {
          newMedia = {
            type: "audio",
            subtype: "media_file",
            src: `${path}/${fileName}`,
            volume: 0.5,
            loop: false,
            SectionImmunity: true,
            get title() {
              return fileName.split(".")[0];
            },
          };
        } else if (type === "media") {
          let mediaType = null;
          if (videoExts.includes(ext)) mediaType = "video";
          else if (audioExts.includes(ext)) mediaType = "audio";
          else if (imageExts.includes(ext)) mediaType = "image";

          if (mediaType) {
            newMedia = {
              type: mediaType,
              subtype: "media_file",
              src: `${path}/${fileName}`,
              volume: 0.5,
              loop: mediaType !== "image",

              get title() {
                return fileName.split(".")[0];
              },
            };

            /* Inject into Files Section UI */
            const filesSection = document.getElementById("files");
            if (filesSection) {
              const container =
                filesSection.querySelector(".file-grid") || filesSection;
              if (!container.querySelector(`[data-media="${key}"]`)) {
                const el = document.createElement("div");
                el.className = "file";
                el.dataset.media = key;
                el.innerHTML = `<div class="name">${fileName}</div>`;
                container.appendChild(el);
              }
            }
          }
        }

        if (newMedia) mediaFiles[key] = newMedia;
      });
    } catch (e) {
      console.warn("Auto-load failed for " + path, e);
    }
  }
  loadFolderContents("assets/music_Folder", "music");
  loadFolderContents("assets/media_Folder", "media");

  /* Change Section */
  async function changeSection(NavSelect) {
    const targetId = NavSelect.dataset.section;
    if (!targetId) return;

    const targetSection = document.getElementById(targetId);
    if (
      targetSection.classList.contains("active") &&
      NavSelect.classList.contains("active")
    )
      return;

    try {
      let playingMedia = null;
      if (activeMediaPlayer && activeMediaPlayer.sourceTitle) {
        playingMedia = Object.values(mediaFiles).find(
          (m) => m.title === activeMediaPlayer.sourceTitle,
        );
      }

      if (!playingMedia?.SectionImmunity) stopMedia();
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      document
        .getElementById(NavSelect.dataset.section)
        .classList.add("active");

      document.querySelectorAll(".navi a").forEach((link) => {
        link.classList.remove("active");
      });

      NavSelect.classList.add("active");
    } catch (error) {
      console.error("Error changing section:", error);
    }
  }

  /* Format Time */
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  /* Playlist Handler */
  function cycleMusic(direction = 0) {
    const playlist = Object.keys(mediaFiles).filter(
      (k) =>
        mediaFiles[k].subtype === "media_file" &&
        mediaFiles[k].type === "audio" &&
        mediaFiles[k].src.includes("music_Folder"),
    );
    if (!playlist.length) return;

    let currentIndex = -1;
    const currentSrc = musicPlayer.getAttribute("src");
    if (currentSrc) {
      currentIndex = playlist.findIndex((k) =>
        currentSrc.includes(mediaFiles[k].src),
      );
    }

    let nextIndex = currentIndex + direction;
    if (direction === 0 && currentIndex === -1) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      if (nextIndex >= playlist.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = playlist.length - 1;
    }

    const media = mediaFiles[playlist[nextIndex]];
    playMusic(media);
  }

  /* Play Media */
  async function playMedia(sourcedMedia, StopOthers = true, switchView = true) {
    if (sourcedMedia.subtype !== "media_file") {
      return playSfx(sourcedMedia);
    }

    if (autoStopMusic && !musicPlayer.paused) {
      musicPlayer.pause();
      if (homeBtnPlay) homeBtnPlay.textContent = "[PLAY]";
    }

    if (StopOthers) {
      if (sourcedMedia.type === "video" && activeMediaPlayer === audioPlayer) {
        audioPlayer.pause();
        audioPlayer.hidden = true;
      } else {
        stopMedia();
      }
    }

    document.getElementById("media-title").textContent =
      sourcedMedia.title + "." + sourcedMedia.src.split(".").pop();

    if (switchView) {
      sections.forEach((s) => s.classList.remove("active"));
      document.getElementById("media").classList.add("active");
    }
    mediaVisual.hidden = false;

    if (btnPlay) btnPlay.style.display = "";
    if (progressBar) progressBar.style.display = "";
    if (timeDisplay) timeDisplay.style.display = "";
    if (volSlider) volSlider.style.display = "";
    if (volLabel) volLabel.style.display = "";

    try {
      if (sourcedMedia.type === "image") {
        if (btnPlay) btnPlay.style.display = "none";
        if (progressBar) progressBar.style.display = "none";
        if (timeDisplay) timeDisplay.style.display = "none";
        if (volSlider) volSlider.style.display = "none";
        if (volLabel) volLabel.style.display = "none";

        const mediaTitle = document.getElementById("media-title");
        if (mediaTitle) mediaTitle.style.display = "";
        if (btnFullscreen) btnFullscreen.style.display = "";

        let imageViewer = document.getElementById("imageViewer");
        if (!imageViewer) {
          imageViewer = document.createElement("img");
          imageViewer.id = "imageViewer";
          imageViewer.style.maxWidth = "100%";
          imageViewer.style.maxHeight = "100%";
          imageViewer.style.objectFit = "contain";
          if (videoPlayer && videoPlayer.parentNode) {
            videoPlayer.parentNode.insertBefore(imageViewer, videoPlayer);
          } else {
            document.getElementById("media").appendChild(imageViewer);
          }
        }

        imageViewer.src = sourcedMedia.src;
        imageViewer.hidden = false;
        mediaVisual.textContent = "DISPLAYING IMAGE";

        activeMediaPlayer = {
          type: "image",
          paused: false,
          play: () => {},
          pause: () => {},
          currentTime: 0,
          duration: 0,
          volume: 1,
        };
        btnPlay.textContent = "[VIEWING]";
      } else if (sourcedMedia.type === "video") {
        activeMediaPlayer = videoPlayer;
        videoPlayer.hidden = false;
        videoPlayer.src = sourcedMedia.src;
        videoPlayer.sourceTitle = sourcedMedia.title;
        videoPlayer.loop = sourcedMedia.loop || false;
        videoPlayer.volume = sourcedMedia.volume || 0.5;
        videoPlayer.currentTime = sourcedMedia.currentTime || 0;

        mediaVisual.textContent = "PLAYING VIDEO STREAM";
        if (sourcedMedia.delay > 0) {
          mediaTimeout = setTimeout(() => {
            videoPlayer
              .play()
              .catch((e) => console.warn("Video playback interrupted", e));
          }, sourcedMedia.delay * 1000);
        } else {
          await videoPlayer
            .play()
            .catch((e) => console.warn("Video playback interrupted", e));
        }
      } else {
        activeMediaPlayer = audioPlayer;
        audioPlayer.hidden = false;
        audioPlayer.src = sourcedMedia.src;
        audioPlayer.sourceTitle = sourcedMedia.title;
        audioPlayer.loop = sourcedMedia.loop || false;
        audioPlayer.volume = sourcedMedia.volume || 0.5;
        audioPlayer.currentTime = sourcedMedia.currentTime || 0;

        mediaVisual.textContent = "PLAYING AUDIO STREAM";
        if (sourcedMedia.delay > 0) {
          mediaTimeout = setTimeout(() => {
            audioPlayer
              .play()
              .catch((e) => console.warn("Audio playback interrupted", e));
          }, sourcedMedia.delay * 1000);
        } else {
          await audioPlayer
            .play()
            .catch((e) => console.warn("Audio playback interrupted", e));
        }
      }

      if (activeMediaPlayer) {
        volSlider.value = activeMediaPlayer.volume;
        btnPlay.textContent = "[PAUSE]";
      }
    } catch (error) {
      console.error("Error playing media:", error);
    }
  }

  /* Play Music (Home Player) */
  async function playMusic(media) {
    musicPlayer.src = media.src;
    musicPlayer.volume = homeVolSlider
      ? homeVolSlider.value
      : media.volume || 0.5;
    musicPlayer.loop = false;

    if (homeMediaTitle)
      homeMediaTitle.textContent =
        media.title + "." + media.src.split(".").pop();

    await musicPlayer.play().catch((e) => console.warn(e));
    if (homeBtnPlay) homeBtnPlay.textContent = "[PAUSE]";
  }

  /* Play SFX */
  async function playSfx(sourcedMedia) {
    if (sourcedMedia.subtype !== "sfx_file") return playMedia(sourcedMedia);
    if (!sourcedMedia || !soundToggle) return;

    if (
      !clickToggle &&
      (sourcedMedia === mediaFiles.empty_click ||
        sourcedMedia === mediaFiles.button_click)
    )
      return;

    try {
      const sfx = new Audio(sourcedMedia.src);
      sfx.volume = sourcedMedia.volume || 0.5;
      sfx.currentTime = sourcedMedia.currentTime || 0;
      sfx.loop = sourcedMedia.loop || false;

      if (sourcedMedia.delay > 0) {
        setTimeout(() => {
          sfx.play().catch(() => {});
        }, sourcedMedia.delay * 1000);
      } else {
        await sfx.play();
      }
    } catch (error) {
      console.error("Error playing SFX:", error);
    }
  }

  /* Stop  Media */
  async function stopMedia(targets = "all") {
    try {
      if (mediaTimeout) {
        clearTimeout(mediaTimeout);
        mediaTimeout = null;
      }

      activeMediaPlayer = null;

      if (targets === "all") {
        targets = ["audio", "video"];
      } else if (!Array.isArray(targets)) {
        targets = [targets];
      }

      if (targets.includes("audio") && audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        audioPlayer.sourceTitle = null;
        audioPlayer.removeAttribute("src");
        audioPlayer.load();
        audioPlayer.hidden = true;

        if (typeof mediaVisual !== "undefined") {
          mediaVisual.hidden = true;
        }
      }

      if (targets.includes("video") && videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
        videoPlayer.sourceTitle = null;
        videoPlayer.removeAttribute("src");
        videoPlayer.load();
        videoPlayer.hidden = true;
      }

      const imageViewer = document.getElementById("imageViewer");
      if (imageViewer) {
        imageViewer.hidden = true;
      }

      progressFill.style.width = "0%";
      timeDisplay.textContent = "00:00 / 00:00";
      btnPlay.textContent = "[PLAY]";
    } catch (error) {
      console.error("Error stopping media:", error);
    }
  }

  /* Player UI Logic */
  function updateProgress() {
    if (!activeMediaPlayer) return;
    const current = activeMediaPlayer.currentTime;
    const duration = activeMediaPlayer.duration || 0;
    const percent = (current / duration) * 100 || 0;

    progressFill.style.width = `${percent}%`;
    timeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

    if (activeMediaPlayer.ended) {
      btnPlay.textContent = "[PLAY]";
    }
  }

  function updateMusicProgress() {
    const current = musicPlayer.currentTime;
    const duration = musicPlayer.duration || 0;
    const percent = (current / duration) * 100 || 0;

    if (homeProgressFill) homeProgressFill.style.width = `${percent}%`;
    if (homeTimeDisplay)
      homeTimeDisplay.textContent = `${formatTime(current)} / ${formatTime(duration)}`;

    if (musicPlayer.ended && !musicPlayer.loop) {
      cycleMusic(1);
    }
  }

  videoPlayer.addEventListener("timeupdate", updateProgress);
  audioPlayer.addEventListener("timeupdate", updateProgress);
  musicPlayer.addEventListener("timeupdate", updateMusicProgress);

  btnPlay.addEventListener("click", () => {
    if (!activeMediaPlayer) return;
    if (activeMediaPlayer.paused) {
      activeMediaPlayer.play();
      btnPlay.textContent = "[PAUSE]";
      if (homeBtnPlay) homeBtnPlay.textContent = "[PAUSE]";
    } else {
      activeMediaPlayer.pause();
      btnPlay.textContent = "[PLAY]";
    }
  });

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      const mediaContainer = document.getElementById("media");
      if (document.fullscreenElement === mediaContainer) {
        document.exitFullscreen();
      } else {
        mediaContainer.requestFullscreen().catch((e) => console.warn(e));
      }
    });
  }

  progressBar.addEventListener("click", (e) => {
    if (!activeMediaPlayer) return;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    activeMediaPlayer.currentTime = pos * activeMediaPlayer.duration;
  });

  volSlider.addEventListener("input", (e) => {
    if (activeMediaPlayer) {
      activeMediaPlayer.volume = e.target.value;
    }
  });

  /* Home Player Listeners */
  if (homeBtnPlay) {
    homeBtnPlay.addEventListener("click", () => {
      if (musicPlayer.paused) {
        if (!musicPlayer.src) cycleMusic(0);
        else musicPlayer.play();
        homeBtnPlay.textContent = "[PAUSE]";
      } else {
        musicPlayer.pause();
        homeBtnPlay.textContent = "[PLAY]";
      }
    });
  }
  if (homeProgressBar) {
    homeProgressBar.addEventListener("click", (e) => {
      const rect = homeProgressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      if (musicPlayer.duration) {
        musicPlayer.currentTime = pos * musicPlayer.duration;
      }
    });
  }
  if (homeVolSlider) {
    homeVolSlider.addEventListener("input", (e) => {
      musicPlayer.volume = e.target.value;
    });
  }
  if (homeBtnPrev) {
    homeBtnPrev.addEventListener("click", () => {
      cycleMusic(-1);
      playSfx(mediaFiles.button_click);
    });
  }
  if (homeBtnNext) {
    homeBtnNext.addEventListener("click", () => {
      cycleMusic(1);
      playSfx(mediaFiles.button_click);
    });
  }
  if (homeBtnLoop) {
    homeBtnLoop.addEventListener("click", () => {
      musicPlayer.loop = !musicPlayer.loop;
      homeBtnLoop.textContent = musicPlayer.loop ? "[LOOP: ON]" : "[LOOP: OFF]";
      playSfx(mediaFiles.button_click);
    });
  }

  /* Uptime Counter */
  let seconds = 0;
  setInterval(() => {
    seconds++;
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    const el = document.getElementById("uptime");
    if (el) el.textContent = `${h}:${m}:${s}`;
  }, 1000);

  /* Resource Monitor */
  setInterval(() => {
    const cpu = document.getElementById("cpu-fill");
    const mem = document.getElementById("mem-fill");
    const net = document.getElementById("net-fill");
    if (cpu) cpu.style.width = Math.floor(Math.random() * 60 + 20) + "%";
    if (mem) mem.style.width = Math.floor(Math.random() * 10 + 40) + "%";
    if (net) net.style.width = Math.floor(Math.random() * 80 + 10) + "%";
  }, 800);

  /* Ambiance Control */
  function startAmbiance() {
    if (!mediaFiles.computer_ambiance) return;
    if (!ambiancePlayer) {
      ambiancePlayer = new Audio(mediaFiles.computer_ambiance.src);
      ambiancePlayer.loop = true;
      ambiancePlayer.volume = mediaFiles.computer_ambiance.volume;
    }
    ambiancePlayer.play().catch((e) => console.warn("Ambiance play failed", e));
  }

  function stopAmbiance() {
    if (ambiancePlayer) {
      ambiancePlayer.pause();
      ambiancePlayer.currentTime = 0;
    }
  }

  /* Boot & Power Logic */
  async function runBootSequence() {
    // Reset state
    container.style.display = "none";
    container.classList.remove("crt-off");
    powerOffScreen.style.display = "none";
    loginScreen.style.display = "none";
    bootScreen.style.display = "flex";
    bootScreen.innerHTML = "";
    startAmbiance();

    const lines = [
      "INITIALIZING...",
      "LOADING ASSETS...",
      "CHECKING INTEGRITY...",
      "ESTABLISHING CONNECTION...",
      "SYSTEM READY.",
    ];

    for (const line of lines) {
      const div = document.createElement("div");
      div.className = "boot-line";
      div.textContent = "> " + line;
      bootScreen.appendChild(div);
      playSfx(mediaFiles.empty_click);
      await new Promise((r) => setTimeout(r, 200));
    }

    await new Promise((r) => setTimeout(r, 400));
    bootScreen.style.display = "none";

    if (!hasAuthenticated) {
      loginScreen.style.display = "flex";
      loginUser.value = "";
      loginPass.value = "";
      loginUser.focus();
    } else {
      container.style.display = "grid";
      cycleMusic(0);
      container.classList.add("crt-on");
      changeSection(document.getElementById("nav-home"));
      setTimeout(() => {
        container.classList.remove("crt-on");
      }, 1000);
    }
  }

  /* Starfield Animation */
  function stopStarfield() {
    if (starfieldAnimationId) {
      cancelAnimationFrame(starfieldAnimationId);
      starfieldAnimationId = null;
    }
    const canvas = document.getElementById("starfield-canvas");
    if (canvas) canvas.style.display = "none";
  }

  function startStarfield() {
    const canvas = document.getElementById("starfield-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    canvas.style.display = "block";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = [];
    const numStars = 300;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        speed: Math.random() * 0.5 + 0.1,
      });
    }

    function animate() {
      starfieldAnimationId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

      for (const star of stars) {
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    animate();
  }

  /* Theme Manager */
  function setTheme(themeName) {
    const root = document.documentElement;
    const logo = document.querySelector(".home-image");
    const bgVideo = document.getElementById("theme-bg-video");
    const bgImage = document.getElementById("theme-bg-image");

    document.body.classList.remove("theme-nightmare", "theme-space");
    toggleNightmareText(false);
    document.getElementById("shakeToggle").style.display = "none";
    if (bgVideo) {
      bgVideo.pause();
      bgVideo.removeAttribute("src");
      bgVideo.style.display = "none";
    }
    if (bgImage) {
      bgImage.style.display = "none";
    }
    stopStarfield();
    stopAmbiance();

    const defaultLogo = "assets/theme_Folder/default/logo_sync.gif";
    if (logo) logo.src = defaultLogo;

    currentTheme = themeName;
    document.getElementById("themeState").textContent = themeName;

    if (themeName === "green") {
      root.style.setProperty("--primary-rgb", "156, 255, 156");
      root.style.setProperty("--theme-hue", "85deg");
    } else if (themeName === "amber") {
      root.style.setProperty("--primary-rgb", "255, 184, 108");
      root.style.setProperty("--theme-hue", "-15deg");
    } else if (themeName === "purple") {
      root.style.setProperty("--primary-rgb", "189, 147, 249");
      root.style.setProperty("--theme-hue", "200deg");
    } else if (themeName === "space") {
      root.style.setProperty("--primary-rgb", "139, 233, 253");
      root.style.setProperty("--theme-hue", "130deg");
      document.body.classList.add("theme-space");
      logo.src = "assets/theme_Folder/space/logo_sync.gif";
      startStarfield();
    } else if (themeName === "nightmare") {
      root.style.setProperty("--primary-rgb", "180, 50, 50");
      root.style.setProperty("--theme-hue", "0deg");
      document.body.classList.add("theme-nightmare");
      toggleNightmareText(true);
      document.getElementById("shakeToggle").style.display = "block";

      if (mediaFiles.nightmare_ambiance) {
        ambiancePlayer = new Audio(mediaFiles.nightmare_ambiance.src);
        ambiancePlayer.loop = true;
        ambiancePlayer.volume = mediaFiles.nightmare_ambiance.volume;
        ambiancePlayer.play().catch((e) => {});
      }
    }
  }

  function completeLogin() {
    hasAuthenticated = true;
    const user = loginUser.value.trim() || "guest";
    const pass = loginPass.value.trim();
    const isNightmare = user.toLowerCase() === "nightmare" && pass === "666";

    loginScreen.style.display = "none";
    container.style.display = "grid";
    container.classList.add("crt-on");

    if (isNightmare) {
      godModeUnlocked = true;
      document.getElementById("userDisplay").textContent = "NIGHTMARE";
      setTheme("nightmare");
      playMusic(mediaFiles.static_noise);
      musicPlayer.loop = true;
      if (homeBtnLoop) homeBtnLoop.textContent = "[LOOP: ON]";
    } else {
      document.getElementById("userDisplay").textContent = user;
      playSfx(mediaFiles.terminal_beep);
      cycleMusic(0);
    }

    changeSection(document.getElementById("nav-home"));
    setTimeout(() => {
      container.classList.remove("crt-on");
    }, 1000);
  }

  function runPowerOff() {
    stopMedia();
    musicPlayer.pause();
    musicPlayer.removeAttribute("src");
    stopAmbiance();
    playSfx(mediaFiles.terminal_beep);
    container.classList.add("crt-off");

    hasAuthenticated = false;
    godModeUnlocked = false;
    loginUser.value = "";
    loginPass.value = "";

    setTheme("green");
    musicPlayer.loop = false;
    if (homeBtnLoop) homeBtnLoop.textContent = "[LOOP: OFF]";

    document.querySelectorAll("[data-setting-tab]").forEach((t) => {
      t.classList.remove("active");
      t.style.color = "";
      if (t.dataset.settingTab === "audio") {
        t.classList.add("active");
        t.style.color = "var(--primary-color)";
      }
    });
    document.querySelectorAll(".settings-tab-content").forEach((c) => {
      c.style.display = "none";
    });
    const audioSettings = document.getElementById("settings-audio");
    if (audioSettings) audioSettings.style.display = "block";

    setTimeout(() => {
      container.style.display = "none";
      powerOffScreen.style.display = "flex";
    }, 600);
  }

  powerButton.addEventListener("click", () => {
    runBootSequence();
  });

  btnLogin.addEventListener("click", completeLogin);
  loginPass.addEventListener("keypress", (e) => {
    if (e.key === "Enter") completeLogin();
  });
  loginUser.addEventListener("keypress", (e) => {
    if (e.key === "Enter") loginPass.focus();
  });

  /* Input Handler */
  document.addEventListener("click", (object) => {
    if (!isVisualizerInit) initVisualizer();
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (container.style.display === "none") return;

    /* Navigation */
    const navSelect = object.target.closest(".navi a[data-section]");
    if (navSelect) {
      object.preventDefault();
      changeSection(navSelect);
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Files */
    const mediaFile = object.target.closest(".file[data-media]");
    if (mediaFile) {
      object.preventDefault();
      const mediaKey = mediaFile.dataset.media;
      if (mediaFiles[mediaKey]) {
        if (
          activeMediaPlayer &&
          activeMediaPlayer.sourceTitle === mediaFiles[mediaKey].title
        ) {
          if (activeMediaPlayer.paused) {
            activeMediaPlayer.play().catch((e) => console.error(e));
            btnPlay.textContent = "[PAUSE]";
            if (homeBtnPlay) homeBtnPlay.textContent = "[PAUSE]";
          }
          sections.forEach((s) => s.classList.remove("active"));
          document.getElementById("media").classList.add("active");
          return;
        }
        playMedia(mediaFiles[mediaKey]);
        playSfx(mediaFiles.button_click);
      }
      return;
    }

    /* Settings Tabs */
    const settingTab = object.target.closest("[data-setting-tab]");
    if (settingTab) {
      document.querySelectorAll("[data-setting-tab]").forEach((t) => {
        t.classList.remove("active");
        t.style.color = "";
      });
      settingTab.classList.add("active");
      settingTab.style.color = "var(--primary-color)";

      document
        .querySelectorAll(".settings-tab-content")
        .forEach((c) => (c.style.display = "none"));
      const targetId = "settings-" + settingTab.dataset.settingTab;
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.style.display = "block";

      playSfx(mediaFiles.button_click);
      return;
    }

    /* Sound Toggle */
    const soundCheck = object.target.closest("#soundToggle");
    if (soundCheck) {
      soundToggle = !soundToggle;
      audioPlayer.muted = !soundToggle;
      videoPlayer.muted = !soundToggle;
      musicPlayer.muted = !soundToggle;
      if (ambiancePlayer) ambiancePlayer.muted = !soundToggle;
      document.getElementById("soundState").textContent = soundToggle
        ? "enabled"
        : "disabled";

      playSfx(mediaFiles.button_click);
      return;
    }

    /* Click SFX Toggle */
    const clickCheck = object.target.closest("#clickToggle");
    if (clickCheck) {
      clickToggle = !clickToggle;
      document.getElementById("clickState").textContent = clickToggle
        ? "enabled"
        : "disabled";
      if (clickToggle) playSfx(mediaFiles.button_click);
      return;
    }

    /* Auto Stop Toggle */
    const autoStopCheck = object.target.closest("#autoStopToggle");
    if (autoStopCheck) {
      autoStopMusic = !autoStopMusic;
      document.getElementById("autoStopState").textContent = autoStopMusic
        ? "enabled"
        : "disabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Shake Toggle */
    const shakeCheck = object.target.closest("#shakeToggle");
    if (shakeCheck) {
      document.body.classList.toggle("no-shake");
      document.getElementById("shakeState").textContent =
        document.body.classList.contains("no-shake") ? "disabled" : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Theme Toggle */
    const themeCheck = object.target.closest("#themeToggle");
    if (themeCheck) {
      if (currentTheme === "green") {
        setTheme("amber");
      } else if (currentTheme === "amber") {
        setTheme("purple");
      } else if (currentTheme === "purple") {
        setTheme("space");
      } else if (currentTheme === "space") {
        if (godModeUnlocked) setTheme("nightmare");
        else setTheme("green");
      } else {
        setTheme("green");
      }
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Overlay Toggle */
    const overlayCheck = object.target.closest("#overlayToggle");
    if (overlayCheck) {
      document.body.classList.toggle("no-overlay");
      document.getElementById("overlayState").textContent =
        document.body.classList.contains("no-overlay") ? "disabled" : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Scanlines Toggle */
    const scanlinesCheck = object.target.closest("#scanlinesToggle");
    if (scanlinesCheck) {
      document.body.classList.toggle("no-scanlines");
      document.getElementById("scanlinesState").textContent =
        document.body.classList.contains("no-scanlines")
          ? "disabled"
          : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Glitch Toggle */
    const glitchCheck = object.target.closest("#glitchToggle");
    if (glitchCheck) {
      document.body.classList.toggle("no-glitch");
      document.getElementById("glitchState").textContent =
        document.body.classList.contains("no-glitch") ? "disabled" : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Grayscale Toggle */
    const grayscaleCheck = object.target.closest("#grayscaleToggle");
    if (grayscaleCheck) {
      document.body.classList.toggle("no-grayscale");
      document.getElementById("grayscaleState").textContent =
        document.body.classList.contains("no-grayscale")
          ? "disabled"
          : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* RGB Toggle */
    const rgbCheck = object.target.closest("#rgbToggle");
    if (rgbCheck) {
      document.body.classList.toggle("no-rgb");
      document.getElementById("rgbState").textContent =
        document.body.classList.contains("no-rgb") ? "disabled" : "enabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Visualizer Toggle */
    const visCheck = object.target.closest("#visToggle");
    if (visCheck) {
      visualizerToggle = !visualizerToggle;
      document.getElementById("visState").textContent = visualizerToggle
        ? "enabled"
        : "disabled";
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Fullscreen Toggle */
    const fullscreenCheck = object.target.closest("#fullscreenToggle");
    if (fullscreenCheck) {
      if (!document.fullscreenElement) {
        document.documentElement
          .requestFullscreen()
          .catch((e) => console.warn(e));
      } else {
        document.exitFullscreen();
      }
      playSfx(mediaFiles.button_click);
      return;
    }

    /* Power Off */
    const exitLink = object.target.closest("#exitLink");
    if (exitLink) {
      object.preventDefault();
      runPowerOff();
      return;
    }

    /* Prevent empty click on interactive elements */
    if (
      object.target.closest(
        "button, input, .btn, .progress-bar, #btnPurge, .home-image",
      )
    )
      return;

    /* Normal Click */
    playSfx(mediaFiles.empty_click);
  });

  /* Purge Button */
  if (btnPurge) {
    btnPurge.addEventListener("click", () => {
      playSfx(mediaFiles.button_click);
      btnPurge.textContent = "▸ [ PURGING... ]";

      setTimeout(() => {
        playSfx(mediaFiles.empty_click);
        btnPurge.textContent = "▸ [ CACHE_CLEARED ]";

        setTimeout(() => {
          btnPurge.textContent = "▸ [ PURGE_MEMORY_CACHE ]";
        }, 2000);
      }, 1000);
    });
  }

  function toggleNightmareText(enable) {
    const navHome = document.getElementById("nav-home");
    const navFiles = document.getElementById("nav-files");
    const navSettings = document.getElementById("nav-settings");
    const statusText = document.getElementById("statusText");
    const homeMainText = document.getElementById("homeMainText");
    const homeTitle = document.querySelector("#home .window-title");

    navHome.textContent = enable ? "VOID" : "Home";
    navFiles.textContent = enable ? "SECRETS" : "Files";
    navSettings.textContent = enable ? "CONTROL" : "Settings";
    statusText.textContent = enable ? "TRAPPED" : "connected";
    homeMainText.textContent = enable
      ? "no escape. no escape. shadow's is coming... no escape. no escape."
      : "the kamui-files are real. open your eyes";
    if (homeTitle) homeTitle.textContent = enable ? "PURGATORY" : "home.txt";
  }

  const logoImg = document.querySelector(".home-image");
  if (logoImg) {
    logoImg.addEventListener("click", () => {
      playSfx(mediaFiles.button_click);
      logoImg.style.transform = "scale(1.2) rotate(5deg)";
      setTimeout(() => (logoImg.style.transform = "none"), 200);
    });
  }

  document.addEventListener("fullscreenchange", () => {
    const el = document.getElementById("fullscreenState");
    if (el)
      el.textContent = document.fullscreenElement ? "fullscreen" : "windowed";
  });

  window.addEventListener("resize", () => {
    if (currentTheme === "space") {
      stopStarfield();
      startStarfield();
    }
  });
});
