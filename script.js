/* Tushar Magar — portfolio interactions */

(() => {
    document.addEventListener("DOMContentLoaded", init);

    function init() {
        bindWorkDisclosures();
        bindProjectDisclosures();
        bindAchievementDisclosures();
        bindMoreProjects();
        bindAmbient();
        bindScrollNav();
        initBeatGlyphs();
    }

    /* ================================================================
       Nav reveal — hidden on first paint, slides in once the visitor
       scrolls past the hero, hides again when they return to the top.
       ================================================================ */
    function bindScrollNav() {
        const nav = document.querySelector(".nav");
        if (!nav) return;
        const SHOW_AT = 80;
        const HIDE_AT = 30;
        let visible = false;
        const check = () => {
            const y = window.scrollY;
            if (!visible && y > SHOW_AT) {
                nav.classList.add("is-visible");
                visible = true;
            } else if (visible && y < HIDE_AT) {
                nav.classList.remove("is-visible");
                visible = false;
            }
        };
        window.addEventListener("scroll", check, { passive: true });
        check();
    }

    /* ================================================================
       Hero name — character glyph swaps on beat 2 of each 4-beat bar
       (124 BPM track). The pulse always runs (even if audio is blocked),
       and snaps to the ambient audio playhead whenever music is playing,
       so unlock delays do not permanently desync it.
       ================================================================ */
    /* Glyphs are restricted to characters that render at the same
       width as Departure Mono's base cell. Circled / script /
       blackboard variants were causing the name to shimmer in width. */
    const HERO_GLYPHS = {
        T: ["7", "†", "+", "⊤", "Ť"],
        U: ["µ", "ʉ", "Ǔ", "Ü", "Û"],
        S: ["5", "$", "§", "Š", "ƨ"],
        H: ["#", "♯", "Ĥ", "Ḣ"],
        A: ["4", "@", "Å", "Ä", "Â"],
        B: ["8", "ß", "฿"],
        C: ["(", "¢", "Č"],
        E: ["3", "€", "Ē"],
        I: ["1", "!", "|"],
        J: [";", "ʝ", "Ĵ"],
        N: ["∩", "И", "Ň"],
        O: ["0", "°", "Ø"],
        P: ["¶", "Þ", "ρ"],
        R: ["₹", "®", "Я", "Ŕ", "Ʀ"],
        V: ["∨", "Ṽ", "v"],
        M: ["₥", "ʍ", "Ṁ"],
        G: ["6", "9", "©", "Ġ", "Ĝ"],
    };

    const BPM = 124;
    const BEAT_MS = 60000 / BPM;          // ~484
    const PULSE_CYCLE_BEATS = 4;
    const PULSE_ON_BEAT = 2;              // 1-based index within each 4-beat cycle
    const HOLD_MS = Math.round(BEAT_MS);          // ~484ms — one full beat

    /* Beat glyph targets are marked explicitly in HTML. */
    const BEAT_HEADING_SELECTORS = "[data-beat-glyph]";

    function wrapFirstTextNode(el) {
        // Find the first text node child (skip already-wrapped containers)
        let first = null;
        for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.length) {
                first = node;
                break;
            }
        }
        if (!first) return false;
        const text = first.nodeValue;
        const frag = document.createDocumentFragment();
        for (const c of text) {
            const span = document.createElement("span");
            span.className = "ch" + (c === " " ? " ch--space" : "");
            span.dataset.target = c;
            span.textContent = c;
            frag.appendChild(span);
        }
        el.replaceChild(frag, first);
        return true;
    }

    function initBeatGlyphs() {
        const containers = Array.from(document.querySelectorAll(BEAT_HEADING_SELECTORS));
        if (!containers.length) return;

        containers.forEach(wrapFirstTextNode);

        const pulse = () => {
            containers.forEach(container => {
                const eligible = Array.from(container.querySelectorAll(":scope > .ch"))
                    .filter(c => {
                        const t = c.dataset.target;
                        return t && HERO_GLYPHS[t.toUpperCase()] && c.textContent === t;
                    });
                if (!eligible.length) return;

                const role = container.getAttribute("data-beat-glyph");
                const desiredSwaps = role === "hero" ? (Math.random() < 0.5 ? 3 : 4) : (3 + Math.floor(Math.random() * 3));
                const n = Math.min(eligible.length, desiredSwaps);
                const pool = eligible.slice();
                for (let i = 0; i < n; i++) {
                    const idx = Math.floor(Math.random() * pool.length);
                    const ch = pool.splice(idx, 1)[0];
                    const target = ch.dataset.target;
                    const isLower = target === target.toLowerCase() && target !== target.toUpperCase();
                    const variants = HERO_GLYPHS[target.toUpperCase()];
                    let variant = variants[Math.floor(Math.random() * variants.length)];
                    if (isLower) variant = variant.toLowerCase();

                    ch.textContent = variant;
                    ch.style.color = "var(--accent)";
                    setTimeout(() => {
                        if (ch.textContent === variant) {
                            ch.textContent = target;
                            ch.style.color = "";
                        }
                    }, HOLD_MS);
                }
            });
        };

        const audio = document.getElementById("ambient-audio");
        let rafId = 0;
        let lastBeatIndex = -1;
        let lastClock = "";
        let fallbackEpochMs = performance.now();

        const isAudioClockActive = () =>
            !!audio && !audio.paused && !audio.ended && Number.isFinite(audio.currentTime);

        const getAudioBeatIndex = () => Math.floor((audio.currentTime * 1000) / BEAT_MS);
        const getFallbackBeatIndex = () => Math.floor((performance.now() - fallbackEpochMs) / BEAT_MS);

        // Keep fallback timeline continuous when we switch back from audio clock.
        const alignFallbackToBeat = (beatIndex) => {
            fallbackEpochMs = performance.now() - (Math.max(0, beatIndex) * BEAT_MS);
        };

        const getClockState = () => {
            if (isAudioClockActive()) {
                return { clock: "audio", beatIndex: getAudioBeatIndex() };
            }
            return { clock: "fallback", beatIndex: getFallbackBeatIndex() };
        };

        const tick = () => {
            const { clock, beatIndex } = getClockState();

            if (clock !== lastClock) {
                if (clock === "fallback") alignFallbackToBeat(lastBeatIndex);
                lastClock = clock;
                lastBeatIndex = beatIndex;
            } else if (beatIndex > lastBeatIndex) {
                for (let b = lastBeatIndex + 1; b <= beatIndex; b++) {
                    // Pulse on beat 2 in each 4-beat cycle: - ! - - .
                    if (b >= 0 && b % PULSE_CYCLE_BEATS === PULSE_ON_BEAT - 1) pulse();
                }
                lastBeatIndex = beatIndex;
            } else if (beatIndex < lastBeatIndex) {
                // Handle seeks/restarts without replaying historical pulses.
                lastBeatIndex = beatIndex;
            }

            rafId = window.requestAnimationFrame(tick);
        };

        const start = () => {
            if (rafId) return;
            const { clock, beatIndex } = getClockState();
            lastClock = clock;
            lastBeatIndex = beatIndex;
            rafId = window.requestAnimationFrame(tick);
        };

        start();
    }

    /* ================================================================
       Work / experience disclosures
       ================================================================ */
    function bindWorkDisclosures() {
        document.querySelectorAll(".work__item").forEach(item => {
            const btn = item.querySelector(".disclose");
            if (!btn) return;
            btn.addEventListener("click", () => {
                const open = item.classList.toggle("is-open");
                btn.setAttribute("aria-expanded", String(open));
                btn.firstChild.textContent = open ? "Less " : "More ";
            });
        });
    }

    /* ================================================================
       Project rows
       ================================================================ */
    function bindProjectDisclosures() {
        document.querySelectorAll(".project__head").forEach(head => {
            const project = head.closest(".project");
            const toggle = () => {
                const open = project.classList.toggle("is-open");
                head.setAttribute("aria-expanded", String(open));
                if (open) loadImagesIn(project);
            };
            head.addEventListener("click", toggle);
            head.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            });
        });
    }

    function bindMoreProjects() {
        const btn = document.getElementById("view-more-btn");
        const more = document.getElementById("more-projects");
        if (!btn || !more) return;
        btn.addEventListener("click", () => {
            const open = more.classList.toggle("is-open");
            btn.textContent = open ? "Show fewer projects" : "View More Projects";
            if (open) more.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    function bindAchievementDisclosures() {
        document.querySelectorAll(".achievement").forEach(item => {
            const head = item.querySelector(".achievement__head");
            const body = item.querySelector(".achievement__body");
            if (!head || !body) return;

            const setOpen = (open) => {
                item.classList.toggle("is-open", open);
                head.setAttribute("aria-expanded", String(open));
            };

            setOpen(false);
            head.setAttribute("role", "button");
            head.setAttribute("tabindex", "0");

            const toggle = () => setOpen(!item.classList.contains("is-open"));

            head.addEventListener("click", toggle);
            head.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            });
        });
    }

    function loadImagesIn(scope) {
        scope.querySelectorAll("img[data-src]").forEach(img => {
            if (!img.dataset.src) return;
            img.src = img.dataset.src;
            delete img.dataset.src;
        });
    }

    /* ================================================================
       Ambient music — always tries to play on every page load.
       Falls back to user gestures until playback successfully starts.
       The toggle still pauses for the current session, but we do not
       persist an "off" preference — the song restarts on reload.
       ================================================================ */
    function bindAmbient() {
        const btn = document.getElementById("ambient-toggle");
        const audio = document.getElementById("ambient-audio");
        if (!btn || !audio) return;

        audio.volume = 0.35;
        audio.preload = "auto";

        const setPressed = (on) => {
            btn.setAttribute("aria-pressed", String(on));
            btn.setAttribute("aria-label", on ? "Pause ambient music" : "Play ambient music");
        };

        const tryPlay = async () => {
            try {
                await audio.play();
                setPressed(true);
                return true;
            } catch {
                return false;
            }
        };

        const gestureEvents = ["pointerup", "click", "keydown", "touchend", "mouseup", "wheel", "scroll", "touchmove"];
        let unlocking = false;
        const hint = document.createElement("button");
        hint.type = "button";
        hint.className = "ambient-hint";
        hint.textContent = "Click to set the mood";
        hint.hidden = true;
        document.body.appendChild(hint);

        const showHint = () => {
            if (audio.paused) hint.hidden = false;
        };

        const hideHint = () => {
            hint.hidden = true;
        };

        const removeGestureFallback = () => {
            gestureEvents.forEach(ev => window.removeEventListener(ev, onGesture, true));
            hideHint();
        };

        // Keep retrying on real gestures until playback actually succeeds.
        const onGesture = async (event) => {
            // If the first gesture is on the speaker button, let its click
            // handler own the play/pause behavior to avoid a race.
            if (event.target instanceof Element && event.target.closest("#ambient-toggle")) {
                return;
            }

            if (!audio.paused) {
                removeGestureFallback();
                return;
            }
            if (unlocking) return;

            unlocking = true;
            const started = await tryPlay();
            unlocking = false;
            if (started) {
                removeGestureFallback();
            } else {
                showHint();
            }
        };

        // Always try on load — no localStorage gate.
        tryPlay().then(started => {
            if (started) {
                removeGestureFallback();
            } else {
                // Show a light nudge if blocked on load.
                setTimeout(showHint, 1200);
            }
        });

        // If autoplay is blocked, keep listening until a valid user gesture
        // successfully starts playback.
        gestureEvents.forEach(ev =>
            window.addEventListener(ev, onGesture, { capture: true, passive: true })
        );

        hint.addEventListener("click", async () => {
            if (unlocking) return;
            unlocking = true;
            const started = await tryPlay();
            unlocking = false;
            if (started) removeGestureFallback();
        });

        btn.addEventListener("click", async () => {
            if (audio.paused) {
                const started = await tryPlay();
                if (!started) {
                    console.warn("Ambient: could not play from toggle click.");
                    showHint();
                    return;
                }
                removeGestureFallback();
            } else {
                audio.pause();
                setPressed(false);
            }
        });

        audio.addEventListener("pause", () => setPressed(false));
        audio.addEventListener("playing", () => {
            setPressed(true);
            removeGestureFallback();
        });
    }
})();
