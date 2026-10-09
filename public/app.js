// ==========================================
// BlogForge - Full-Stack SPA Client
// ==========================================

// State Management
const state = {
    posts: [],
    categories: [],
    currentPost: null,
    stats: null,
    searchQuery: '',
    statusFilter: 'all',
    categoryFilter: 'all',
    currentPage: 1
};

// ==========================================
// API Module - Real REST API calls
// ==========================================
const api = {
    async getPosts(params = {}) {
        const query = new URLSearchParams();
        if (params.status) query.set('status', params.status);
        if (params.category) query.set('category', params.category);
        if (params.search) query.set('search', params.search);
        if (params.page) query.set('page', params.page);
        if (params.limit) query.set('limit', params.limit);
        if (params.sort) query.set('sort', params.sort);
        const res = await fetch(`/api/posts?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch posts');
        return res.json();
    },

    async getPost(slug) {
        const res = await fetch(`/api/posts/${slug}`);
        if (!res.ok) throw new Error('Post not found');
        return res.json();
    },

    async createPost(data) {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create post');
        }
        return res.json();
    },

    async updatePost(id, data) {
        const res = await fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update post');
        }
        return res.json();
    },

    async deletePost(id) {
        const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete post');
        return res.json();
    },

    async getCategories() {
        const res = await fetch('/api/categories');
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    async getStats() {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    async uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    }
};

// ==========================================
// Utility Functions
// ==========================================
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return 'just now';
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    return 'just now';
};

const calculateReadingTime = (text) => {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const time = Math.max(1, Math.ceil(words / 200));
    return `${time} min read`;
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

// ==========================================
// Toast Notifications
// ==========================================
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'check-circle', error: 'exclamation-circle', info: 'info-circle' };
    toast.innerHTML = `<i class="fa-solid fa-${icons[type] || icons.info}"></i> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// ==========================================
// Modal
// ==========================================
let confirmAction = null;
const showModal = (title, message, onConfirm) => {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.add('active');
    confirmAction = () => {
        onConfirm();
        overlay.classList.remove('active');
        confirmAction = null;
    };
};

// ==========================================
// Router
// ==========================================
const router = async () => {
    const hash = window.location.hash.slice(1) || '/';
    const appEl = document.getElementById('app');

    // Reset mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) mobileMenu.classList.remove('active');

    // Page transition
    appEl.style.opacity = '0';
    appEl.style.transition = 'opacity 0.2s ease';

    await new Promise(resolve => setTimeout(resolve, 200));

    try {
        if (hash === '/') {
            appEl.innerHTML = await renderHome();
        } else if (hash.startsWith('/post/')) {
            const slug = hash.replace('/post/', '');
            appEl.innerHTML = await renderPostView(slug);
        } else if (hash === '/write') {
            appEl.innerHTML = await renderEditor();
            setupEditor();
        } else if (hash.startsWith('/edit/')) {
            const id = hash.replace('/edit/', '');
            appEl.innerHTML = await renderEditor(id);
            await setupEditor(id);
        } else if (hash === '/dashboard') {
            appEl.innerHTML = await renderDashboard();
            setupDashboard();
        } else {
            appEl.innerHTML = `
                <div style="text-align:center; padding:6rem 2rem;">
                    <h1 style="font-size:4rem; margin-bottom:1rem;">404</h1>
                    <p style="color:var(--text-muted); margin-bottom:2rem;">Page not found</p>
                    <a href="#/" class="btn btn-primary">Go Home</a>
                </div>`;
        }
    } catch (error) {
        console.error('Router error:', error);
        appEl.innerHTML = `
            <div style="text-align:center; padding:6rem 2rem;">
                <h1 style="color:#ef4444;"><i class="fa-solid fa-exclamation-triangle"></i></h1>
                <p style="margin-top:1rem;">Something went wrong. Please try again.</p>
                <a href="#/" class="btn btn-primary" style="margin-top:1rem;">Go Home</a>
            </div>`;
    }

    appEl.style.opacity = '1';
    window.scrollTo(0, 0);

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === '#' + hash || (href === '#/' && hash === '/')) {
            link.classList.add('active');
        }
    });
};

// ==========================================
// Components
// ==========================================

