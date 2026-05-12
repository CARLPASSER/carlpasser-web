document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            // Toggle hamburger icon animation
            const spans = menuToggle.querySelectorAll('span');
            if (navLinks.classList.contains('open')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Scroll Header Effect
    const header = document.querySelector('.header');
    if (header) {
        const isSubpage = document.body.classList.contains('subpage');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        // Keep mobile header consistently readable on every page.
        if (isMobile) {
            header.classList.add('scrolled');
            header.classList.add('mobile-header-ready');

            const blackLogo = header.querySelector('.logo-black');
            const whiteLogo = header.querySelector('.logo-white');
            const menu = header.querySelector('.menu-toggle');
            const menuSpans = header.querySelectorAll('.menu-toggle span');

            if (blackLogo) blackLogo.style.opacity = '1';
            if (whiteLogo) whiteLogo.style.opacity = '0';
            if (menu) menu.style.display = 'flex';
            menuSpans.forEach((span) => {
                span.style.backgroundColor = '#1f1f1f';
            });
        }

        if (isSubpage) {
            header.classList.add('scrolled');
        }

        const toggleHeaderScrolled = () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        };
        if (!isSubpage && !isMobile) {
            window.addEventListener('scroll', toggleHeaderScrolled);
            toggleHeaderScrolled();
        }
    }

    // Fade Up Animation on Scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.classList.add('show');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-up');
    fadeElements.forEach(el => observer.observe(el));

    const fetchMicroCMS = async (endpoint, params = {}) => {
        const searchParams = new URLSearchParams({ endpoint, ...params });
        const response = await fetch(`/.netlify/functions/microcms?${searchParams.toString()}`);

        if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status}`);
        }

        return response.json();
    };

    const formatDate = (dateString) => {
        const dateObj = new Date(dateString);

        if (Number.isNaN(dateObj.getTime())) {
            return '';
        }

        return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
    };

    // Load News Data from microCMS
    const loadNews = async () => {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        try {
            const response = await fetch('/.netlify/functions/news');

            if (!response.ok) {
                throw new Error(`API fetch failed: ${response.status}`);
            }

            const data = await response.json();
            const newsData = Array.isArray(data.contents) ? data.contents : [];

            if (newsData.length === 0) {
                newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">現在お知らせはありません</p>';
                return;
            }

            newsContainer.innerHTML = '';
            const fragment = document.createDocumentFragment();

            newsData.forEach((item) => {
                const article = document.createElement('article');
                article.className = 'news-item';

                const date = document.createElement('div');
                date.className = 'news-date';
                date.textContent = formatDate(item.date || item.publishedAt);

                const title = document.createElement('div');
                title.className = 'news-content-title';
                title.style.flex = '1';
                title.textContent = item.title || '';

                article.appendChild(date);
                article.appendChild(title);
                fragment.appendChild(article);
            });

            newsContainer.appendChild(fragment);
        } catch (error) {
            console.log('Error fetching news:', error);
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">お知らせの読み込みに失敗しました。</p>';
        }
    };

    loadNews();

    // Load Weekly Select Cards (sales.html)
    const loadWeeklySelect = () => {
        const weeklyContainer = document.getElementById('weekly-select-list');
        if (!weeklyContainer) return;

        const curatedCars = [
            {
                model: 'ランクル70',
                image: 'photo/stock-rankle70.png',
                catchCopy: 'ハイテクより、ハイ・タフ。',
                subCopy: '流行に流されず、自分のスタイルで選ぶ一台',
                url: 'https://www.carsensor.net/usedcar/detail/AU6907125316/index.html'
            },
            {
                model: 'デイズ',
                image: 'photo/stock-dayz.png',
                catchCopy: '浮いた予算で、何をする？',
                subCopy: '無理なく、ちょうどいい日常をつくる一台',
                url: 'https://www.carsensor.net/usedcar/detail/AU6761993484/index.html'
            },
            {
                model: 'ハスラー',
                image: 'photo/stock-hustler.png',
                catchCopy: 'ちょっとした毎日を、ちょっとした冒険に。',
                subCopy: '遊びも日常も楽しめる、ちょうどいい一台',
                url: 'https://www.carsensor.net/usedcar/detail/AU6908610588/index.html'
            }
        ];

        const html = curatedCars.map((car) => `
            <a href="${car.url}" class="weekly-select-card" target="_blank" rel="noopener noreferrer" aria-label="${car.model}の詳細を見る">
                <img src="${car.image}" alt="${car.model}" class="weekly-select-image">
                <div class="weekly-select-overlay">
                    <div class="weekly-select-title">${car.catchCopy}</div>
                    <div class="weekly-select-desc">${car.subCopy}</div>
                    <div class="weekly-select-link">→ 詳しく見る</div>
                </div>
            </a>
        `).join('');

        weeklyContainer.innerHTML = html;
    };

    loadWeeklySelect();

    // Load Gallery from microCMS (gallery.html)
    const loadGallery = async () => {
        const galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) return;

        try {
            const data = await fetchMicroCMS('gallery', {
                limit: '20'
            });
            const items = Array.isArray(data.contents) ? data.contents : [];

            if (items.length === 0) {
                // データがない場合は既存の静的画像を残すか、または何も表示しない
                return;
            }

            let html = '';
            items.forEach(item => {
                const imageUrl = item.image && item.image.url ? item.image.url : '';
                const altText = item.title ? item.title : 'Gallery Image';

                if (imageUrl) {
                    html += `
            <div class="gallery-item">
                <img src="${imageUrl}" alt="${altText}">
            </div>`;
                }
            });

            // データがあれば中身をごっそり入れ替える
            if (html) {
                galleryContainer.innerHTML = html;
            }

        } catch (error) {
            console.log('Error fetching gallery:', error);
        }
    };

    loadGallery();
});
