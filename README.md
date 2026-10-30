# CoDeva — A Real-Time Collaborative Code Editor with AI-Assisted Programming

CoDeva is a full-stack, cloud-grade collaborative programming platform designed for pair programming, student labs, and developer teams. It enables multiple authenticated users to code together in a shared room, synchronize document state in real-time with conflict-free resolution, chat, receive intelligent AI coding assistance, and execute code across multiple programming languages.

Built as an academic software engineering project for **B.Tech Computer Science and Engineering (CSE)**.

---

## 🌟 Key Features

1. **Conflict-Free Real-Time Collaboration**:
   - Powered by **Yjs CRDTs** and **Socket.IO** binary update protocols.
   - Concurrent edits merge without race conditions or whole-file overwrites.
   - Remote cursor indicators and active file tracking for all connected peers.
2. **AI-Assisted Coding Module**:
   - Integrated with the **OpenAI SDK** (`gpt-4o-mini` or custom model).
   - Supports 5 specialized developer actions: *Generate Code*, *Explain Code*, *Debug Code*, *Improve / Refactor*, and *Ask AI*.
   - One-click safe code insertion into the active editor session.
3. **Multi-Language Code Execution**:
   - External code execution engine powered by **Judge0**.
   - Supports **Python 3**, **JavaScript (Node.js)**, **C++ (GCC)**, and **Java**.
   - Standard input (`stdin`), execution status badges, execution time, and memory metrics.
4. **Persistent Project & File Management**:
   - Full CRUD for project files: Create, rename, edit, switch, and delete files.
   - Automatic debounced persistence to MongoDB ensures work is never lost.
5. **Integrated Real-Time Room Chat**:
   - Room-based chat with sender identities and timestamps.
   - Real-time broadcast and persistent storage in MongoDB.
6. **Secure User Accounts & Permissions**:
   - JWT-based authentication with `bcryptjs` password hashing.
   - Role-based room access control (Owner vs Member privileges).
   - Server-side rate limiting on authentication, AI assist, and code execution routes.

---

## 🏗️ Architecture & Technology Stack

```
+-------------------------------------------------------------+
|                     Client (React 18 + Vite)                |
|  Monaco Editor <--> Yjs Doc Binding <--> Socket.IO Client   |
|  Lucide Icons   <--> Axios API Layer <--> React Router DOM   |
+------------------------------+------------------------------+
                               | (HTTP / WebSocket)
+------------------------------v------------------------------+
|                   Backend (Node.js + Express)               |
|  Socket.IO Handshake Auth   |  JWT & Rate Limit Middleware  |
|  Yjs Server Sync Protocol   |  Mongoose ODM Layer           |
+--------------+---------------+--------------+---------------+
               |                              |
      +--------v---------+           +--------v---------+
      |  OpenAI API SDK  |           |    Judge0 API    |
      |  AI Assistant    |           |  Code Execution  |
      +------------------+           +------------------+
               |                              |
      +--------v------------------------------v---------+
      |                 MongoDB Database                |
      |   Users  |  Rooms  |  Files  |  Messages        |
      |  (Supports Local, Atlas, & Embedded Fallback)   |
      +-------------------------------------------------+
```

### Technology Breakdown
- **Frontend**: React 18, Vite, Monaco Editor (`@monaco-editor/react`), Yjs, Socket.IO Client, Lucide React, Axios, React Router v6.
- **Backend**: Node.js (ES Modules), Express.js, Socket.IO Server, Mongoose, JSON Web Tokens (JWT), bcryptjs, dotenv, OpenAI JavaScript SDK.
- **Execution**: Judge0 REST API integration.
- **Database**: MongoDB with automatic embedded `mongodb-memory-server` fallback for instant zero-config evaluation.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22 recommended)
- **npm**: v9.0.0 or higher
- **MongoDB** *(Optional)*: Local MongoDB or MongoDB Atlas URI. If omitted or not running, CoDeva automatically starts a local in-memory MongoDB instance!

---

### 2. Installation

Clone or open the project folder in your terminal:
```bash
cd codeva
npm install
cd server && npm install
cd ../client && npm install
cd ..
```
*Or run the root helper:*
```bash
npm run install:all
```

---

### 3. Environment Configuration

#### Server Configuration (`server/.env`):
Create `server/.env` (copy from `server/.env.example`):
```bash
cp server/.env.example server/.env
```
Default configuration values:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/codeva
JWT_SECRET=codeva_super_secret_jwt_key_at_least_32_characters_long_btech_cs_demo
JWT_EXPIRES_IN=7d

# Optional: Add your OpenAI Key for live AI assistance
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini

