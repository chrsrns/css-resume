# CSS Resume

A modern, responsive online resume web application with real-time updates and print-to-PDF functionality. Built with vanilla JavaScript, Tailwind CSS, and Webpack, this project dynamically fetches and displays professional resume data from a backend API.

## ✨ Features

- **📱 Responsive Design** – Optimized for all screen sizes with Tailwind CSS
- **⚡ Real-Time Updates** – WebSocket integration for live resume content changes
- **🎨 Skeleton Loading** – Smooth loading placeholders for better UX
- **🖨️ Print-Optimized** – Auto-adjusts layout for PDF export (67% zoom, limited sections)
- **🔄 Progressive Rendering** – Sections load independently for faster perceived performance
- **🔌 Auto-Reconnect** – WebSocket reconnection with linear backoff (up to 5 retries)
- **🎯 Modular Architecture** – Clean separation of API, WebSocket, and rendering logic
- **📦 Modern Tooling** – Webpack bundling, hot reload, and development proxy

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher recommended)
- npm or yarn
- Backend API server running on `http://localhost:8000` (for development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/chrsrns/css-resume.git
cd css-resume
```

2. Install dependencies:
```bash
npm install
```

The application will open automatically at `http://localhost:8080/css-resume/`.

## 🔧 Configuration

The application can be configured via the global `window.__CONFIG__` object, typically injected in the HTML or at runtime:

```javascript
window.__CONFIG__ = {
  API_BASE_URL: "/api",  // Backend API endpoint
  RESUME_ID: 1           // Resume ID to fetch
};
```

### Development Proxy

The webpack dev server proxies `/api` requests to `http://localhost:8000` by default. Modify `webpack.config.dev.js` to change the backend URL:

```javascript
proxy: [
  {
    context: ["/api"],
    target: "http://your-backend-server:port",
    changeOrigin: true,
  },
]
```

## 📖 Usage

### Development

Run the development server with hot reload:
```bash
npm start
```

Run the `tailwindcss` process to watch for changes:
```bash
npx tailwindcss -i ./css/input-tailwind.css -o ./css/style.css --watch
```

## 🛠️ Technologies

- **[Webpack 5](https://webpack.js.org/)** – Module bundler and dev server
- **[Tailwind CSS 3](https://tailwindcss.com/)** – Utility-first CSS framework
- **[Prettier](https://prettier.io/)** – Code formatter with Tailwind plugin
- **Vanilla JavaScript (ES6+)** – No framework dependencies
- **WebSocket API** – Real-time bidirectional communication
- **[Date Format Library](https://github.com/felixge/node-dateformat)** – Date formatting utilities

## 📁 Project Structure

```
css-resume/
├── css/
│   ├── input-tailwind.css    # Tailwind source with print styles
│   └── style.css             # Compiled Tailwind output
├── js/
│   ├── app.js                # Main application logic
│   ├── date.format.js        # Date formatting utilities
│   └── vendor/               # Third-party scripts
├── img/                      # Profile photos and project thumbnails
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
├── webpack.common.js         # Shared Webpack config
├── webpack.config.dev.js     # Development Webpack config
└── webpack.config.prod.js    # Production Webpack config
```

## 📡 API Integration

### Expected Endpoints

The application expects the following REST API endpoints, all relative to the configured `API_BASE_URL` (e.g. `/api`):

- `GET /resume/:id` – Fetch resume metadata
- `GET /resume/:id/skills` – Technical skills
- `GET /resume/:id/education` – Education history
- `GET /resume/:id/education/:educationId/key_points` – Key points for an education entry
- `GET /resume/:id/work_experiences` – Work experience
- `GET /resume/:id/work_experiences/:workExperienceId/key_points` – Key points for a work experience entry
- `GET /resume/:id/portfolio_projects` – Portfolio projects
- `GET /resume/:id/portfolio_projects/:portfolioProjectId/key_points` – Key points for a project
- `GET /resume/:id/portfolio_projects/:portfolioProjectId/technologies` – Technologies used by a project
- `GET /resume/:id/languages` – Programming languages
- `GET /resume/:id/languages/:languageId/frameworks` – Frameworks for a language

### WebSocket Events

The application subscribes to real-time updates via WebSocket:

**Client → Server:**
```json
{
  "type": "subscribe",
  "resume_id": 1,
  "token": "optional-auth-token"
}
```

**Server → Client:**
```json
{
  "type": "resume.changed",
  "resume_id": 1,
  "action": {
    "updated": "education"
  }
}
```

Supported update types: `personalinfo`, `education`, `frameworks`, `languages`, `projects`, `skills`, `experience`

## 🖨️ Print/PDF Export

Click the **"Save as PDF"** button or use your browser's print function (`Ctrl+P` / `Cmd+P`). The print layout automatically:

- Scales content to 67% zoom for optimal page fitting
- Hides navigation elements and interactive buttons
- Limits portfolio projects to first 6 entries
- Preserves colors with `print-color-adjust: exact`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Christian Louise B. Aranas

## 👤 Author

**Christian Louise Aranas**

- Email: [aranaschristianlouise@gmail.com](mailto:aranaschristianlouise@gmail.com)
- GitHub: [@chrsrns](https://github.com/chrsrns)
- Location: Cabuyao, Laguna
