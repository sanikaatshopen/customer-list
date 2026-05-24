# 📋 Customer List

A beginner-friendly full-stack CRUD app built with **Node.js Express** + **Angular** + **MongoDB**.

## 📁 Project Structure

```
customer-list/
├── backend/
│   ├── server.js          ← Express server (entry point)
│   ├── .env               ← Environment variables (MongoDB URI, port, JWT secret)
│   ├── 01_auth.js         ← Authentication routes (/auth/signup, /auth/login)
│   ├── 02_customers.js    ← Customer CRUD routes (/customers)
│   └── package.json
│
├── frontend/              ← Angular app
│   └── src/app/
│       ├── services/      ← API call logic (auth, customers)
│       ├── guards/        ← Route protection
│       ├── pages/
│       │   ├── login/     ← Login & Signup page
│       │   └── customers/ ← Customer list + add/edit/delete
│       └── ...
│
└── README.md              ← You are here!
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [MongoDB](https://www.mongodb.com/) (running locally or a cloud URI like MongoDB Atlas)

### 1. Setup Backend

```bash
cd backend
npm install
```

Edit the `.env` file with your MongoDB connection string:

```env
MONGO_URI=mongodb://localhost:27017/customer-list
PORT=3000
JWT_SECRET=my_super_secret_key_change_me
```

Start the server:

```bash
npm start
# or for development (auto-restart on file changes):
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm start
```

Open your browser at **http://localhost:4200**

## 🔑 How It Works

1. **Sign Up** — Create an account with a username and password
2. **Login** — Get a JWT token stored in your browser
3. **Add Customers** — Fill in name, email, phone
4. **View** — See only YOUR customers in a table
5. **Edit** — Click edit to update customer details in a modal
6. **Delete** — Remove a customer with confirmation

## 🧩 Adding New Features

Want to add date of birth, interests, or other fields? Follow this pattern:

1. Create a new file in `backend/` — e.g. `03_details.js`
2. Define a new model or extend the customer model
3. Add routes for the new feature
4. Mount it in `server.js`: `app.use('/details', require('./03_details'))`
5. Create a matching Angular service + page in the frontend

## 🛠️ Tech Stack

| Layer     | Technology       |
|-----------|-----------------|
| Frontend  | Angular 21      |
| Styling   | Bootstrap 5     |
| Backend   | Node.js Express |
| Database  | MongoDB         |
| Auth      | JWT + bcrypt    |