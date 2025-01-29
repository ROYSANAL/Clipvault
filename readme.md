# Clipvault

A RESTful backend API for **Clipvault**, a platform that allows users to register, log in, and save videos, similar to YouTube. This project provides user authentication and video management features, built with **Node.js**, **Express**, and **MongoDB**.

## Key Features:

- **User Registration**: Users can create an account to access the platform.
- **User Authentication**: Secure login and token-based authentication (JWT).
- **Video Management**: Users can save videos and manage their profiles.
- **Error Handling**: Global error handling and custom middlewares to ensure a smooth experience.
- **File Uploads**: Support for video uploads and storage, with the option for cover images.

## Tech Stack:

- **Node.js** for backend server
- **Express.js** for routing and API management
- **MongoDB** for database
- **JWT** for secure authentication
- **Multer** for handling file uploads
- **bcryptjs** for hashing passwords

## Setup:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/videoTube-backend.git
   ```

## Setup:

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/videoTube-backend.git
   ```
2. Install Dependencies.
   `npm install`
3. Set up your environment variables in a .env file (e.g., MongoDB URI, JWT secret).
4. Run the server:
   `npm run dev`
