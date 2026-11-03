/* Native scrolling preserves vertical touch gestures; no autoplay or drag interception. */
(() => {
    const section = document.querySelector('.cp-match');
    if (!section) return;
    const track = section.querySelector('.cp-match-cards');
    const cards = [...track.children];
    const controls = section.querySelector('.cp-match-controls');
    const position = section.querySelector('.cp-match-position');
    const prev = section.querySelector('.cp-match-prev');
    const next = section.querySelector('.cp-match-next');
    const mobile = window.matchMedia('(max-width: 1023px)');
    let current = 0;
    let frame;
    const update = () => {
        current = cards.reduce((best, card, i) =>
            Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left) <
            Math.abs(cards[best].getBoundingClientRect().left - track.getBoundingClientRect().left) ? i : best, 0);
        position.textContent = `${String(current + 1).padStart(2, '0')} / 03`;
        prev.disabled = current === 0;
        next.disabled = current === cards.length - 1;
    };
    const move = (index) => {
        if (!mobile.matches) return;
        const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
        track.scrollBy({ left: target.getBoundingClientRect().left - track.getBoundingClientRect().left, behavior: 'auto' });
    };
    prev.addEventListener('click', () => move(current - 1));
    next.addEventListener('click', () => move(current + 1));
    track.addEventListener('keydown', (event) => {
        if (!mobile.matches || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'Home' ? 0 : event.key === 'End' ? 2 : current + (event.key === 'ArrowRight' ? 1 : -1));
    });
    track.addEventListener('scroll', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
    }, { passive: true });
    const layout = () => {
        controls.hidden = !mobile.matches;
        track.tabIndex = mobile.matches ? 0 : -1;
        track.scrollLeft = 0;
        update();
    };
    mobile.addEventListener('change', layout);
    layout();
})();
