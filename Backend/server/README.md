
# 💬 Real - Time Chat App - Server API

The server directory serves as the backbone of the application, managing all backend logic, data persistence, and real-time communication. Built using nodeJS, expressJS and MongoDB, it uses Mongoose schemas to model and structure data for Users, Rooms, Messages, PDFs, and Videos stored in MongoDB, while Express routes handle secure REST API endpoints for user authentication and room management. The Socket.io server configuration is present in this directory, enabling instant, bi-directional communication to broadcast messages and media in real time to connect multiple users.

---

## 📂 Directory Structure

```text
server/
├── models/                    # Mongoose schemas
│   ├── Message.js             # Schema for individual chat messages
│   ├── Pdf.js                 # Schema for PDF file metadata 
│   ├── Room.js                # Schema for chat rooms
│   ├── User.js                # Schema for user profiles and authentication
│   └── Video.js               # Schema for video file metadata
├── routes/                    # Express API endpoints
│   ├── room.js                # Routing for fetching, creating, and joining chat rooms
│   ├── user.js                # Routing for authenticating and managing user roles
│   └── users/                 
│       └── update.js          # Routing for updating user profiles
└── server.js                  # Application entry point and Socket.io configuration
```

---

## Usage Guide

This section highlights how the application's backend handles real-time event (via Socket.io) and database operations (via MongoDB) for messaging, managing chat rooms and pdf summarization.

### 💬 Real - Time Messaging Flow

* **Sending a message:** If the user is not blocked, the message is instantly broadcasted to all users in the chat room.
* **Editing a message:** The owner of the message has editing permissions and can edit their messages.
* **Deleting a message:** A message can be deleted by both its user and the moderator.
* **Pinning a message:** Only a moderator can pin a message..
* **Indicators:** When a user is typing an indicator indicating the same is displayed on UI for all users in that chat room. When the user stops typing, the indicator is hidden.
* **Private Messaging:** Users can recieve and send private messages to any user on the same chat room.
* **Create a chat room:** Any user can create a new chat room
* **Moderator privilages:** Mute / Unmute, block / unblock a user.
* **Other features:** Access a list of all available rooms, join a chat room and view a users offline / online status along with last seen timeline.

---

## ⚙️ Getting Started

### Prerequisites
 
Ensure you have Node.js and MongoDB installed locally or have a MongoDB Atlas connection string ready


### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/adithya3010/chat-app.git
```
#### 2. Install dependencies 

```bash
npm install
```

#### 3. Setup environment variables

```bash
PORT=4002
MONGO_URL=your_mongodb_connection_string
```

#### 4. Navigate to the server directory

```bash
cd server
```

#### 5. Start the development server

```bash
npm start
```

App is up and running at `http://localhost:4002`

## 🔄 Data and Logic Flow

The backend logic flows through the directory based on the type of requiest initiated by the client:

### 1. Database Operation (models/)

When a request involves creating or updating persistent data  such as sending a new message, creating a new room or uploading pdf or video files, the server accesses the respective mongoose files written inside the "/models/" directory. It creates a new document instance and validates the payload against the schema rules and saves or updates the data directly in MongoDB.

### 2. REST API Routing (routes/)

Administrative actions such as profile updates or fetching historical room data are handled via standard HTTP requests. The frontend hits the dedicated endpoints located in the "/routes/" folder which processes the business logic to interact with the database.

### 3. Real - Time Event Handling (server.js)

For instant updates, Socket.io runs continuously within `server.js`. It actively listens for incoming WebSocket events from clients and immediately emits real-time responses to all connected users in the chat room.