// --- HOME PAGE ---
async function renderHome() {
    let postsData;
    try {
        const params = { status: 'published', limit: 12, sort: 'newest' };
        if (state.searchQuery) params.search = state.searchQuery;
        if (state.categoryFilter && state.categoryFilter !== 'all') params.category = state.categoryFilter;
        postsData = await api.getPosts(params);
    } catch (e) {
        console.error('Failed to load posts:', e);
        postsData = { posts: [], total: 0 };
    }

    let categories;
    try {
        categories = await api.getCategories();
        state.categories = categories;
    } catch (e) {
        categories = [];
    }

    const posts = postsData.posts || [];

    const postsHtml = posts.length > 0 ? posts.map(post => {
        const dateField = post.created_at || post.date;
        const coverImg = post.cover_image || post.coverImage;
        return `
        <article class="post-card">
            ${coverImg ? `<img src="${escapeHtml(coverImg)}" alt="${escapeHtml(post.title)}" class="post-img" onerror="this.style.display='none'">` :
            `<div class="post-img" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); display:flex; align-items:center; justify-content:center;">
                <i class="fa-solid fa-feather-pointed" style="font-size:3rem; color:white; opacity:0.5;"></i>
            </div>`}
            <div class="post-content">
                <span class="post-category">${escapeHtml(post.category || 'Uncategorized')}</span>
                <h3 class="post-title"><a href="#/post/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h3>
                <p class="post-excerpt">${escapeHtml(post.excerpt || '')}</p>
                <div class="post-meta">
                    <span><i class="fa-regular fa-user"></i> ${escapeHtml(post.author || 'Admin')}</span>
                    <span>${timeAgo(dateField)}</span>
                </div>
            </div>
        </article>`;
    }).join('') : '<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:3rem; margin-bottom:1rem; display:block;"></i>No posts found.</div>';

    // Category sidebar with post counts from API data
    const categoryCounts = {};
    posts.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const categoriesHtml = categories.map(cat => {
        const count = cat.post_count !== undefined ? cat.post_count : (categoryCounts[cat.name] || 0);
        const isActive = state.categoryFilter === cat.name ? 'style="color:var(--primary); font-weight:600;"' : '';
        return `
        <li>
            <a href="#" class="category-filter" data-cat="${escapeHtml(cat.name)}" ${isActive}>
                ${escapeHtml(cat.name)} <span class="category-count">${count}</span>
            </a>
        </li>`;
    }).join('');

    const isFiltered = Boolean(state.searchQuery || (state.categoryFilter && state.categoryFilter !== 'all'));
    const filterInfo = state.searchQuery
        ? `<span style="color:var(--text-muted); font-size:1.1rem; font-weight:normal;"> — searching "<strong>${escapeHtml(state.searchQuery)}</strong>"</span>`
        : state.categoryFilter !== 'all'
            ? `<span style="color:var(--text-muted); font-size:1.1rem; font-weight:normal;"> — in <strong>${escapeHtml(state.categoryFilter)}</strong></span>`
            : '';
    const clearBtn = isFiltered
        ? `<button id="clear-filter-btn" class="btn btn-secondary" style="padding:0.35rem 0.8rem; font-size:0.85rem; display:inline-flex; align-items:center; gap:0.4rem;"><i class="fa-solid fa-xmark"></i> Clear filter</button>`
        : '';

    return `
        <section class="hero">
            <div class="hero-content">
                <h1>Welcome to BlogForge</h1>
                <p>Discover stories, thinking, and expertise from writers on any topic.</p>
                <a href="#/write" class="btn btn-primary"><i class="fa-solid fa-pen"></i> Start Writing</a>
            </div>
        </section>

        <div class="home-layout">
            <div class="main-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; flex-wrap:wrap; gap:1rem;">
                    <h2 style="margin:0;">Latest Posts${filterInfo}</h2>
                    ${clearBtn}
                </div>
                <div class="posts-grid">
                    ${postsHtml}
                </div>
            </div>

            <aside class="sidebar">
                <div class="widget">
                    <h3 class="widget-title">Categories</h3>
                    <ul class="category-list">
                        <li>
                            <a href="#" class="category-filter" data-cat="all" ${state.categoryFilter === 'all' ? 'style="color:var(--primary); font-weight:600;"' : ''}>
                                All <span class="category-count">${postsData.total || posts.length}</span>
                            </a>
                        </li>
                        ${categoriesHtml}
                    </ul>
                </div>

                <div class="widget">
                    <h3 class="widget-title"><i class="fa-solid fa-fire"></i> Quick Stats</h3>
                    <div style="display:flex; flex-direction:column; gap:0.75rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted);">Published</span>
                            <strong>${postsData.total || 0}</strong>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    `;
}

