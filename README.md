# 🥗 AI NutriChef — Your Personal AI Kitchen Companion

**Plan smarter. Eat healthier. Waste less.**

AI NutriChef is an AI-powered nutrition assistant and intelligent meal-planning platform built using the **MERN stack** and Anthropic's Claude API. It transforms everyday ingredients into personalized recipes, creates balanced weekly meal plans, generates consolidated grocery lists, and provides real-time nutrition guidance through an interactive AI chatbot.

Whether you're working toward weight loss, muscle gain, or a healthier lifestyle, AI NutriChef helps simplify your everyday food decisions.

## ✨ Key Features

### 🤖 AI-Powered Recipe Generation
- Generate personalized recipes using ingredients you already have.
- Customize recipes based on dietary goals, cuisine preferences, and allergies.
- Get recipe instructions, serving sizes, and estimated nutritional macros.
- Reduce food waste by making better use of available ingredients.

### 📅 Intelligent Weekly Meal Planner
- Generate a complete 7-day meal plan.
- Organize meals into a structured weekly calendar.
- Explore individual recipes and their preparation details.
- Align meal suggestions with personal nutrition goals.

### 🛒 Smart Grocery List
- Automatically generate shopping lists from weekly meal plans.
- Consolidate duplicate ingredients and aggregate quantities where compatible.
- Organize groceries into categories such as produce, protein, dairy, spices, and pantry essentials.
- Track purchased items using interactive checklists.

### 💬 Real-Time AI Nutrition Chatbot
- Chat with NutriChef for food ideas and general nutrition guidance.
- Stream AI responses token by token using Socket.IO.
- Display typing indicators for a responsive conversational experience.
- Maintain chat history for supported sessions.

### ❤️ Saved Recipes & Favorites
- Save recipes for future use.
- Browse and manage your favorite recipes.
- Filter saved recipes by meal type and tags.

### 🔐 Secure Authentication & User Profiles
- Register and sign in using JWT-based authentication.
- Hash passwords before storing them.
- Protect private API routes with authentication middleware.
- Save dietary preferences, allergies, and daily calorie targets.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Artificial Intelligence | Anthropic Claude API |
| Authentication | JSON Web Tokens (JWT), password hashing |
| API Communication | Axios, REST APIs |
| Real-Time Communication | Socket.IO, WebSockets |
| Validation | Zod |
| Testing | Jest, Supertest |
| Deployment | Vercel, Render |

## 🏗️ System Architecture

```text
                  ┌──────────────────────────┐
                  │      React Frontend      │
                  │     Vite + Tailwind      │
                  └────────────┬─────────────┘
                               │
                  ┌────────────┴─────────────┐
                  │                          │
             REST APIs                 Socket.IO
             (Axios)                 (Real-Time Chat)
                  │                          │
                  └────────────┬─────────────┘
                               │
                  ┌────────────▼─────────────┐
                  │    Express.js Backend    │
                  │  Authentication & APIs   │
                  └────────┬─────────┬───────┘
                           │         │
                 ┌─────────▼───┐  ┌──▼────────────────┐
                 │  MongoDB    │  │  Anthropic Claude │
                 │  Database   │  │     API / AI      │
                 └─────────────┘  └───────────────────┘
```

## 📂 Project Structure

```text
ai-nutrichef/
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # Authentication state
│   │   ├── hooks/            # Custom React hooks
│   │   ├── pages/            # Application pages
│   │   ├── services/         # API client and interceptors
│   │   ├── App.jsx           # Application routing
│   │   ├── index.css         # Global styles
│   │   └── main.jsx          # React entry point
│   ├── package.json
│   └── vercel.json
│
├── server/
│   ├── config/               # Database configuration
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Authentication and error handling
│   ├── models/               # Mongoose schemas
│   ├── routes/               # REST API routes
│   ├── services/             # Claude AI integration
│   ├── sockets/              # Real-time chat handling
│   ├── tests/                # Integration tests
│   ├── utils/                # Helpers and database seeder
│   ├── server.js             # Backend entry point
│   └── package.json
│
├── package.json              # Root scripts
├── render.yaml               # Render deployment configuration
└── README.md
```

## 🚀 Getting Started

Follow these steps to run AI NutriChef locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) — version 18 or higher
- npm — version 9 or higher
- A MongoDB local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- An Anthropic API key for live AI-generated responses

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ai-nutrichef
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Install Dependencies

From the project root, run:

```bash
npm run install-all
```

This assumes the root `package.json` defines the `install-all` script.

### 3. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-nutrichef
JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_anthropic_api_key
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Important:**
- Never commit your `.env` file or expose API keys in your frontend.
- Use a strong, unique JWT secret.
- Configure your MongoDB URI and Anthropic API key before running the application.

