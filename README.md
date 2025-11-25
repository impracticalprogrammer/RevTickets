# RevTickets - AI-Powered Ticketing System

A comprehensive, modern ticketing system with intelligent queue management, AI-powered knowledge base, and real-time updates. Built with FastAPI backend and Next.js frontend, containerized with Docker for easy deployment.

## 🚀 Quick Start

**Just one command to start everything:**

```bash
docker-compose up --build
```

This automatically:
- ✅ Starts MongoDB database with health checks
- ✅ Starts FastAPI backend with auto-seeding
- ✅ Starts Next.js frontend with hot reload
- ✅ Creates demo users and sample tickets
- ✅ Sets up categories, tags, and knowledge base articles

## 📱 Access the Application

Once running, access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

## 🔐 Demo Login Credentials

### Regular Users:
- `john.doe@company.com` / `password123`
- `jane.smith@company.com` / `password123`
- `mike.johnson@company.com` / `password123`

### Agents (Full Access):
- `sarah.wilson@company.com` / `password123`
- `david.brown@company.com` / `password123`
- `lisa.davis@company.com` / `password123`

## 🎯 Key Features

### 🎫 Ticket Management
- **Smart Queue Assignment**: Tickets automatically routed to agents based on expertise
- **Real-time Updates**: Cache-busting ensures always-fresh data
- **Rich Text Editor**: Full TipTap integration with formatting, lists, and links
- **Dynamic Categories**: Category changes cascade to all related tickets
- **Status Tracking**: Visual workflow from New → In Progress → Resolved → Closed
- **Priority Levels**: Low, Medium, High, Critical with visual indicators
- **Comment System**: Threaded discussions on tickets

### 📚 Knowledge Base
- **AI-Powered Chat**: Google Generative AI integration for intelligent assistance
- **Chat History**: Persistent sessions with automatic save
- **Rich Articles**: Full markdown and rich text support
- **Analytics Dashboard**: Visual insights into KB usage and performance
- **Category Organization**: Hierarchical structure for easy navigation
- **Search & Filter**: Find relevant articles quickly

### 🏷️ Category System
- **Real-time Updates**: Changes reflect immediately across the application
- **Hierarchical Structure**: Categories with nested subcategories
- **Smart References**: MongoDB Links ensure data consistency
- **Cascading Updates**: Name changes automatically update all tickets
- **Event-Driven**: Frontend listens for updates and refreshes automatically

### 🔐 Authentication & Security
- **JWT Tokens**: Secure authentication with token refresh
- **Role-Based Access**: User and Agent roles with different permissions
- **Protected Routes**: Client-side and server-side route protection
- **Persistent Sessions**: Maintains login state across browser sessions
- **Password Security**: bcrypt hashing with proper length handling
- **Graceful Error Handling**: Network errors don't force logout

### 📊 Dashboard & Analytics
- **Agent Dashboard**: Quick access to assigned tickets and queue
- **Ticket Statistics**: Real-time counts by status and priority
- **Knowledge Base Metrics**: Article views, ratings, and effectiveness
- **Visual Charts**: Recharts integration for data visualization
- **Filter & Search**: Advanced filtering by multiple criteria

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.4.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Flowbite React
- **Rich Text**: TipTap Editor with extensions
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **Charts**: Recharts
- **Icons**: Heroicons

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: MongoDB with Beanie ODM
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Pydantic models
- **AI Integration**: Google Generative AI (optional)
- **API Docs**: Auto-generated OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: MongoDB 6
- **Orchestration**: Multi-service setup with health checks
- **Networking**: Internal Docker network

## 📂 Project Structure

