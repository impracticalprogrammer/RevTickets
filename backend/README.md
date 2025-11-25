# RevTickets Backend API

FastAPI-based backend service for the RevTickets ticketing system with MongoDB integration, JWT authentication, and intelligent ticket queue management.

## 🚀 Quick Start

### Running with Docker (Recommended)

```bash
# From project root
docker-compose up --build

# Backend will be available at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Local Development

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
export MONGODB_URI="mongodb://root:example@localhost:27017/rev-ticketing-system?authSource=admin"
export GOOGLE_API_KEY="your-api-key-here"  # Optional, for AI features

# Run seed data (creates demo users and tickets)
python src/seed_data.py

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🔐 Demo Login Credentials

The seed script automatically creates the following users:

### Regular Users:
- `john.doe@company.com` / `password123`
- `jane.smith@company.com` / `password123`
- `mike.johnson@company.com` / `password123`

### Agents (Full Access):
- `sarah.wilson@company.com` / `password123`
- `david.brown@company.com` / `password123`
- `lisa.davis@company.com` / `password123`

## 📊 Seed Data

The `seed_data.py` script creates:
- **6 demo users** (3 regular users, 3 agents)
- **3 categories** with subcategories:
  - IT Support (Hardware, Software, Network, Email, Security)
  - HR Support (Onboarding, Benefits, Time Off, Training, Workplace Issues)
  - Operations (Facilities, Procurement, Travel, Documentation, General)
- **18 tags** for organization (team, platform, request type, etc.)
- **9 knowledge base articles** with rich text content
- **7 sample tickets** with various statuses and priorities

## 🛠 Tech Stack

- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: Auto-generated OpenAPI/Swagger docs
- **AI Integration**: Google Generative AI for intelligent features (optional)
- **Validation**: Pydantic models with comprehensive validation

## 📂 Project Structure

```
backend/
├── src/
│   ├── api/v1/            # API routes
│   │   ├── routes/        # Route handlers
│   │   └── endpoints/     # Endpoint definitions
│   ├── models/            # Beanie ODM models
│   │   ├── ticket.py      # Ticket model with Link references
│   │   ├── category.py    # Category model
│   │   ├── user.py        # User authentication model
│   │   └── ...
│   ├── schemas/           # Pydantic schemas for validation
│   ├── services/          # Business logic layer
│   │   ├── ticket_service.py
│   │   ├── category_service.py
│   │   └── ...
│   ├── utils/             # Utility functions
│   │   ├── security.py    # JWT & password hashing
│   │   └── ...
│   ├── config.py          # Configuration management
│   ├── database.py        # MongoDB connection
│   ├── seed_data.py       # Database seeding script
│   └── main.py            # FastAPI app entry point
├── start.sh               # Startup script
├── requirements.txt       # Python dependencies
├── Dockerfile             # Container definition
└── README.md              # This file
```

## 🔑 Key Features

### Authentication & Authorization
- JWT-based authentication with secure token generation
- Password hashing with bcrypt (72-byte limit handling)
- Role-based access control (User, Agent roles)
- Protected routes with dependency injection

### Ticket Management
- **Dynamic Category References**: Tickets use MongoDB Links for categories/subcategories
- **Fresh Data Fetching**: Always fetches latest category names from database
- **Smart Queue Assignment**: Agents see tickets based on their expertise categories
- **Rich Text Support**: TipTap editor content with HTML, JSON, and plain text formats
- **Timestamp Tracking**: Created, updated, and closed timestamps with timezone support
- **Cascading Updates**: Category name changes automatically update related tickets

### Category System
- **Real-time Updates**: Category/subcategory changes reflect immediately in tickets
- **Hierarchical Structure**: Categories contain subcategories with Link references
- **Fresh Retrieval**: Always fetches fresh from database to ensure latest names
- **Cascading Notifications**: Updates trigger timestamp changes in related tickets

### Knowledge Base
- AI-powered article creation (optional)
- Rich text content with multiple format support
- Category-based organization
- Search and filtering capabilities

### Agent Info & Queue Management
- Agent expertise tied to specific categories/subcategories
- Intelligent ticket routing based on agent skills
- Queue visibility and assignment tracking

## 🔧 Configuration

### Environment Variables

```bash
# MongoDB Connection (required)
MONGODB_URI=mongodb://root:example@mongo:27017/rev-ticketing-system?authSource=admin

