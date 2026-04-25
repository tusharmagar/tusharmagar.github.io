/* Tushar Magar — portfolio interactions */

(() => {
    document.addEventListener("DOMContentLoaded", init);

    function init() {
        bindWorkDisclosures();
        bindProjectDisclosures();
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
       Hero name — character glyph swaps every 4 beats (124 BPM track).
       Pulses always run; when the song is playing they line up with it.
       3–4 characters can swap at once. Glyphs are leetspeak / fun
       look-alikes (S→5, A→4, R→₹, etc.).
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
        R: ["₹", "®", "Я", "Ŕ", "Ʀ"],
        M: ["₥", "ʍ", "Ṁ"],
        G: ["6", "9", "©", "Ġ", "Ĝ"],
    };

    const BPM = 124;
    const BEAT_MS = 60000 / BPM;          // ~484
    const PULSE_BEATS = 4;
    const PULSE_INTERVAL = BEAT_MS * PULSE_BEATS; // ~1935ms
    const HOLD_MS = Math.round(BEAT_MS);          // ~484ms — one full beat

    /* Glyph swap is hero-only. */
    const BEAT_HEADING_SELECTORS = ".hero__name [data-text]";

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

                // 50/50 between 3 and 4 swaps per pulse, per heading
                const n = Math.min(eligible.length, Math.random() < 0.5 ? 3 : 4);
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

        setInterval(pulse, PULSE_INTERVAL);
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

    function loadImagesIn(scope) {
        scope.querySelectorAll("img[data-src]").forEach(img => {
            if (!img.dataset.src) return;
            img.src = img.dataset.src;
            delete img.dataset.src;
        });
    }

    /* ================================================================
       Ambient music — always tries to play on every page load.
       Falls back to first user gesture if the browser blocks autoplay.
       The toggle still pauses for the current session, but we do not
       persist an "off" preference — the song restarts on reload.
       ================================================================ */
    function bindAmbient() {
        const btn = document.getElementById("ambient-toggle");
        const audio = document.getElementById("ambient-audio");
        if (!btn || !audio) return;

        audio.volume = 0.35;

        const setPressed = (on) => {
            btn.setAttribute("aria-pressed", String(on));
            btn.setAttribute("aria-label", on ? "Pause ambient music" : "Play ambient music");
        };

        const tryPlay = () => audio.play()
            .then(() => setPressed(true))
            .catch(() => {});

        // Always try on load — no localStorage gate.
        tryPlay();

        // If autoplay was blocked, the next user gesture starts playback.
        const onGesture = () => {
            if (audio.paused) tryPlay();
            ["pointerdown", "keydown", "scroll", "touchstart"]
                .forEach(ev => window.removeEventListener(ev, onGesture));
        };
        ["pointerdown", "keydown", "scroll", "touchstart"]
            .forEach(ev => window.addEventListener(ev, onGesture, { once: true, passive: true }));

        btn.addEventListener("click", async () => {
            if (audio.paused) {
                try { await audio.play(); setPressed(true); }
                catch (err) { console.warn("Ambient: could not play —", err.message); }
            } else {
                audio.pause();
                setPressed(false);
            }
        });

        audio.addEventListener("pause", () => setPressed(false));
        audio.addEventListener("playing", () => setPressed(true));
    }
})();