```
RevTickets/
├── frontend/                      # Next.js React application
│   ├── app/                       # Next.js App Router pages
│   │   ├── (auth)/login/          # Login page
│   │   ├── tickets/               # Ticket management
│   │   ├── categories/            # Category management
│   │   ├── knowledge-base/        # KB articles & chat
│   │   └── dashboard/             # Agent dashboard
│   ├── src/
│   │   ├── app/features/          # Feature-specific components
│   │   ├── contexts/              # React Context providers
│   │   ├── lib/api/               # API client modules
│   │   └── hooks/                 # Custom React hooks
│   ├── public/                    # Static assets
│   ├── Dockerfile                 # Frontend container
│   └── package.json               # Node dependencies
│
├── backend/                       # FastAPI Python application
│   ├── src/
│   │   ├── api/v1/                # API routes
│   │   │   ├── routes/            # Route handlers
│   │   │   └── endpoints/         # Endpoint definitions
│   │   ├── models/                # Beanie ODM models
│   │   │   ├── ticket.py          # Ticket with Link references
│   │   │   ├── category.py        # Category model
│   │   │   ├── user.py            # User & auth model
│   │   │   └── ...
│   │   ├── schemas/               # Pydantic schemas
│   │   ├── services/              # Business logic
│   │   │   ├── ticket_service.py  # Ticket operations
│   │   │   ├── category_service.py # Category operations
│   │   │   └── ...
│   │   ├── utils/                 # Utilities
│   │   │   └── security.py        # JWT & password hashing
│   │   ├── config.py              # Configuration
│   │   ├── database.py            # MongoDB connection
│   │   ├── seed_data.py           # Database seeding
│   │   └── main.py                # FastAPI entry point
│   ├── start.sh                   # Startup script
│   ├── Dockerfile                 # Backend container
│   └── requirements.txt           # Python dependencies
│
├── docker-compose.yml             # Multi-service orchestration
└── README.md                      # This file
```

## 🔧 Configuration

### Environment Variables

#### Backend (`docker-compose.yml`)
```yaml
MONGODB_URI: Connection string for MongoDB
GOOGLE_API_KEY: Google AI API key (optional, for AI features)
```

#### Frontend
```bash
NEXT_PUBLIC_API_BASE_URL: Backend API URL (default: http://localhost:8000)
```

### Docker Compose Services

```yaml
services:
  mongo:       # MongoDB database (port 27017)
  backend:     # FastAPI application (port 8000)
  frontend:    # Next.js application (port 3000)
```

## 📊 Demo Data

The application automatically creates comprehensive demo data:

### Users (6 total)
- 3 regular users (can create tickets, view their own tickets)
- 3 agents (can manage tickets in their expertise areas)

### Categories (3 with 15 subcategories)
1. **IT Support**
   - Hardware Issues, Software Issues, Network & Connectivity
   - Email & Communication, Security & Access

2. **HR Support**
   - Employee Onboarding, Benefits & Payroll, Time Off & Leave
   - Training & Development, Workplace Issues

3. **Operations**
   - Facilities & Office, Procurement & Supplies, Travel & Expense
   - Documentation, General Requests

### Additional Data
- **18 tags**: team, platform, request type, business unit, impact, location
- **9 knowledge base articles**: Covering common issues and procedures
- **7 sample tickets**: With various statuses, priorities, and comments

## 🚀 Development

### Prerequisites
- Docker and Docker Compose
- (Optional) Node.js 18+ and Python 3.11+ for local development

### Running in Development Mode

**Full Docker Stack (Recommended)**
```bash
# Start all services with live reload
docker-compose up --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Local Development (Advanced)**
```bash
# Start MongoDB only
docker-compose up mongo

# Backend (terminal 1)
cd backend
pip install -r requirements.txt
python src/seed_data.py  # Run once
uvicorn main:app --reload

# Frontend (terminal 2)
cd frontend
npm install
npm run dev
```

### Cache Management

When making changes, clear Docker cache:
```bash
# Stop all containers
docker-compose down

# Clear build cache
docker system prune -f
docker builder prune -f

# Rebuild specific service
docker-compose build --no-cache backend
docker-compose build --no-cache frontend

# Start fresh
docker-compose up -d
```

### Database Management

```bash
# Access MongoDB shell
docker exec -it mongodb mongosh -u root -p example --authenticationDatabase admin rev-ticketing-system

# View collections
show collections

# Query tickets
db.tickets.find().pretty()

