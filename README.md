# Course Material Sharing Platform

A modern, full-stack web application for sharing course materials between lecturers and students.

## Features

- **Role-based Authentication**: Separate dashboards for lecturers and students
- **File Upload & Download**: Drag-and-drop upload with progress tracking
- **Material Management**: Organize materials by courses
- **Modern UI**: Built with React, Vite, Tailwind CSS, and shadcn/ui
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS for styling
- shadcn/ui for components
- Lucide React for icons
- Axios for API calls

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Multer and Cloudinary for file uploads

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd course-platform-final
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Update MongoDB, JWT, and Cloudinary values:
     ```
     MONGO_URI=mongodb://127.0.0.1:27017/course-platform
     JWT_SECRET=your-secret-key
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

4. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system.

6. **Start the servers**

   **Terminal 1 - Backend:**
   ```bash
   cd server
   npm start
   ```
   Server will run on http://localhost:5000

   **Terminal 2 - Frontend:**
   ```bash
   cd client
   npm run dev
   ```
   App will run on http://localhost:3000

## Usage

1. **Register** as either a Lecturer or Student
2. **Login** to access your dashboard
3. **Lecturers** can upload materials with course information
4. **Students** can browse and download materials

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Materials
- `GET /api/materials` - Get all materials
- `POST /api/materials` - Upload new material
- `GET /api/materials/:id/download` - Download material
- `DELETE /api/materials/:id` - Delete material

## Project Structure

```
course-platform-final/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── uploads/            # File storage
│   └── package.json
└── .env                    # Environment variables
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
