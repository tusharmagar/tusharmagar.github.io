(() => {
    const downloads = window.BABYLON_DOWNLOADS || {};
    let available = 0;

    document.querySelectorAll("[data-copy-target]").forEach((copyButton) => {
        const command = document.getElementById(copyButton.dataset.copyTarget);
        if (!command) return;

        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(command.textContent.trim());
                copyButton.textContent = "Copied";
                setTimeout(() => { copyButton.textContent = "Copy"; }, 1600);
            } catch {
                window.prompt("Copy this command:", command.textContent.trim());
            }
        });
    });

    document.querySelectorAll("[data-download]").forEach((link) => {
        const key = link.dataset.download;
        const release = downloads[key];

        if (!release || !release.url) {
            link.addEventListener("click", (event) => event.preventDefault());
            link.setAttribute("tabindex", "-1");
            return;
        }

        link.href = release.url;
        link.removeAttribute("aria-disabled");
        link.removeAttribute("tabindex");
        link.classList.remove("is-disabled");
        link.rel = "noopener";
        if (release.filename) link.setAttribute("download", release.filename);
    });

    Object.entries(downloads).forEach(([key, release]) => {
        if (!release || !release.url) return;
        available += 1;

        const card = document.querySelector(`[data-release-card="${key}"]`);
        const status = document.querySelector(`[data-status="${key}"]`);
        const meta = document.querySelector(`[data-meta="${key}"]`);

        if (card) card.classList.add("is-ready");
        if (status) status.innerHTML = '<i aria-hidden="true"></i> Available now';
        if (meta && release.meta) meta.textContent = release.meta;
    });

    const releaseStatus = document.getElementById("release-status");
    if (!releaseStatus) return;

    if (downloads.mac?.url && downloads.beta?.url && downloads.show?.url) {
        releaseStatus.textContent = "Recommended download: Babylon 0.2.0-beta.2 (Updated UI).";
        releaseStatus.classList.add("is-ready");
    } else if (available > 0) {
        releaseStatus.textContent = `${available} download${available === 1 ? " is" : "s are"} available now.`;
        releaseStatus.classList.add("is-ready");
    }
})();