# Optional: Judge0 endpoint for remote code execution
JUDGE0_URL=https://ce.judge0.com
JUDGE0_API_KEY=
JUDGE0_AUTH_HEADER=X-Auth-Token
```
> **Note**: If `OPENAI_API_KEY` is not provided, CoDeva displays a helpful setup alert inside the AI panel while keeping the entire rest of the application fully functional.

#### Client Configuration (`client/.env`):
Create `client/.env` (copy from `client/.env.example`):
```bash
cp client/.env.example client/.env
```
Contents:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### 4. Running the Application

You can start both frontend and backend concurrently with a single command from the project root:
```bash
npm run dev
```

Alternatively, start them separately in two terminals:
- **Terminal 1 (Backend Server)**:
  ```bash
  cd server
  npm run dev
  ```
  *Server starts on `http://localhost:5000`.*
- **Terminal 2 (Frontend Client)**:
  ```bash
  cd client
  npm run dev
  ```
  *Client starts on `http://localhost:5173`.*

---

## 🧪 Testing Multi-User Real-Time Collaboration

Follow these steps to demonstrate real-time collaboration during faculty review or viva:

1. **Open Session 1**:
   - Open `http://localhost:5173` in **Google Chrome** (Normal Window).
   - Click **Get Started** and register a user (e.g. name: `Alice`, email: `alice@test.com`, password: `password123`).
   - On the Dashboard, click **Create New Room** (Name: `Viva Demonstration`).
   - Copy the shareable Room ID shown in the top navigation or file explorer header (e.g., `8dF2_kL0`).

2. **Open Session 2**:
   - Open `http://localhost:5173` in **Incognito Window** or **Mozilla Firefox / Edge**.
   - Click **Get Started** and register a second user (e.g. name: `Bob`, email: `bob@test.com`, password: `password123`).
   - On the Dashboard, click **Join Room** and paste the Room ID from Alice.

3. **Verify Collaboration Workflows**:
   - **Presence**: Notice both `Alice` and `Bob` appear in the Active Members panel with online badges and tab counts.
   - **Simultaneous Typing**: Type code in Alice's Monaco Editor — the edits appear instantaneously in Bob's editor with smooth CRDT resolution.
   - **File Operations**: Create a new file `algorithms.py` in Alice's sidebar — the file tree updates in real-time on Bob's screen.
   - **Chat**: Send a message in the Chat panel from Bob — it appears immediately for Alice and is persisted to MongoDB.
   - **Persistence**: Refresh Alice's browser tab. Reopening the room retrieves all saved files and chat history cleanly.

---

## 🔬 Running Automated Test Suite

CoDeva includes an automated test suite verifying all critical application pathways:

```bash
cd server
npm test
```

### Verified Test Suites:
- `tests/auth.test.js`: User registration, duplicate email rejection, short password rejection, login verification, invalid credential rejection, JWT bearer token validation.
- `tests/rooms.test.js`: Room creation with default starter file, user room listing, joining rooms, invalid room ID 404 rejection, room deletion authorization.
- `tests/files.test.js`: Room file listing, file creation, duplicate file rejection, file content update persistence, file renaming, last file deletion prevention.
- `tests/ai.test.js`: Empty prompt validation, missing API key detection and graceful degradation.
- `tests/execute.test.js`: Empty code rejection, unsupported language rejection, payload validation.
- `tests/collaboration.test.js`: Socket.IO handshake authentication, unauthenticated socket rejection, presence tracking, Yjs CRDT synchronization step-1 and step-2, document update broadcast, real-time chat delivery.

---

## 📚 Viva & Faculty Presentation Talking Points

1. **Why Yjs instead of raw Socket.IO broadcasts?**
   - Naive Socket.IO broadcasts send the whole file text on every keystroke, which causes race conditions and overwrites remote edits when two users type simultaneously.
   - Yjs implements **Conflict-free Replicated Data Types (CRDTs)**. Every character insertion and deletion is an immutable operation with a logical clock, guaranteeing mathematical convergence across all connected peers regardless of network latency.

2. **Security Considerations**:
   - Passwords are never stored in plain text; they are hashed with `bcryptjs` using a salt work factor of 10.
   - JWT tokens authenticate both REST API endpoints and the Socket.IO WebSocket handshake.
   - API keys (`OPENAI_API_KEY`, `JUDGE0_API_KEY`) reside exclusively in the backend environment and are never bundled into client JavaScript.
   - In-memory rate limiting prevents brute-force attacks on auth, AI, and execution endpoints.

3. **Zero-Config Developer Experience**:
   - The server features an intelligent database fallback: if a standalone MongoDB instance is not active, it automatically initializes an in-memory MongoDB server so examiners and graders can test the application without manual database setup.

---

## 📄 License
This project is developed for educational and academic assessment purposes under the MIT License.
