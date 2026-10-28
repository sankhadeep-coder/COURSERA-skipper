// ==UserScript==
// @name         Coursera Auto-Pilot
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Auto-clicks Continue learning, Skip, and jumps videos to the end on Coursera
// @author       You
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

  const TARGET_TEXTS = [
    "Continue learning",
    "Continue Learning",
    "Skip",
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

  // =====================
  // AUTO-CLICK BUTTONS
  // =====================
  function tryAutoClick() {
    const allElements = document.querySelectorAll("*");
    for (const el of allElements) {
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent.trim())
        .join("")
        .trim();
      const innerText = (el.innerText || "").trim();
      for (const target of TARGET_TEXTS) {
        if (directText === target || (innerText === target && el.children.length === 0)) {
          if (isVisible(el)) {
            console.log(`${LOG_PREFIX} Found "${target}" — clicking!`);
            setTimeout(() => {
              el.click();
              el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
              console.log(`${LOG_PREFIX} ✅ Clicked "${target}"`);
            }, CLICK_DELAY_MS);
            return true;
          }
        }
      }
    }
    for (const target of TARGET_TEXTS) {
      const xpath = `//*[normalize-space(text())='${target}']`;
      const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        if (isVisible(node)) {
          setTimeout(() => {
            node.click();
            node.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
          }, CLICK_DELAY_MS);
          return true;
        }
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
        console.log(`${LOG_PREFIX} ⚠️ Seek failed, retrying...`);
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
          console.log(
            `${LOG_PREFIX} ⚠️ Seek didn't hold (at ${current.toFixed(1)}s, wanted ${targetTime.toFixed(1)}s). Retry ${retryCount}/${MAX_RETRIES}`
          );
          if (retryCount < MAX_RETRIES) {
            setTimeout(attemptSeek, 1000);
          }
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
        if (iframeDoc) {
          iframeDoc.querySelectorAll("video").forEach((v) => videos.push(v));
        }
      } catch (e) {}
    });
    return videos;
  }

  function checkForVideos() {
    const videos = findAllVideos();
    for (const video of videos) {
      if (!handledVideos.has(video)) {
        skipVideo(video);
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
      console.log(`${LOG_PREFIX} 🔄 URL changed — scanning for new videos`);
      setTimeout(checkForVideos, 1500);
      setTimeout(checkForVideos, 3000);
      setTimeout(checkForVideos, 5000);
    }
  }, 500);

  // =====================
  // OBSERVERS & POLLING
  // =====================
  const observer = new MutationObserver(() => {
    setTimeout(() => {
      tryAutoClick();
      checkForVideos();
    }, CLICK_DELAY_MS);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(() => {
    tryAutoClick();
    checkForVideos();
  }, CHECK_INTERVAL_MS);

  setTimeout(() => { tryAutoClick(); checkForVideos(); }, 1000);
  setTimeout(checkForVideos, 2000);
  setTimeout(checkForVideos, 4000);

  console.log(`${LOG_PREFIX} 🚀 Script loaded — auto-skipping videos & dismissing popups`);
})();
