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

    const fetchNewsData = async (params = {}) => {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        const response = await fetch(`/.netlify/functions/news${queryString ? `?${queryString}` : ''}`);

        if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status}`);
        }

        return response.json();
    };

    const fetchAllNewsData = async () => {
        const pageSize = 100;
        const allItems = [];
        let offset = 0;
        let totalCount = Infinity;

        while (allItems.length < totalCount) {
            const data = await fetchNewsData({
                limit: String(pageSize),
                offset: String(offset)
            });
            const items = Array.isArray(data.contents) ? data.contents : [];
            totalCount = Number.isFinite(data.totalCount) ? data.totalCount : items.length;

            if (!items.length) {
                break;
            }

            allItems.push(...items);
            offset += items.length;
        }

        return allItems;
    };

    const formatDate = (dateString) => {
        const dateObj = new Date(dateString);

        if (Number.isNaN(dateObj.getTime())) {
            return '';
        }

        return `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
    };

    const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const getNewsDetailUrl = (id) => `/news-detail.html?id=${encodeURIComponent(id)}`;

    const createNewsListItem = (item) => {
        const hasLink = Boolean(item.id);
        const element = document.createElement(hasLink ? 'a' : 'article');
        element.className = 'news-item';

        if (hasLink) {
            element.href = getNewsDetailUrl(item.id);
            element.setAttribute('aria-label', `${item.title || 'お知らせ'}の詳細を見る`);
        }

        const date = document.createElement('div');
        date.className = 'news-date';
        date.textContent = formatDate(item.date || item.publishedAt);

        const title = document.createElement('div');
        title.className = 'news-content-title';
        title.style.flex = '1';
        title.textContent = item.title || '';

        element.appendChild(date);
        element.appendChild(title);

        return element;
    };

    const renderNewsList = (container, newsData, emptyMessage) => {
        if (!container) return;

        if (!newsData.length) {
            container.innerHTML = `<p class="news-empty">${emptyMessage}</p>`;
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();

        newsData.forEach((item) => {
            fragment.appendChild(createNewsListItem(item));
        });

        container.appendChild(fragment);
    };

    const renderNewsBody = (container, body) => {
        if (!container) return;

        container.innerHTML = '';

        if (!body) {
            return;
        }

        if (/<[a-z][\s\S]*>/i.test(body)) {
            container.innerHTML = body;
            return;
        }

        body.split(/\n{2,}/).forEach((paragraph) => {
            const trimmedParagraph = paragraph.trim();
            if (!trimmedParagraph) return;

            const element = document.createElement('p');
            element.innerHTML = escapeHtml(trimmedParagraph).replace(/\n/g, '<br>');
            container.appendChild(element);
        });
    };

    // Load News Data from microCMS
    const loadNews = async () => {
        const newsContainer = document.getElementById('news-container');
        if (!newsContainer) return;

        try {
            const data = await fetchNewsData({ limit: '3' });
            const newsData = Array.isArray(data.contents) ? data.contents : [];
            renderNewsList(newsContainer, newsData, '現在お知らせはありません');
        } catch (error) {
            console.log('Error fetching news:', error);
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">お知らせの読み込みに失敗しました。</p>';
        }
    };

    loadNews();

    const loadNewsArchive = async () => {
        const archiveContainer = document.getElementById('news-archive-list');
        if (!archiveContainer) return;

        try {
            const newsData = await fetchAllNewsData();
            renderNewsList(archiveContainer, newsData, '現在お知らせはありません');
        } catch (error) {
            console.log('Error fetching news archive:', error);
            archiveContainer.innerHTML = '<p class="news-empty">お知らせの読み込みに失敗しました。</p>';
        }
    };

    loadNewsArchive();

    const loadNewsDetail = async () => {
        const detailTitle = document.getElementById('news-detail-title');
        const detailDate = document.getElementById('news-detail-date');
        const detailBody = document.getElementById('news-detail-body');
        if (!detailTitle || !detailDate || !detailBody) return;

        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            detailTitle.textContent = 'お知らせが見つかりません';
            detailDate.textContent = '';
            detailBody.innerHTML = '<p>記事IDが指定されていません。</p>';
            return;
        }

        try {
            const item = await fetchNewsData({ id });
            detailTitle.textContent = item.title || 'お知らせ';
            detailDate.textContent = formatDate(item.date || item.publishedAt);
            renderNewsBody(detailBody, item.body || '');

            if (item.title) {
                document.title = `${item.title} | NEWS | CARL PASSER`;
            }
        } catch (error) {
            console.log('Error fetching news detail:', error);
            detailTitle.textContent = 'お知らせの読み込みに失敗しました';
            detailDate.textContent = '';
            detailBody.innerHTML = '<p>時間をおいて再度お試しください。</p>';
        }
    };

    loadNewsDetail();

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