# Query categories
db.categories.find({}, {name: 1}).pretty()
```

## 🔄 Recent Updates & Improvements

### Authentication & Session Management
- ✅ Fixed React hydration errors on page refresh
- ✅ Improved loading states and auth persistence
- ✅ Enhanced token validation with network error handling
- ✅ Graceful handling of auth errors (401/403)
- ✅ Proper initial loading state in AuthContext

### Category System
- ✅ **Always-fresh category data**: Backend fetches from database on every request
- ✅ **Cascading updates**: Category name changes update all related tickets
- ✅ **Event-driven refresh**: Frontend auto-refreshes when categories change
- ✅ **Cache busting**: Timestamp parameters prevent stale data
- ✅ **Real-time synchronization**: Changes reflect immediately across application

### Ticket Management
- ✅ Cache-busting timestamps on all ticket API calls
- ✅ Dynamic category name updates in ticket views
- ✅ Custom event system for cross-component communication
- ✅ Enhanced logging for debugging

### Infrastructure
- ✅ Windows line ending compatibility in startup scripts
- ✅ Enhanced bcrypt password handling (72-byte limit)
- ✅ Improved Docker build caching
- ✅ Health check monitoring for MongoDB

## 🐛 Troubleshooting

### Common Issues

**Issue**: "This site can't be reached" on localhost:3000
- **Solution**: Check port mapping in docker-compose.yml (should be `3000:3000`)
- **Check**: `docker-compose ps` to verify frontend is running

**Issue**: Login works but refresh causes logout
- **Solution**: Ensure AuthContext `initialState.isLoading = true`
- **Check**: Browser console for auth logs

**Issue**: Category name changes don't show in tickets
- **Solution**: Backend now always fetches fresh data - restart backend
- **Check**: Backend logs for `[TicketService] Fetched category` messages

**Issue**: exec ./start.sh: no such file or directory
- **Solution**: Windows line endings issue - fixed in Dockerfile with `sed`

### Debugging Commands

```bash
# View all logs
docker-compose logs

# Follow specific service
docker logs fastapi-backend --follow
docker logs nextjs-frontend --follow

# Check service health
docker-compose ps

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Access container shell
docker exec -it fastapi-backend bash
docker exec -it nextjs-frontend sh
```

## 🧪 Testing

### Manual Testing Workflow
1. **Login**: Test with demo credentials
2. **Create Ticket**: Fill form with rich text
3. **Update Category**: Change category name
4. **Verify Update**: Check ticket shows new category name
5. **Filter**: Test status and priority filters
6. **Comments**: Add comments to tickets
7. **Knowledge Base**: Test AI chat and article search
8. **Browser Refresh**: Verify session persists

### API Testing
- Visit http://localhost:8000/docs
- Use interactive Swagger UI to test endpoints
- Test authentication with JWT tokens

## 🚢 Production Deployment

### Pre-deployment Checklist
- [ ] Set strong `JWT_SECRET` environment variable
- [ ] Configure MongoDB with authentication and SSL
- [ ] Update `NEXT_PUBLIC_API_BASE_URL` to production API
- [ ] Enable HTTPS for all services
- [ ] Configure CORS for your domain
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure backup strategy for MongoDB
- [ ] Set resource limits in docker-compose
- [ ] Enable security headers (CSP, HSTS)
- [ ] Set up monitoring and alerting
- [ ] Configure CDN for static assets
- [ ] Test on multiple browsers and devices

### Production Build

```bash
# Build for production
docker-compose -f docker-compose.prod.yml build

# Start in production mode
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use reverse proxy (nginx/traefik) for load balancing
```

## 📖 Documentation

### API Documentation
- Interactive Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

### Code Documentation
- Backend: See `backend/README.md`
- Frontend: See `frontend/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test with `docker-compose up --build`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Python best practices
- Write meaningful commit messages
- Update documentation for new features
- Test across different user roles
- Ensure Docker build succeeds

## 📄 License

This project is part of the Revature training program.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- FastAPI for the high-performance backend
- MongoDB for flexible data modeling
- Flowbite for beautiful UI components
- Google for Generative AI capabilities

## 📞 Support

For issues, questions, or contributions:
1. Check existing issues in the repository
2. Review documentation in backend/frontend READMEs
3. Check Docker logs for error messages
4. Create a new issue with detailed description

---

**Built with ❤️ for Revature Training Program**
