document.addEventListener('DOMContentLoaded', () => {
    const loader = document.querySelector('.cp-loader');
    if (loader) {
        const shouldShowLoader = !sessionStorage.getItem('cpLoaderShown')
            && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (shouldShowLoader) {
            document.body.classList.add('cp-loading');
            sessionStorage.setItem('cpLoaderShown', '1');
            window.setTimeout(() => {
                document.body.classList.remove('cp-loading');
            }, 1000);
        }
    }

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

    const fetchBlogData = async (params = {}) => {
        const searchParams = new URLSearchParams(params);
        const queryString = searchParams.toString();
        const response = await fetch(`/.netlify/functions/blog${queryString ? `?${queryString}` : ''}`);

        if (!response.ok) {
            throw new Error(`API fetch failed: ${response.status}`);
        }

        return response.json();
    };

    const getBlogCategory = (item) => {
        if (!item) return '';
        if (typeof item.category === 'string') return item.category;
        if (item.category && typeof item.category === 'object') {
            return item.category.name || item.category.title || item.category.id || item.category.slug || '';
        }
        return '';
    };

    const getBlogCategoryLabel = (item) => {
        const category = getBlogCategory(item);
        return category || 'CARL MAG';
    };

    const getBlogUrl = (item) => {
        return `blog-detail.html?id=${encodeURIComponent(item.id)}`;
    };

    const getBlogThumbnail = (item) => {
        if (item.eyecatch && item.eyecatch.url) return item.eyecatch.url;
        if (item.thumbnail && item.thumbnail.url) return item.thumbnail.url;
        return 'photo/Image (25).jpg';
    };

    const getBlogTags = (item) => {
        if (!item || !Array.isArray(item.tags)) return [];
        return item.tags
            .map((tag) => {
                if (typeof tag === 'string') return tag;
                if (tag && typeof tag === 'object') return tag.name || tag.title || tag.id || '';
                return '';
            })
            .filter(Boolean);
    };

    const createBlogTagsHtml = (item) => {
        const tags = getBlogTags(item);
        if (!tags.length) return '';
        return `<div class="cp-blog-tags">${tags.map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>`;
    };

    const updateMetaTag = (selector, attr, value) => {
        const element = document.querySelector(selector);
        if (element && value) element.setAttribute(attr, value);
    };

    const updateBlogSeo = (item) => {
        const titleText = `${item.title || 'CARL MAG'} | CARL MAG | CARL PASSER`;
        const description = item.excerpt || 'CARL PASSERのカーライフメディア CARL MAG の記事です。';
        const image = getBlogThumbnail(item);
        const url = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(item.id)}`;

        document.title = titleText;
        updateMetaTag('meta[name="description"]', 'content', description);
        updateMetaTag('meta[property="og:title"]', 'content', titleText);
        updateMetaTag('meta[property="og:description"]', 'content', description);
        updateMetaTag('meta[property="og:image"]', 'content', image);
        updateMetaTag('meta[property="og:url"]', 'content', url);
        updateMetaTag('link[rel="canonical"]', 'href', url);
    };

    const createBlogCard = (item, featured = false) => {
        const article = document.createElement('article');
        article.className = featured ? 'cp-blog-card cp-blog-card-featured' : 'cp-blog-card';
        article.dataset.category = getBlogCategory(item);

        article.innerHTML = `
            <a href="${getBlogUrl(item)}" aria-label="${escapeHtml(item.title || 'ブログ記事')}を読む">
                <div class="cp-blog-thumb">
                    <img src="${getBlogThumbnail(item)}" alt="${escapeHtml(item.title || 'CARL PASSER BLOG')}">
                </div>
                <div class="cp-blog-card-body">
                    <div class="cp-blog-meta">
                        <span>${escapeHtml(getBlogCategoryLabel(item))}</span>
                        <time>${formatDate(item.publishedAt)}</time>
                    </div>
                    <h3>${escapeHtml(item.title || '')}</h3>
                    <p>${escapeHtml(item.excerpt || '')}</p>
                    ${createBlogTagsHtml(item)}
                </div>
            </a>
        `;

        return article;
    };

    const renderBlogPosts = (container, posts, featured = false) => {
        if (!container) return;
        if (!posts.length) {
            container.innerHTML = '<p class="cp-loading-text">記事を準備中です</p>';
            return;
        }

        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        posts.forEach((post) => fragment.appendChild(createBlogCard(post, featured)));
        container.appendChild(fragment);
    };

    const loadBlogIndex = async () => {
        const postsContainer = document.getElementById('blog-posts');
        const featuredContainer = document.getElementById('blog-featured');
        if (!postsContainer && !featuredContainer) return;

        try {
            const data = await fetchBlogData({ limit: '30' });
            const posts = Array.isArray(data.contents) ? data.contents : [];
            const featuredPosts = posts.slice(0, 1);

            renderBlogPosts(featuredContainer, featuredPosts.length ? featuredPosts : posts.slice(0, 1), true);
            renderBlogPosts(postsContainer, posts, false);

            document.querySelectorAll('[data-blog-filter]').forEach((button) => {
                button.addEventListener('click', () => {
                    const selected = button.dataset.blogFilter;
                    document.querySelectorAll('[data-blog-filter]').forEach((item) => item.classList.remove('is-active'));
                    button.classList.add('is-active');

                    const filteredPosts = selected === 'all'
                        ? posts
                        : posts.filter((post) => getBlogCategory(post) === selected);

                    renderBlogPosts(postsContainer, filteredPosts, false);
                });
            });
        } catch (error) {
            console.log('Error fetching blog:', error);
            if (featuredContainer) featuredContainer.innerHTML = '<p class="cp-loading-text">記事の読み込みに失敗しました。</p>';
            if (postsContainer) postsContainer.innerHTML = '<p class="cp-loading-text">記事の読み込みに失敗しました。</p>';
        }
    };

    loadBlogIndex();

    const loadBlogDetail = async () => {
        const title = document.getElementById('blog-detail-title');
        const category = document.getElementById('blog-detail-category');
        const meta = document.getElementById('blog-detail-meta');
        const content = document.getElementById('blog-detail-content');
        const thumbnail = document.getElementById('blog-detail-thumbnail');
        const tags = document.getElementById('blog-detail-tags');
        const breadcrumbTitle = document.getElementById('blog-breadcrumb-title');
        const related = document.getElementById('blog-related-posts');
        if (!title || !content) return;

        const id = new URLSearchParams(window.location.search).get('id');

        if (!id) {
            title.textContent = '記事が見つかりません';
            content.innerHTML = '<p>記事が指定されていません。</p>';
            return;
        }

        try {
            const item = await fetchBlogData({ id });

            if (!item || !item.title) {
                throw new Error('Blog post not found');
            }

            title.textContent = item.title;
            if (breadcrumbTitle) breadcrumbTitle.textContent = item.title;
            if (category) category.textContent = getBlogCategoryLabel(item);
            if (meta) meta.textContent = formatDate(item.publishedAt);
            if (tags) tags.innerHTML = createBlogTagsHtml(item);
            if (thumbnail) {
                thumbnail.innerHTML = `<img src="${getBlogThumbnail(item)}" alt="${escapeHtml(item.title)}">`;
            }

            renderNewsBody(content, item.content || '');
            updateBlogSeo(item);

            if (related) {
                const list = await fetchBlogData({ limit: '30' });
                const posts = Array.isArray(list.contents) ? list.contents : [];
                const relatedPosts = posts
                    .filter((post) => post.id !== item.id && getBlogCategory(post) === getBlogCategory(item))
                    .slice(0, 3);
                renderBlogPosts(related, relatedPosts, false);
            }
        } catch (error) {
            console.log('Error fetching blog detail:', error);
            title.textContent = '記事の読み込みに失敗しました';
            if (meta) meta.textContent = '';
            content.innerHTML = '<p>時間をおいて再度お試しください。</p>';
        }
    };

    loadBlogDetail();

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
