# Simple CRUD Application

A modern CRUD application built with FastAPI (backend) and React (frontend).

## Project Structure

```
.
├── backend/         # FastAPI backend
└── frontend/        # Angular frontend
```

## Setup Instructions

### Backend Setup
1. Navigate to the backend directory
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to the frontend directory
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Features
- Create, Read, Update, and Delete operations
- Modern, responsive UI
- RESTful API
- Data persistence with SQLite 