// --- POST VIEW ---
async function renderPostView(slug) {
    try {
        const post = await api.getPost(slug);
        const dateField = post.created_at || post.date;
        const coverImg = post.cover_image || post.coverImage;
        const htmlContent = marked.parse(post.content || '');
        const tags = Array.isArray(post.tags) ? post.tags : (typeof post.tags === 'string' ? JSON.parse(post.tags) : []);

        const tagsHtml = tags.length > 0 ? `
            <div style="margin-top:2rem; display:flex; flex-wrap:wrap; gap:0.5rem;">
                ${tags.map(tag => `<span style="background:var(--bg-main); padding:0.25rem 0.75rem; border-radius:20px; font-size:0.85rem; color:var(--text-muted);">#${escapeHtml(tag)}</span>`).join('')}
            </div>` : '';

        return `
            <article class="post-view">
                <div class="post-header">
                    <span class="post-category">${escapeHtml(post.category || 'Uncategorized')}</span>
                    <h1>${escapeHtml(post.title)}</h1>
                    <div class="post-meta-full">
                        <span><i class="fa-regular fa-user"></i> ${escapeHtml(post.author || 'Admin')}</span>
                        <span><i class="fa-regular fa-calendar"></i> ${formatDate(dateField)}</span>
                        <span><i class="fa-regular fa-clock"></i> ${calculateReadingTime(post.content)}</span>
                        <span><i class="fa-regular fa-eye"></i> ${post.views || 0} views</span>
                    </div>
                </div>

                ${coverImg ? `<img src="${escapeHtml(coverImg)}" alt="Cover" class="post-cover" onerror="this.style.display='none'">` : ''}

                <div class="markdown-body">
                    ${htmlContent}
                </div>

                ${tagsHtml}

                <div class="share-row">
                    <strong>Share:</strong>
                    <button class="share-btn" id="copy-link-btn" title="Copy link">
                        <i class="fa-solid fa-link"></i>
                    </button>
                    <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="share-btn" title="Share on Twitter">
                        <i class="fa-brands fa-twitter"></i>
                    </a>
                </div>

                <div style="margin-top: 3rem; display:flex; gap:1rem; justify-content:center;">
                    <a href="#/" class="btn btn-secondary"><i class="fa-solid fa-arrow-left"></i> Back to Home</a>
                    <a href="#/edit/${post.id}" class="btn btn-primary"><i class="fa-solid fa-pen-to-square"></i> Edit Post</a>
                </div>
            </article>
        `;
    } catch (e) {
        return `
            <div class="post-view" style="text-align:center;">
                <i class="fa-solid fa-file-circle-question" style="font-size:4rem; color:var(--text-muted); margin-bottom:1rem;"></i>
                <h2>Post Not Found</h2>
                <p style="color:var(--text-muted); margin:1rem 0;">The post you're looking for doesn't exist or has been removed.</p>
                <a href="#/" class="btn btn-primary">Go Home</a>
            </div>`;
    }
}

// --- EDITOR ---
async function renderEditor(id = '') {
    let categories;
    try {
        categories = await api.getCategories();
    } catch (e) {
        categories = [
            { name: 'Technology' }, { name: 'Lifestyle' }, { name: 'Travel' },
            { name: 'Food' }, { name: 'Health' }, { name: 'Business' }, { name: 'Entertainment' }
        ];
    }

    const categoryOptions = categories.map(c =>
        `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
    ).join('');

    return `
        <div class="editor-layout">
            <div class="editor-pane">
                <form id="editor-form" data-id="${id}">
                    <div class="form-group">
                        <label><i class="fa-solid fa-heading"></i> Title</label>
                        <input type="text" id="edit-title" class="form-control" required placeholder="Enter your post title..." style="font-size:1.2rem; font-weight:600;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label><i class="fa-solid fa-folder"></i> Category</label>
                            <select id="edit-category" class="form-control">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="form-group">
                            <label><i class="fa-solid fa-tags"></i> Tags</label>
                            <input type="text" id="edit-tags" class="form-control" placeholder="tag1, tag2, tag3">
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-regular fa-image"></i> Cover Image</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="edit-image" class="form-control" placeholder="https://example.com/image.jpg or upload below" style="flex:1;">
                            <label class="btn btn-secondary" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem; margin:0; white-space:nowrap; padding:0.75rem 1rem;">
                                <i class="fa-solid fa-cloud-arrow-up"></i> Upload
                                <input type="file" id="cover-file-input" accept="image/*" style="display:none;">
                            </label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label><i class="fa-solid fa-align-left"></i> Excerpt</label>
                        <textarea id="edit-excerpt" class="form-control" rows="2" placeholder="Brief summary of your post (auto-generated if left blank)"></textarea>
                    </div>

                    <div class="form-group" style="flex: 1; display: flex; flex-direction: column;">
                        <label><i class="fa-solid fa-pen-fancy"></i> Content (Markdown)</label>
                        <div class="toolbar" id="editor-toolbar">
                            <button type="button" class="toolbar-btn" data-action="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
                            <button type="button" class="toolbar-btn" data-action="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
                            <button type="button" class="toolbar-btn" data-action="heading" title="Heading"><i class="fa-solid fa-heading"></i></button>
                            <button type="button" class="toolbar-btn" data-action="link" title="Link"><i class="fa-solid fa-link"></i></button>
                            <button type="button" class="toolbar-btn" data-action="image" title="Image"><i class="fa-regular fa-image"></i></button>
                            <button type="button" class="toolbar-btn" data-action="code" title="Code Block"><i class="fa-solid fa-code"></i></button>
                            <button type="button" class="toolbar-btn" data-action="list" title="List"><i class="fa-solid fa-list"></i></button>
                            <button type="button" class="toolbar-btn" data-action="quote" title="Blockquote"><i class="fa-solid fa-quote-left"></i></button>
                            <button type="button" class="toolbar-btn" data-action="hr" title="Divider"><i class="fa-solid fa-minus"></i></button>
                        </div>
                        <textarea id="edit-content" class="editor-textarea" required placeholder="Write your amazing post in Markdown..."></textarea>
                    </div>

                    <div class="editor-actions">
                        <button type="button" id="btn-save-draft" class="btn btn-secondary">
                            <i class="fa-regular fa-floppy-disk"></i> Save Draft
                        </button>
                        <button type="submit" id="btn-publish" class="btn btn-primary">
                            <i class="fa-solid fa-paper-plane"></i> Publish
                        </button>
                    </div>
                </form>
            </div>

            <div class="preview-pane">
                <h2><i class="fa-regular fa-eye"></i> Preview</h2>
                <div id="preview-content" class="markdown-body">
                    <p style="color:var(--text-muted); font-style:italic;">Start writing to see a live preview...</p>
                </div>
            </div>
        </div>
    `;
}

