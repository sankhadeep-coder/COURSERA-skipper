// ==UserScript==
// @name         Coursera Auto-Pilot
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Auto-clicks Continue learning, Skip, Start, Mark as completed, and Go to next item on Coursera
// @author       sankhadeep-coder
// @match        https://www.coursera.org/*
// @match        https://*.coursera.org/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  const LOG_PREFIX = "[Coursera Bot]";
  const CHECK_INTERVAL_MS = 1000;
  const CLICK_DELAY_MS = 300;
  const SKIP_BEFORE_END = 7;

  // Buttons to auto-click immediately (popups & overlays)
  const TARGET_TEXTS = [
    "Continue learning",
    "Continue Learning",
    "Skip",
    "Start",
  ];

  const handledVideos = new WeakSet();

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  /**
   * Find a visible clickable element by its exact text.
   * Returns the element or null.
   */
  function findButtonByText(text) {
    // CSS selector search
    const allElements = document.querySelectorAll("*");
    for (const el of allElements) {
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join("")
        .trim();
      const innerText = (el.innerText || "").trim();
      if (directText === text || (innerText === text && el.children.length === 0)) {
        if (isVisible(el)) return el;
      }
    }
    // XPath fallback
    const xpath = `//*[normalize-space(text())='${text}']`;
    const result = document.evaluate(
      xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i);
      if (isVisible(node)) return node;
    }
    return null;
  }

  function clickElement(el, label) {
    el.click();
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    console.log(`${LOG_PREFIX} ✅ Clicked "${label}"`);
  }

  // =====================
  // AUTO-CLICK BUTTONS (popups)
  // =====================
  function tryAutoClick() {
    for (const target of TARGET_TEXTS) {
      const el = findButtonByText(target);
      if (el) {
        console.log(`${LOG_PREFIX} Found "${target}" — clicking!`);
        setTimeout(() => clickElement(el, target), CLICK_DELAY_MS);
        return true;
      }
    }
    return false;
  }

  // =====================
  // AUTO-SKIP VIDEO TO END
  // =====================
  function skipVideo(video) {
    if (handledVideos.has(video)) return;
    handledVideos.add(video);

    let seekDone = false;
    let retryCount = 0;
    const MAX_RETRIES = 60;

    function attemptSeek() {
      if (seekDone) return;
      retryCount++;

      const dur = video.duration;
      if (!dur || !isFinite(dur) || dur <= 0) {
        if (retryCount < MAX_RETRIES) {
          console.log(`${LOG_PREFIX} ⏳ Waiting for duration... (attempt ${retryCount})`);
          setTimeout(attemptSeek, 1000);
        }
        return;
      }

      const targetTime = Math.max(dur - SKIP_BEFORE_END, 0);
      try {
        video.currentTime = targetTime;
      } catch (e) {
        if (retryCount < MAX_RETRIES) setTimeout(attemptSeek, 1000);
        return;
      }

      setTimeout(() => {
        if (seekDone) return;
        const current = video.currentTime;
        if (current >= targetTime - 2) {
          seekDone = true;
          video.play().catch(() => {});
          console.log(`${LOG_PREFIX} ⏩ SUCCESS! Jumped to ${current.toFixed(1)}s / ${dur.toFixed(1)}s`);
        } else {
          console.log(`${LOG_PREFIX} ⚠️ Seek didn't hold. Retry ${retryCount}/${MAX_RETRIES}`);
          if (retryCount < MAX_RETRIES) setTimeout(attemptSeek, 1000);
        }
      }, 500);
    }

    video.addEventListener("loadedmetadata", () => setTimeout(attemptSeek, 500), { once: true });
    video.addEventListener("loadeddata", () => setTimeout(attemptSeek, 500), { once: true });
    video.addEventListener("canplay", () => setTimeout(attemptSeek, 500), { once: true });
    video.addEventListener("playing", () => setTimeout(attemptSeek, 1000), { once: true });
    setTimeout(attemptSeek, 1000);
    setTimeout(attemptSeek, 2000);
    setTimeout(attemptSeek, 4000);
  }

  function findAllVideos() {
    const videos = [];
    document.querySelectorAll("video").forEach((v) => videos.push(v));
    document.querySelectorAll("iframe").forEach((iframe) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) iframeDoc.querySelectorAll("video").forEach((v) => videos.push(v));
      } catch (e) {}
    });
    return videos;
  }

  function checkForVideos() {
    const videos = findAllVideos();
    for (const video of videos) {
      if (!handledVideos.has(video)) skipVideo(video);
    }
  }

  // =====================
  // AUDIO / READING PAGE HANDLER
  // =====================
  let markAsCompletedClicked = false;
  let lastPageUrl = "";

  function isAudioOrReadingPage() {
    // Detect audio player: look for <audio> element or audio player UI
    const hasAudioElement = document.querySelector("audio") !== null;

    // Detect audio player bar (Coursera's custom player with time like "1:04 / 4:32")
    const hasAudioPlayerUI = !!document.querySelector(
      '[aria-label="audio player"], [data-testid="audio-player"], [class*="audio-player"], [class*="AudioPlayer"]'
    );

    // Detect reading page: sidebar shows "Reading" label for current item
    const sidebarItems = document.querySelectorAll('[class*="SidebarItem"], [class*="sidebar"], li[role="treeitem"]');
    let isReadingPage = false;
    for (const item of sidebarItems) {
      const text = item.textContent || "";
      if ((text.includes("Reading") || text.includes("reading")) && item.querySelector('[class*="active"], [aria-current="page"], [class*="Selected"]')) {
        isReadingPage = true;
        break;
      }
    }

    // Also check if "Mark as completed" button exists — strong signal this is a reading/audio page
    const hasMarkComplete = findButtonByText("Mark as completed") !== null;

    return hasAudioElement || hasAudioPlayerUI || isReadingPage || hasMarkComplete;
  }

  function handleAudioReadingPage() {
    // Reset state on URL change
    if (location.href !== lastPageUrl) {
      lastPageUrl = location.href;
      markAsCompletedClicked = false;
    }

    if (!isAudioOrReadingPage()) return;

    // Step 1: Find and click "Mark as completed"
    if (!markAsCompletedClicked) {
      const markBtn = findButtonByText("Mark as completed");
      if (markBtn) {
        // Scroll the button into view first
        markBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        console.log(`${LOG_PREFIX} 📖 Audio/Reading page — scrolling to "Mark as completed"`);

        setTimeout(() => {
          clickElement(markBtn, "Mark as completed");
          markAsCompletedClicked = true;
          console.log(`${LOG_PREFIX} ✅ Marked as completed — waiting before clicking "Go to next item"`);

          // Step 2: After marking complete, wait and click "Go to next item"
          setTimeout(() => {
            const goNextBtn =
              findButtonByText("Go to next item") ||
              findButtonByText("Go To Next Item");
            if (goNextBtn) {
              goNextBtn.scrollIntoView({ behavior: "smooth", block: "center" });
              setTimeout(() => {
                clickElement(goNextBtn, "Go to next item");
              }, 500);
            } else {
              console.log(`${LOG_PREFIX} ⏳ "Go to next item" not found yet, will retry...`);
            }
          }, 2000);
        }, 1000);
        return;
      }
    }

    // If already marked complete, keep trying "Go to next item"
    if (markAsCompletedClicked) {
      // Check if "Completed" text is visible (confirmation)
      const completedVisible =
        document.body.innerText.includes("Completed") ||
        document.body.innerText.includes("✓ Completed");

      if (completedVisible) {
        const goNextBtn =
          findButtonByText("Go to next item") ||
          findButtonByText("Go To Next Item");
        if (goNextBtn) {
          goNextBtn.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => clickElement(goNextBtn, "Go to next item"), 500);
        }
      }
    }
  }

  // =====================
  // AUDIO SKIP TO END
  // =====================
  const handledAudios = new WeakSet();

  function skipAudioToEnd() {
    const audios = document.querySelectorAll("audio");
    for (const audio of audios) {
      if (handledAudios.has(audio)) continue;

      function doSkip() {
        if (audio.duration && isFinite(audio.duration) && audio.duration > SKIP_BEFORE_END) {
          handledAudios.add(audio);
          audio.currentTime = audio.duration - SKIP_BEFORE_END;
          audio.play().catch(() => {});
          console.log(`${LOG_PREFIX} 🔊 Skipped audio to ${(audio.duration - SKIP_BEFORE_END).toFixed(1)}s / ${audio.duration.toFixed(1)}s`);
        }
      }

      if (audio.readyState >= 1 && audio.duration > 0) {
        doSkip();
      } else {
        audio.addEventListener("loadedmetadata", doSkip, { once: true });
        audio.addEventListener("canplay", doSkip, { once: true });
        // Poll fallback
        let attempts = 0;
        const poll = setInterval(() => {
          attempts++;
          if (handledAudios.has(audio) || attempts > 30) { clearInterval(poll); return; }
          if (audio.duration && isFinite(audio.duration) && audio.duration > SKIP_BEFORE_END) {
            clearInterval(poll);
            doSkip();
          }
        }, 1000);
      }
    }
  }

  // =====================
  // URL CHANGE DETECTION
  // =====================
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      markAsCompletedClicked = false;
      console.log(`${LOG_PREFIX} 🔄 URL changed — scanning for new content`);
      setTimeout(() => { checkForVideos(); skipAudioToEnd(); }, 1500);
      setTimeout(() => { checkForVideos(); skipAudioToEnd(); }, 3000);
      setTimeout(() => { checkForVideos(); skipAudioToEnd(); }, 5000);
    }
  }, 500);

  // =====================
  // MAIN LOOP
  // =====================
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      tryAutoClick();
      checkForVideos();
      skipAudioToEnd();
      handleAudioReadingPage();
    }, CLICK_DELAY_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(() => {
    tryAutoClick();
    checkForVideos();
    skipAudioToEnd();
    handleAudioReadingPage();
  }, CHECK_INTERVAL_MS);

  // Initial checks
  setTimeout(() => { tryAutoClick(); checkForVideos(); skipAudioToEnd(); handleAudioReadingPage(); }, 1000);
  setTimeout(() => { checkForVideos(); skipAudioToEnd(); handleAudioReadingPage(); }, 2000);
  setTimeout(() => { checkForVideos(); skipAudioToEnd(); handleAudioReadingPage(); }, 4000);

  console.log(`${LOG_PREFIX} 🚀 v2.0 loaded — auto-skipping videos, audio, readings & popups`);
})();
