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
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderFloatingLine, { once: true });
    } else {
        renderFloatingLine();
    }
})();
