# OpenRouter Model Comparison

A web application to compare pricing and context length of 345+ Large Language Models available on OpenRouter.

![OpenRouter Model Comparison](https://img.shields.io/badge/Models-345+-blue) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black) ![React](https://img.shields.io/badge/React-18-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?logo=buymeacoffee&logoColor=white)](https://www.buymeacoffee.com/dracohu2027)

## 🚀 Features

- **Real-time Data**: Fetches latest model information directly from OpenRouter API
- **345+ Models**: Compare all available LLMs including GPT, Claude, Gemini, Llama, and more
- **Smart Filtering**: Search by model name, ID, or provider
- **Sortable Columns**: Sort by price, context length, provider, etc.
- **Admin Panel**: Configure default model list with password protection
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Modern, eye-friendly dark UI

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS with custom design system
- **Backend**: Vercel Serverless Functions
- **Authentication**: HTTP Basic Auth for admin panel
- **Deployment**: Vercel

## 📁 Project Structure

```
├── api/
│   ├── models.js      # Fetch all models from OpenRouter (with 1h cache)
│   └── config.js      # Admin configuration API (requires auth)
├── src/
│   ├── App.tsx        # Main comparison page
│   ├── pages/
│   │   └── AdminPage.tsx   # Admin panel (/admin)
│   ├── components/
│   │   ├── ModelTable.tsx      # Sortable model table
│   │   └── ModelSelector.tsx   # Add model dropdown
│   └── types.ts       # TypeScript interfaces
├── vercel.json        # Vercel deployment config
└── package.json
```

## 🚀 Deploy to Vercel

### 1. Fork or Clone

```bash
git clone https://github.com/dracohu2025-cloud/OpenRouter_Model_Compare.git
cd OpenRouter_Model_Compare
```

### 2. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dracohu2025-cloud/OpenRouter_Model_Compare)

Or manually:
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the GitHub repository
3. Deploy with default settings

### 3. Configure Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add the following:

| Variable | Value | Required |
|----------|-------|----------|
| `ADMIN_PASSWORD` | Your secure password | ✅ Yes |
| `ADMIN_USERNAME` | Custom username | ❌ No (default: `admin`) |
| `DEFAULT_MODELS` | Comma-separated model IDs | ❌ No (persists admin config) |

**Example `DEFAULT_MODELS`:**
```
openai/gpt-4o,anthropic/claude-sonnet-4,google/gemini-2.5-pro-preview-06-05
```

3. Redeploy to apply changes

> **Note**: When you save in Admin Panel, it will show the value to copy into `DEFAULT_MODELS` for persistence across deployments.

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/models` | GET | No | Get all models with pricing |
| `/api/config` | GET | No | Get default model configuration |
| `/api/config` | POST | Yes | Update default model list |

## 📝 Usage

### Home Page (/)

- View default model comparison list
- Click **➕ Add Model** to add more models
- Click **🔄 Reset** to restore default list
- Sort by clicking column headers
- Hover over modality icons for detailed info

### Admin Panel (/admin)

- Login with admin credentials
- Search and select default models
- Save to update for all users

## 📄 License

MIT License - feel free to use and modify for your own projects.

## 🙏 Credits

- Data source: [OpenRouter API](https://openrouter.ai/api/v1/models)
- Built with [Vite](https://vitejs.dev/) + [React](https://react.dev/)