**Mock AI mode:** If your backend implements the mock fallback described in this project, you can use its supported mock configuration to test the application without live Claude API access. Check `server/services/aiService.js` for the exact behavior.

### 4. Seed the Database (Optional)

To populate the database with demo data, run:

```bash
npm run seed --prefix server
```

If the seeder creates the demo account, use the following credentials for local testing:

- **Email:** `demo@example.com`
- **Password:** `password123`

Use demo credentials only in a development environment. Change or remove seeded credentials before any production use.

### 5. Start the Application

Run the development command from the project root:

```bash
npm run dev
```

Open the application at:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

The commands above assume your root scripts and environment configuration match the project structure.

---

## 🔌 API Documentation

All endpoints below use the `/api` prefix unless otherwise specified.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Get the authenticated user's profile |
| PUT | `/api/auth/me/profile` | Update dietary and nutrition preferences |

### Recipes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/recipes/generate` | Generate a recipe using AI |
| POST | `/api/recipes` | Save a recipe |
| GET | `/api/recipes` | Retrieve saved recipes with supported filters |
| DELETE | `/api/recipes/:id` | Delete a saved recipe |

### Meal Planning

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/meal-plans/generate` | Generate a weekly meal plan |
| GET | `/api/meal-plans` | Retrieve saved meal plans |
| GET | `/api/meal-plans/:id` | Retrieve a specific meal plan |

### Grocery Lists

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/grocery-lists/generate/:mealPlanId` | Generate a grocery list |
| GET | `/api/grocery-lists` | Retrieve grocery lists |
| GET | `/api/grocery-lists/:id` | Retrieve a specific grocery list |
| PATCH | `/api/grocery-lists/:id/items/:itemId` | Update an item's checked state |

### Chat History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/chat/history/:sessionId` | Retrieve messages for a chat session |

**Note:** Protected endpoints require valid authentication. The actual request payloads, response formats, and authorization requirements are defined by the backend implementation.

---

## 🧪 Testing

The backend uses Jest and Supertest for automated integration testing.

Run the tests from the server directory:

```bash
cd server
npm run test
```

The available tests depend on the test files and scripts configured in your project.

## 🌐 Deployment

AI NutriChef is structured for separate frontend and backend deployments.

### Backend — Render

1. Connect the GitHub repository to Render.
2. Configure the backend service using `render.yaml`, if it is compatible with your repository settings.
3. Set the appropriate build and start commands.
4. Add production environment variables, including `MONGO_URI`, `JWT_SECRET`, `ANTHROPIC_API_KEY`, and `CLIENT_URL`.
5. Verify database connectivity and API responses after deployment.

### Frontend — Vercel

1. Import the GitHub repository into Vercel.
2. Set the project root directory to `client`.
3. Configure the production build settings.
4. Set the frontend environment variables:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

5. Deploy the frontend and confirm that REST API requests and Socket.IO connections work correctly.

**Deployment configuration files:**
- Backend: [`render.yaml`](./render.yaml)
- Frontend: [`client/vercel.json`](./client/vercel.json)

Replace example URLs with your actual deployment URLs. The configuration files must match the build settings and deployment structure of your repository.

---

## 🔒 Security Considerations

- Store secrets in environment variables, not source code.
- Hash passwords using an appropriate password-hashing algorithm.
- Validate incoming requests on the server.
- Protect private routes and authenticate WebSocket connections.
- Configure CORS to allow only trusted frontend origins.
- Apply rate limits to expensive AI-generation endpoints.
- Avoid logging authentication tokens or sensitive user data.
- Treat AI-generated nutrition information as an estimate, not a medical diagnosis or personalized clinical advice.

## 🔮 Future Enhancements

Potential improvements for future versions include:

- 📊 Nutrition analytics dashboard with calorie and macronutrient tracking.
- 🥦 Ingredient substitutions based on dietary restrictions.
- 📱 Mobile-friendly progressive web app experience.
- 💰 Budget-aware meal planning and grocery estimates.
- 📈 Progress tracking for long-term nutrition goals.
- 🧾 Recipe export and printable grocery lists.

## 🎯 Project Goals

AI NutriChef demonstrates how modern full-stack technologies can be combined to build a practical AI-powered application. It brings together:

- Full-stack development using the MERN stack.
- AI integration through the Anthropic API.
- Real-time communication with Socket.IO.
- Secure authentication and database persistence.
- REST API design and backend integration testing.
- Deployment workflows for modern cloud platforms.

## 🤝 Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request describing your improvements.

## 📄 License

Add a license file to the repository if you intend to distribute this project under an open-source license.

---

**Built with ❤️ using React, Node.js, MongoDB, and AI.**

*AI NutriChef — Making healthy eating simpler, smarter, and more accessible.*
