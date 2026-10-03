const express = require('express');
const initSqlJs = require('sql.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Database file path
const DB_PATH = path.join(__dirname, 'blog.db');

// Global db reference
let db;

// Save database to disk
function saveDb() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// Helper to generate slug
const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// Initialize database
function initDb() {
    db.run(`
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            cover_image TEXT,
            category TEXT DEFAULT 'Uncategorized',
            tags TEXT DEFAULT '[]',
            status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
            author TEXT DEFAULT 'Admin',
            views INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            slug TEXT UNIQUE NOT NULL
        );
    `);

    // Insert default categories
    const categories = [
        { name: 'Technology', slug: 'technology' },
        { name: 'Lifestyle', slug: 'lifestyle' },
        { name: 'Travel', slug: 'travel' },
        { name: 'Food', slug: 'food' },
        { name: 'Health', slug: 'health' },
        { name: 'Business', slug: 'business' },
        { name: 'Entertainment', slug: 'entertainment' }
    ];

    const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)');
    categories.forEach(cat => {
        insertCat.bind([cat.name, cat.slug]);
        insertCat.step();
        insertCat.reset();
    });
    insertCat.free();

    // Seed database if empty
    const countResult = db.exec('SELECT COUNT(*) as count FROM posts');
    const postsCount = countResult[0].values[0][0];

    if (postsCount === 0) {
        const seedPosts = [
            {
                title: 'Getting Started with Web Development',
                slug: 'getting-started-with-web-development',
                content: `## Welcome to Web Development

Web development is an exciting and rapidly evolving field that involves building websites and web applications accessible through the internet. Whether you're building a simple blog or a complex enterprise application, understanding the fundamentals is crucial.

### The Frontend Trinity

The frontend—what users see and interact with—is built upon three core technologies:

- **HTML** (HyperText Markup Language): The skeleton of every webpage. It structures content with elements like headings, paragraphs, images, and links.
- **CSS** (Cascading Style Sheets): The skin and clothing. CSS controls layout, colors, typography, animations, and responsive design.
- **JavaScript**: The brain and muscles. JS adds interactivity—form validation, dynamic content loading, animations, and much more.

### Backend Development

The backend handles data processing, storage, authentication, and business logic. Popular choices include:

1. **Node.js** – JavaScript on the server, enabling full-stack JS development
2. **Python** (Django/Flask) – Clean syntax and rapid development
3. **Ruby on Rails** – Convention over configuration philosophy
4. **Java** (Spring Boot) – Enterprise-grade reliability

### Databases

Data persistence is fundamental. You'll work with:

- **Relational databases** (PostgreSQL, MySQL, SQLite) – Structured data with SQL
- **NoSQL databases** (MongoDB, Redis) – Flexible schema for varied data shapes

### Getting Started: A Roadmap

1. Learn HTML & CSS basics (2-4 weeks)
2. Master JavaScript fundamentals (4-8 weeks)
3. Build projects—start small, iterate
4. Learn a backend framework
5. Understand databases and APIs
6. Deploy your first application

> "The best way to learn programming is by programming." – Every developer ever

The journey of a thousand lines of code begins with a single \`console.log('Hello, World!')\`. Start today, stay curious, and never stop building.`,
                excerpt: 'A comprehensive guide to starting your journey in web development, covering frontend, backend, databases, and a practical roadmap for beginners.',
                cover_image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1200',
                category: 'Technology',
                tags: '["HTML", "CSS", "JavaScript", "Backend", "Beginner"]',
                status: 'published'
            },
            {
                title: 'The Art of Productive Morning Routines',
                slug: 'the-art-of-productive-morning-routines',
                content: `## Master Your Morning, Master Your Life

How you start your day often determines how the rest of it unfolds. Research consistently shows that people who follow intentional morning routines report higher levels of productivity, better mental health, and greater life satisfaction.

### The Science Behind Morning Routines

Our willpower and decision-making abilities are at their peak in the morning. This phenomenon, known as **decision fatigue**, means that the early hours are your golden window for tackling important tasks and establishing positive habits.

### Building Your Ideal Morning

#### 1. Wake Up with Purpose
Set your alarm 30 minutes earlier than usual. Place your phone across the room so you must physically get up to silence it. This small act of discipline sets the tone for the entire day.

#### 2. Hydration First
After 7-8 hours of sleep, your body is dehydrated. Drink a full glass of water—optionally with lemon—before reaching for coffee. This jumpstarts your metabolism and helps flush toxins.

#### 3. Move Your Body
Even 10 minutes of physical activity transforms your morning:
- **Yoga** for flexibility and mindfulness
- **Brisk walking** for gentle cardio
- **HIIT** for an energy boost
- **Stretching** to release tension

#### 4. Mindfulness & Reflection
Spend 5-10 minutes in meditation or journaling. Apps like Headspace or a simple gratitude journal can help. Write down:
- 3 things you're grateful for
- Your top 3 priorities for the day
- One affirmation

#### 5. Fuel Your Body Right
A nutritious breakfast is non-negotiable:
- **Oatmeal** with berries and nuts
- **Eggs** with whole-grain toast and avocado
- **Smoothie** with greens, protein, and healthy fats

### The Compound Effect

Small morning improvements compound over time. A 1% improvement each day leads to being 37 times better in a year. Your morning routine is the foundation upon which extraordinary days are built.

> "Either you run the day, or the day runs you." — Jim Rohn`,
                excerpt: 'Discover how to craft a morning routine that boosts productivity, enhances focus, and sets a positive tone for your entire day with science-backed strategies.',
                cover_image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1200',
                category: 'Lifestyle',
                tags: '["Productivity", "Wellness", "Habits", "Morning"]',
                status: 'published'
            },
            {
                title: 'Hidden Gems: Unexplored Destinations Worth Discovering',
                slug: 'hidden-gems-unexplored-destinations',
                content: `## Travel Off the Beaten Path

While Paris, New York, and Tokyo will always captivate travelers, there's an unmatched magic in discovering places that haven't been overrun by tourism. These hidden gems offer authentic experiences, genuine connections with locals, and stories you won't find in any guidebook.

### Why Choose Unexplored Destinations?

- **Authenticity**: Experience culture as it truly is, not a curated version for tourists
- **Affordability**: Less tourism often means lower prices
- **Solitude**: Enjoy breathtaking scenery without fighting crowds
- **Impact**: Your tourist dollars make a bigger difference in smaller communities

### Five Hidden Gems to Add to Your Bucket List

#### 1. Chefchaouen, Morocco
Known as the "Blue Pearl," this mountain town features buildings painted in striking shades of blue. Wander through narrow alleyways, sip mint tea with artisans, and watch the sunset paint the Rif Mountains in gold.

#### 2. Kotor, Montenegro
A stunning medieval town nestled between dramatic mountains and a serene bay. The old town is a UNESCO World Heritage Site, with ancient churches, charming squares, and the famous fortress hike offering panoramic views.

#### 3. Luang Prabang, Laos
Where French colonial architecture meets golden Buddhist temples. Wake early to watch monks collecting alms at dawn, explore the night market, and take a boat up the Mekong to the Pak Ou Caves.

#### 4. Faroe Islands, Denmark
Rugged, wild, and otherworldly. These North Atlantic islands feature dramatic cliffs, grass-roofed villages, and some of the most spectacular hiking trails in Europe. The weather changes every five minutes—embrace it.

#### 5. Oaxaca, Mexico
A vibrant cultural capital with world-class cuisine. Visit the ancient ruins of Monte Albán, sample mezcal straight from the source, and experience the incredible street art scene.

### Tips for Traveling Off the Beaten Path

1. **Learn basic phrases** in the local language
2. **Stay in locally-owned accommodations** rather than international chains
3. **Be flexible** with your itinerary—the best discoveries are unplanned
4. **Travel light** for easier navigation
5. **Respect local customs** and ask before photographing people

> "Not all those who wander are lost." — J.R.R. Tolkien

The world is vast, and its greatest treasures often lie where the crowds haven't yet found them. Pack your bags, leave the guidebook behind, and let curiosity be your compass.`,
                excerpt: 'Explore the magic of traveling off the beaten path—from Morocco\'s Blue Pearl to the wild Faroe Islands—and discover destinations that offer authentic, unforgettable experiences.',
                cover_image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=1200',
                category: 'Travel',
                tags: '["Travel", "Adventure", "Culture", "Hidden Gems"]',
                status: 'published'
            }
        ];

        const insertPost = db.prepare(`
            INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        seedPosts.forEach(post => {
            insertPost.bind([post.title, post.slug, post.content, post.excerpt, post.cover_image, post.category, post.tags, post.status]);
            insertPost.step();
            insertPost.reset();
        });
        insertPost.free();
    }

    saveDb();
}

// Helper: run a query and return all rows as objects
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

// Helper: run a query and return one row as object
function queryOne(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length) stmt.bind(params);
    let row = null;
    if (stmt.step()) {
        row = stmt.getAsObject();
    }
    stmt.free();
    return row;
}

// Helper: run a statement (INSERT/UPDATE/DELETE)
function runStmt(sql, params = []) {
    db.run(sql, params);
    saveDb();
}

// ===================== API Routes =====================

// 1. GET /api/posts
app.get('/api/posts', (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 10, sort = 'newest' } = req.query;
        let whereClause = '1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        if (search) {
            whereClause += ' AND (title LIKE ? OR content LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        let orderClause;
        if (sort === 'oldest') {
            orderClause = 'ORDER BY created_at ASC';
        } else if (sort === 'popular') {
            orderClause = 'ORDER BY views DESC';
        } else {
            orderClause = 'ORDER BY created_at DESC';
        }

        // Get total count
        const countRow = queryOne(`SELECT COUNT(*) as total FROM posts WHERE ${whereClause}`, params);
        const total = countRow ? countRow.total : 0;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const allParams = [...params, parseInt(limit), parseInt(offset)];
        const posts = queryAll(
            `SELECT * FROM posts WHERE ${whereClause} ${orderClause} LIMIT ? OFFSET ?`,
            allParams
        );

        // Parse tags back to array
        const processedPosts = posts.map(post => ({
            ...post,
            tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags
        }));

        res.json({
            posts: processedPosts,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('GET /api/posts error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. GET /api/posts/:slug
app.get('/api/posts/:slug', (req, res) => {
    try {
        const post = queryOne('SELECT * FROM posts WHERE slug = ?', [req.params.slug]);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Increment views
        runStmt('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);
        post.views += 1;
        post.tags = typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags;

        res.json(post);
    } catch (error) {
        console.error('GET /api/posts/:slug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. POST /api/posts
app.post('/api/posts', (req, res) => {
    try {
        const { title, content, cover_image, category, tags = [], status = 'draft', author = 'Admin' } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        let { slug, excerpt } = req.body;

        if (!slug) {
            slug = generateSlug(title);
            // Make slug unique by appending timestamp if needed
            const existing = queryOne('SELECT id FROM posts WHERE slug = ?', [slug]);
            if (existing) {
                slug = slug + '-' + Date.now();
            }
        }

        if (!excerpt) {
            // Strip markdown for excerpt
            const plainText = content.replace(/[#*_`~\[\]()>!|-]/g, '').trim();
            excerpt = plainText.substring(0, 160) + (plainText.length > 160 ? '...' : '');
        }

        const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags);

        runStmt(`
            INSERT INTO posts (title, slug, content, excerpt, cover_image, category, tags, status, author)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, slug, content, excerpt, cover_image || null, category || 'Uncategorized', tagsStr, status, author]);

        // Get the newly created post by slug
        const newPost = queryOne('SELECT * FROM posts WHERE slug = ?', [slug]);
        if (newPost) {
            newPost.tags = typeof newPost.tags === 'string' ? JSON.parse(newPost.tags) : newPost.tags;
        }

        res.status(201).json(newPost);
    } catch (error) {
        console.error('POST /api/posts error:', error);
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'A post with this slug already exists' });
        }
        res.status(500).json({ error: error.message });
    }
});

// 4. PUT /api/posts/:id
app.put('/api/posts/:id', (req, res) => {
    try {
        const existingPost = queryOne('SELECT * FROM posts WHERE id = ?', [parseInt(req.params.id)]);
        if (!existingPost) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const { title, slug, content, excerpt, cover_image, category, tags, status, author } = req.body;

        const updates = [];
        const params = [];

        if (title !== undefined) { updates.push('title = ?'); params.push(title); }
        if (slug !== undefined) { updates.push('slug = ?'); params.push(slug); }
        if (content !== undefined) { updates.push('content = ?'); params.push(content); }
        if (excerpt !== undefined) { updates.push('excerpt = ?'); params.push(excerpt); }
        if (cover_image !== undefined) { updates.push('cover_image = ?'); params.push(cover_image); }
        if (category !== undefined) { updates.push('category = ?'); params.push(category); }
        if (tags !== undefined) {
            const tagsStr = typeof tags === 'string' ? tags : JSON.stringify(tags);
            updates.push('tags = ?');
            params.push(tagsStr);
        }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (author !== undefined) { updates.push('author = ?'); params.push(author); }

        updates.push("updated_at = datetime('now')");

        if (updates.length === 1) { // Only updated_at
            existingPost.tags = typeof existingPost.tags === 'string' ? JSON.parse(existingPost.tags) : existingPost.tags;
            return res.json(existingPost);
        }

        const query = `UPDATE posts SET ${updates.join(', ')} WHERE id = ?`;
        params.push(parseInt(req.params.id));
        runStmt(query, params);

        const updatedPost = queryOne('SELECT * FROM posts WHERE id = ?', [parseInt(req.params.id)]);
        if (updatedPost) {
            updatedPost.tags = typeof updatedPost.tags === 'string' ? JSON.parse(updatedPost.tags) : updatedPost.tags;
        }

        res.json(updatedPost);
    } catch (error) {
        console.error('PUT /api/posts/:id error:', error);
        if (error.message && error.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Slug must be unique' });
        }
        res.status(500).json({ error: error.message });
    }
});

// 5. DELETE /api/posts/:id
app.delete('/api/posts/:id', (req, res) => {
    try {
        const existing = queryOne('SELECT id FROM posts WHERE id = ?', [parseInt(req.params.id)]);
        if (!existing) {
            return res.status(404).json({ error: 'Post not found' });
        }
        runStmt('DELETE FROM posts WHERE id = ?', [parseInt(req.params.id)]);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('DELETE /api/posts/:id error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 6. GET /api/categories
app.get('/api/categories', (req, res) => {
    try {
        const categories = queryAll('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (error) {
        console.error('GET /api/categories error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 7. GET /api/stats
app.get('/api/stats', (req, res) => {
    try {
        const totalPosts = queryOne('SELECT COUNT(*) as count FROM posts');
        const publishedPosts = queryOne("SELECT COUNT(*) as count FROM posts WHERE status = 'published'");
        const draftPosts = queryOne("SELECT COUNT(*) as count FROM posts WHERE status = 'draft'");
        const totalViews = queryOne('SELECT COALESCE(SUM(views), 0) as total FROM posts');
        const topCategories = queryAll(`
            SELECT category, COUNT(*) as count
            FROM posts
            GROUP BY category
            ORDER BY count DESC
            LIMIT 5
        `);

        res.json({
            totalPosts: totalPosts ? totalPosts.count : 0,
            publishedPosts: publishedPosts ? publishedPosts.count : 0,
            draftPosts: draftPosts ? draftPosts.count : 0,
            totalViews: totalViews ? totalViews.total : 0,
            topCategories
        });
    } catch (error) {
        console.error('GET /api/stats error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 8. POST /api/upload
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const url = `/uploads/${req.file.filename}`;
        res.json({ url });
    } catch (error) {
        console.error('POST /api/upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Catch-all: serve index.html for SPA routing
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Initialize and start server
async function start() {
    try {
        const SQL = await initSqlJs();

        // Load existing database or create new one
        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(fileBuffer);
            console.log('Loaded existing database from disk.');
        } else {
            db = new SQL.Database();
            console.log('Created new database.');
        }

        initDb();

        app.listen(port, () => {
            console.log(`\n  🚀 BlogForge is running!`);
            console.log(`  📝 Open http://localhost:${port} in your browser\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