function setupEditor(id = '') {
    const form = document.getElementById('editor-form');
    const contentArea = document.getElementById('edit-content');
    const previewArea = document.getElementById('preview-content');
    const titleInput = document.getElementById('edit-title');
    const categoryInput = document.getElementById('edit-category');
    const tagsInput = document.getElementById('edit-tags');
    const imageInput = document.getElementById('edit-image');
    const excerptInput = document.getElementById('edit-excerpt');

    if (!form || !contentArea) return;

    // If editing, load existing post
    if (id) {
        (async () => {
            try {
                const post = await api.getPost(id);
                if (post) {
                    titleInput.value = post.title || '';
                    categoryInput.value = post.category || 'Technology';
                    imageInput.value = post.cover_image || post.coverImage || '';
                    excerptInput.value = post.excerpt || '';
                    contentArea.value = post.content || '';
                    const tags = Array.isArray(post.tags) ? post.tags : [];
                    tagsInput.value = tags.join(', ');
                    updatePreview();
                } else {
                    showToast('Post not found', 'error');
                }
            } catch (e) {
                showToast('Failed to load post for editing', 'error');
            }
        })();
    }

    function updatePreview() {
        const title = titleInput.value;
        const content = contentArea.value;
        const cover = imageInput ? imageInput.value.trim() : '';
        let preview = '';
        if (cover) {
            preview += `<img src="${escapeHtml(cover)}" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin-bottom:1.5rem;" onerror="this.style.display='none'">`;
        }
        if (title) preview += `<h1>${escapeHtml(title)}</h1><hr style="margin:1rem 0;">`;
        if (content) {
            preview += marked.parse(content);
        } else {
            preview += '<p style="color:var(--text-muted); font-style:italic;">Start writing to see a live preview...</p>';
        }
        previewArea.innerHTML = preview;
    }

    contentArea.addEventListener('input', debounce(updatePreview, 200));
    titleInput.addEventListener('input', debounce(updatePreview, 200));
    imageInput.addEventListener('input', debounce(updatePreview, 200));

    // Cover image file upload handler
    const coverFileInput = document.getElementById('cover-file-input');
    if (coverFileInput) {
        coverFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                showToast('Uploading cover image...', 'info');
                const res = await api.uploadImage(file);
                imageInput.value = res.url;
                updatePreview();
                showToast('Cover image uploaded!', 'success');
            } catch (err) {
                showToast(err.message || 'Image upload failed', 'error');
            }
        });
    }

    // Drag-and-drop file upload on content textarea
    contentArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        contentArea.style.borderColor = 'var(--primary)';
        contentArea.style.background = '#f8fafc';
    });

    contentArea.addEventListener('dragleave', () => {
        contentArea.style.borderColor = 'var(--border)';
        contentArea.style.background = '';
    });

    contentArea.addEventListener('drop', async (e) => {
        e.preventDefault();
        contentArea.style.borderColor = 'var(--border)';
        contentArea.style.background = '';

        const files = e.dataTransfer.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            const file = files[0];
            try {
                showToast('Uploading dropped image...', 'info');
                const res = await api.uploadImage(file);
                const markdownImg = `\n![${escapeHtml(file.name)}](${res.url})\n`;
                const start = contentArea.selectionStart || contentArea.value.length;
                contentArea.value = contentArea.value.substring(0, start) + markdownImg + contentArea.value.substring(start);
                updatePreview();
                showToast('Image inserted!', 'success');
            } catch (err) {
                showToast(err.message || 'Image upload failed', 'error');
            }
        }
    });

    // Toolbar actions
    document.getElementById('editor-toolbar').addEventListener('click', (e) => {
        const btn = e.target.closest('.toolbar-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const start = contentArea.selectionStart;
        const end = contentArea.selectionEnd;
        const text = contentArea.value;
        const selected = text.substring(start, end);

        let before = '', after = '', placeholder = '';

        switch (action) {
            case 'bold': before = '**'; after = '**'; placeholder = 'bold text'; break;
            case 'italic': before = '*'; after = '*'; placeholder = 'italic text'; break;
            case 'heading': before = '\n### '; after = '\n'; placeholder = 'Heading'; break;
            case 'link': before = '['; after = '](url)'; placeholder = 'link text'; break;
            case 'image': before = '!['; after = '](image-url)'; placeholder = 'alt text'; break;
            case 'code': before = '\n```\n'; after = '\n```\n'; placeholder = 'code here'; break;
            case 'list': before = '\n- '; after = ''; placeholder = 'list item'; break;
            case 'quote': before = '\n> '; after = '\n'; placeholder = 'blockquote'; break;
            case 'hr': before = '\n---\n'; after = ''; placeholder = ''; break;
        }

        const insertion = selected || placeholder;
        contentArea.value = text.substring(0, start) + before + insertion + after + text.substring(end);
        contentArea.focus();

        if (!selected && placeholder) {
            contentArea.selectionStart = start + before.length;
            contentArea.selectionEnd = start + before.length + placeholder.length;
        }

        updatePreview();
    });

    // Save post
    const savePost = async (status) => {
        if (!titleInput.value.trim()) {
            showToast('Title is required', 'error');
            titleInput.focus();
            return;
        }
        if (!contentArea.value.trim()) {
            showToast('Content is required', 'error');
            contentArea.focus();
            return;
        }

        const tagsArr = tagsInput.value
            ? tagsInput.value.split(',').map(t => t.trim()).filter(Boolean)
            : [];

        const postData = {
            title: titleInput.value.trim(),
            category: categoryInput.value,
            tags: tagsArr,
            cover_image: imageInput.value.trim() || null,
            excerpt: excerptInput.value.trim() || null,
            content: contentArea.value,
            status: status
        };

        try {
            if (id) {
                await api.updatePost(id, postData);
                showToast(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
            } else {
                const newPost = await api.createPost(postData);
                showToast(`Post ${status === 'published' ? 'published' : 'saved as draft'}!`, 'success');
                // Redirect to dashboard after creation
                setTimeout(() => { window.location.hash = '#/dashboard'; }, 500);
                return;
            }
        } catch (e) {
            showToast(e.message || 'Error saving post', 'error');
        }
    };

    document.getElementById('btn-save-draft').addEventListener('click', () => savePost('draft'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        savePost('published');
    });

    // Auto-save to localStorage every 30s
    let autoSaveInterval = setInterval(() => {
        if (titleInput.value || contentArea.value) {
            localStorage.setItem('blogforge_autosave', JSON.stringify({
                title: titleInput.value,
                category: categoryInput.value,
                tags: tagsInput.value,
                image: imageInput.value,
                excerpt: excerptInput.value,
                content: contentArea.value,
                savedAt: new Date().toISOString()
            }));
        }
    }, 30000);

    // Check for autosaved content (only for new posts)
    if (!id) {
        const autosaved = localStorage.getItem('blogforge_autosave');
        if (autosaved) {
            try {
                const saved = JSON.parse(autosaved);
                if (saved.title || saved.content) {
                    const restoreBar = document.createElement('div');
                    restoreBar.style.cssText = 'background:#fef3c7; padding:0.75rem 1rem; border-radius:8px; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center;';
                    restoreBar.innerHTML = `
                        <span><i class="fa-solid fa-clock-rotate-left"></i> Auto-saved draft found (${timeAgo(saved.savedAt)})</span>
                        <div>
                            <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.85rem;" id="restore-draft">Restore</button>
                            <button class="btn btn-secondary" style="padding:0.4rem 0.8rem; font-size:0.85rem; margin-left:0.5rem;" id="discard-draft">Discard</button>
                        </div>
                    `;
                    form.insertBefore(restoreBar, form.firstChild);

                    document.getElementById('restore-draft').addEventListener('click', () => {
                        titleInput.value = saved.title || '';
                        categoryInput.value = saved.category || 'Technology';
                        tagsInput.value = saved.tags || '';
                        imageInput.value = saved.image || '';
                        excerptInput.value = saved.excerpt || '';
                        contentArea.value = saved.content || '';
                        updatePreview();
                        restoreBar.remove();
                        showToast('Draft restored!', 'success');
                    });

                    document.getElementById('discard-draft').addEventListener('click', () => {
                        localStorage.removeItem('blogforge_autosave');
                        restoreBar.remove();
                    });
                }
            } catch (e) { /* ignore parse errors */ }
        }
    }
}

// --- DASHBOARD ---
async function renderDashboard() {
    let stats, postsData;

    try {
        stats = await api.getStats();
    } catch (e) {
        stats = { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 };
    }

    try {
        const params = { limit: 100, sort: 'newest' };
        if (state.statusFilter !== 'all') params.status = state.statusFilter;
        postsData = await api.getPosts(params);
    } catch (e) {
        postsData = { posts: [] };
    }

    const posts = postsData.posts || [];

    const rows = posts.length > 0 ? posts.map(post => {
        const dateField = post.created_at || post.date || '';
        return `
        <tr>
            <td>
                <strong>${escapeHtml(post.title)}</strong><br>
                <small style="color:var(--text-muted);">${escapeHtml(post.slug)}</small>
            </td>
            <td>${escapeHtml(post.category || 'Uncategorized')}</td>
            <td>
                <span class="badge ${post.status === 'published' ? 'badge-published' : 'badge-draft'}">
                    ${post.status}
                </span>
            </td>
            <td>${formatDate(dateField)}</td>
            <td>${post.views || 0}</td>
            <td>
                <div class="action-btns">
                    ${post.status === 'published' ? `<a href="#/post/${escapeHtml(post.slug)}" class="action-btn" title="View"><i class="fa-regular fa-eye"></i></a>` : ''}
                    <a href="#/edit/${post.id}" class="action-btn" title="Edit"><i class="fa-regular fa-pen-to-square"></i></a>
                    <button class="action-btn toggle-status" data-id="${post.id}" data-status="${post.status}" title="${post.status === 'published' ? 'Unpublish' : 'Publish'}">
                        <i class="fa-solid ${post.status === 'published' ? 'fa-eye-slash' : 'fa-rocket'}"></i>
                    </button>
                    <button class="action-btn delete" data-id="${post.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-inbox" style="font-size:2rem; display:block; margin-bottom:0.5rem;"></i>No posts yet. <a href="#/write" style="color:var(--primary);">Write your first post!</a></td></tr>';

    return `
        <div class="dashboard">
            <div class="dashboard-header">
                <h1><i class="fa-solid fa-gauge-high"></i> Dashboard</h1>
                <a href="#/write" class="btn btn-primary"><i class="fa-solid fa-plus"></i> New Post</a>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fa-solid fa-file-lines"></i></div>
                    <div class="stat-info">
                        <h3>${stats.totalPosts}</h3>
                        <p>Total Posts</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fa-solid fa-check-circle"></i></div>
                    <div class="stat-info">
                        <h3>${stats.publishedPosts}</h3>
                        <p>Published</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><i class="fa-solid fa-file-pen"></i></div>
                    <div class="stat-info">
                        <h3>${stats.draftPosts}</h3>
                        <p>Drafts</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="stat-info">
                        <h3>${stats.totalViews}</h3>
                        <p>Total Views</p>
                    </div>
                </div>
            </div>

            <div class="table-container">
                <div class="dashboard-filters">
                    <select id="filter-status" class="form-control" style="width: auto;">
                        <option value="all" ${state.statusFilter === 'all' ? 'selected' : ''}>All Status</option>
                        <option value="published" ${state.statusFilter === 'published' ? 'selected' : ''}>Published</option>
                        <option value="draft" ${state.statusFilter === 'draft' ? 'selected' : ''}>Drafts</option>
                    </select>
                    <span style="color:var(--text-muted); font-size:0.9rem;">${posts.length} post${posts.length !== 1 ? 's' : ''}</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Views</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function setupDashboard() {
    // Status filter
    const filterSelect = document.getElementById('filter-status');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            state.statusFilter = e.target.value;
            router();
        });
    }
}

// ==========================================
// Global Event Handlers
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Router
    window.addEventListener('hashchange', router);

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.searchQuery = e.target.value;
            if (window.location.hash === '' || window.location.hash === '#/' || window.location.hash === '#') {
                router();
            } else {
                window.location.hash = '#/';
            }
        }, 500));
    }

    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.toggle('active');
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.remove('active');
        });
    });

    // Global event delegation
    document.getElementById('app').addEventListener('click', (e) => {
        // Delete button
        const delBtn = e.target.closest('.delete');
        if (delBtn) {
            e.preventDefault();
            const id = delBtn.dataset.id;
            showModal('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', async () => {
                try {
                    await api.deletePost(id);
                    showToast('Post deleted successfully', 'success');
                    router();
                } catch (err) {
                    showToast('Failed to delete post', 'error');
                }
            });
        }

        // Toggle publish/draft status
        const toggleBtn = e.target.closest('.toggle-status');
        if (toggleBtn) {
            e.preventDefault();
            const id = toggleBtn.dataset.id;
            const currentStatus = toggleBtn.dataset.status;
            const newStatus = currentStatus === 'published' ? 'draft' : 'published';
            const action = newStatus === 'published' ? 'publish' : 'unpublish';

            showModal(
                `${action.charAt(0).toUpperCase() + action.slice(1)} Post`,
                `Are you sure you want to ${action} this post?`,
                async () => {
                    try {
                        await api.updatePost(id, { status: newStatus });
                        showToast(`Post ${newStatus === 'published' ? 'published' : 'moved to drafts'}!`, 'success');
                        router();
                    } catch (err) {
                        showToast('Failed to update post status', 'error');
                    }
                }
            );
        }

        // Category filter on home page
        const catFilter = e.target.closest('.category-filter');
        if (catFilter) {
            e.preventDefault();
            state.categoryFilter = catFilter.dataset.cat || 'all';
            router();
        }

        // Clear filter button on home page
        if (e.target.closest('#clear-filter-btn')) {
            e.preventDefault();
            state.searchQuery = '';
            state.categoryFilter = 'all';
            const sInput = document.getElementById('searchInput');
            if (sInput) sInput.value = '';
            router();
        }

        // Copy link button
        if (e.target.closest('#copy-link-btn')) {
            navigator.clipboard.writeText(window.location.href).then(() => {
                showToast('Link copied to clipboard!', 'success');
            });
        }
    });

    // Modal Confirm/Cancel
    document.getElementById('modal-cancel').addEventListener('click', () => {
        document.getElementById('modal-overlay').classList.remove('active');
        confirmAction = null;
    });

    document.getElementById('modal-confirm').addEventListener('click', () => {
        if (confirmAction) confirmAction();
    });

    // Close modal on overlay click
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.classList.remove('active');
            confirmAction = null;
        }
    });

    // Initial route
    router();
});