# AI Features (optional)
GOOGLE_API_KEY=your-google-api-key-here

# JWT Secret (auto-generated if not provided)
JWT_SECRET=your-secret-key-here
```

### Docker Configuration

The backend runs in a Docker container with:
- Python 3.11-slim base image
- Automatic line ending conversion for Windows compatibility
- Health check monitoring via MongoDB connection
- Volume mounting for persistent data

## 📡 API Endpoints

### Authentication
- `POST /api/v1/users/login` - User login (returns JWT token)
- `GET /api/v1/users/profile` - Get current user profile

### Tickets
- `GET /api/v1/tickets/` - List tickets (filtered by user role)
- `GET /api/v1/tickets/{id}` - Get ticket details
- `POST /api/v1/tickets/` - Create new ticket
- `PUT /api/v1/tickets/{id}` - Update ticket
- `GET /api/v1/tickets/stats` - Get ticket statistics

### Categories
- `GET /api/v1/categories/` - List all categories
- `GET /api/v1/categories/{id}` - Get category details
- `POST /api/v1/categories/` - Create category
- `PUT /api/v1/categories/{id}` - Update category (cascades to tickets)
- `GET /api/v1/categories/{id}/subcategories` - Get category's subcategories

### Subcategories
- `GET /api/v1/subcategories/` - List all subcategories
- `PUT /api/v1/subcategories/{id}` - Update subcategory (cascades to tickets)

### Knowledge Base
- `GET /api/v1/knowledge-base/articles` - List articles
- `POST /api/v1/knowledge-base/articles` - Create article
- `GET /api/v1/knowledge-base/chat` - AI chat interface

### Comments
- `GET /api/v1/tickets/{id}/comments` - Get ticket comments
- `POST /api/v1/tickets/{id}/comments` - Add comment

Full API documentation available at: http://localhost:8000/docs

## 🔄 Recent Updates

### Latest Improvements
- **Fresh Category Fetching**: Tickets now always fetch category/subcategory data fresh from MongoDB to ensure latest names are displayed
- **Cascading Updates**: Category name changes automatically update `updated_at` timestamp on all related tickets
- **Enhanced Logging**: Comprehensive logging for debugging category updates and ticket retrieval
- **Windows Compatibility**: Fixed line ending issues in startup scripts
- **Password Security**: Enhanced bcrypt handling for 72-byte password limit
- **Cache Busting**: Backend supports timestamp parameters to prevent stale data

## 🐛 Debugging

### Common Issues

**Issue**: Categories not updating in tickets
**Solution**: The backend now always fetches fresh category data from MongoDB. Check logs for `[TicketService] Fetched category` messages.

**Issue**: Startup script fails
**Solution**: The Dockerfile now handles Windows line endings automatically with `sed -i 's/\r$//'`

**Issue**: Password too long error
**Solution**: Passwords are now automatically truncated to 72 bytes before hashing

### Logs

```bash
# View backend logs
docker logs fastapi-backend

# Follow logs in real-time
docker logs fastapi-backend --follow

# View last 50 lines
docker logs fastapi-backend --tail 50
```

## 🧪 Testing

```bash
# Run tests (if available)
pytest

# Run with coverage
pytest --cov=src
```

## 🚢 Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET` environment variable
- [ ] Configure MongoDB with authentication
- [ ] Set up SSL/TLS for MongoDB connection
- [ ] Enable CORS for your frontend domain
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy for MongoDB
- [ ] Set resource limits in docker-compose

## 📄 License

This project is part of the Revature training program.
