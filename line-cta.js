(() => {
    const renderFloatingLine = () => {
        if (!document.body || document.querySelector('.cp-floating-line')) return;

        const floatingLine = document.createElement('a');
        floatingLine.href = 'https://lin.ee/TLGhT3W';
        floatingLine.target = '_blank';
        floatingLine.rel = 'noopener noreferrer';
        floatingLine.className = 'cp-floating-line';
        floatingLine.setAttribute('aria-label', 'LINEで相談する（新しいタブで開きます）');
        floatingLine.innerHTML = '<span class="cp-line-mark" aria-hidden="true">LINE</span><span>LINEで相談</span>';

        document.body.classList.add('cp-has-floating-line');
        document.body.appendChild(floatingLine);

        const pageLineCtas = Array.from(document.querySelectorAll('[data-line-cta]'));
        if (!pageLineCtas.length || !('IntersectionObserver' in window)) return;

        const visibleCtas = new Set();
        const updateVisibility = () => {
            const shouldHide = visibleCtas.size > 0;
            floatingLine.classList.toggle('is-hidden', shouldHide);
            floatingLine.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
            if (shouldHide) {
                floatingLine.setAttribute('tabindex', '-1');
            } else {
                floatingLine.removeAttribute('tabindex');
            }
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    visibleCtas.add(entry.target);
                } else {
                    visibleCtas.delete(entry.target);
                }
            });
            updateVisibility();
        }, {
            threshold: 0.08
        });

        pageLineCtas.forEach((cta) => observer.observe(cta));
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFloatingLine, { once: true });
    } else {
        renderFloatingLine();
    }
})();
