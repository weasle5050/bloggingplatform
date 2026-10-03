# BlogForge 🚀

A modern, full-stack blogging platform built with **Node.js/Express**, **SQLite (sql.js)**, and a responsive **HTML5/CSS3/JavaScript SPA**.

---

## ✨ Features

### 📝 Post Creation & Rich Editing
- **Dual-Pane Markdown Editor**: Live side-by-side preview with real-time rendering using Marked.js.
- **Formatting Toolbar**: Quick-action formatting for bold, italic, headings, links, code blocks, lists, quotes, and dividers.
- **Image Upload & Drag-and-Drop**: Upload cover images directly or drag & drop images into the editor body.
- **Auto-Save Drafts**: Automatic background saving every 30 seconds to `localStorage` with a recovery prompt.
- **Smart Slugs & Excerpts**: Auto-generates URL-friendly slugs and clean excerpts from post markdown.

### 🌐 Reader Experience
- **Interactive Home Page**: Hero banner, latest posts grid with card lift animations, category badges, and reading time estimation.
- **Category Filter & Live Search**: Instant search debounce and category sidebar filtering.
- **Article View**: Beautiful typography, responsive layout, view counter, tag pills, and one-click link sharing or Twitter intent.

### 📊 Management Dashboard
- **Analytics Overview**: Live cards tracking Total Posts, Published Posts, Drafts, and Total Views.
- **Post Management Table**: Filter by publication status (`All`, `Published`, `Drafts`).
- **Quick Status Toggle**: 1-click toggle to publish drafts or unpublish posts.
- **Confirmation Modals**: Delete confirmation dialogs to prevent accidental loss.

---

## 🗄️ Database Architecture (SQLite)

### `posts` Table
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Auto-incrementing post ID |
| `title` | TEXT NOT NULL | Blog post title |
| `slug` | TEXT UNIQUE NOT NULL | URL-safe slug identifier |
| `content` | TEXT NOT NULL | Markdown content |
| `excerpt` | TEXT | Short summary |
| `cover_image` | TEXT | URL or local upload path |
| `category` | TEXT | Post category |
| `tags` | TEXT | JSON string array of tags |
| `status` | TEXT | `'draft'` or `'published'` |
| `author` | TEXT | Author name (default: Admin) |
| `views` | INTEGER | View counter |
| `created_at` | DATETIME | Timestamp |
| `updated_at` | DATETIME | Timestamp |

### `categories` Table
Pre-populated with default categories: `Technology`, `Lifestyle`, `Travel`, `Food`, `Health`, `Business`, `Entertainment`.

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/posts` | List posts (`?status=`, `?category=`, `?search=`, `?page=`, `?limit=`, `?sort=`) |
| `GET` | `/api/posts/:slug` | Get post by slug & increment view count |
| `POST` | `/api/posts` | Create new post |
| `PUT` | `/api/posts/:id` | Update post by ID |
| `DELETE` | `/api/posts/:id` | Delete post by ID |
| `GET` | `/api/categories` | Retrieve all categories |
| `GET` | `/api/stats` | Retrieve platform statistics |
| `POST` | `/api/upload` | Multipart form image upload (to `/public/uploads`) |

---

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)
