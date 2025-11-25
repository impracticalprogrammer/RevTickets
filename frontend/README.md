# RevTickets Frontend

Modern, responsive Next.js frontend for the RevTickets ticketing system with real-time updates, authentication, and intelligent caching.

## 🚀 Quick Start

### Running with Docker (Recommended)

```bash
# From project root
docker-compose up --build

# Frontend will be available at http://localhost:3000
```

### Local Development

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🔐 Demo Login

Use these credentials to test the application:

### Regular Users:
- `john.doe@company.com` / `password123`
- `jane.smith@company.com` / `password123`
- `mike.johnson@company.com` / `password123`

### Agents (Full Access):
- `sarah.wilson@company.com` / `password123`
- `david.brown@company.com` / `password123`
- `lisa.davis@company.com` / `password123`

## 🛠 Tech Stack

- **Framework**: Next.js 15.4.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Flowbite React
- **UI Components**: Flowbite React, Heroicons
- **Rich Text Editor**: TipTap with extensions
- **HTTP Client**: Axios with interceptors
- **State Management**: React Context API
- **Authentication**: JWT tokens with localStorage persistence
- **Charts**: Recharts for analytics
- **Date Handling**: date-fns

## 📂 Project Structure

```
frontend/
├── app/                           # Next.js App Router pages
│   ├── (auth)/                    # Authentication pages
│   │   └── login/                 # Login page
│   ├── tickets/                   # Ticket management
│   │   ├── page.tsx               # Tickets list with filters
│   │   ├── [id]/                  # Ticket detail view
│   │   └── new/                   # Create new ticket
│   ├── categories/                # Category management
│   │   └── page.tsx               # Categories with subcategories
│   ├── knowledge-base/            # Knowledge base
│   │   ├── page.tsx               # Articles list
│   │   ├── chat/                  # AI-powered chat
│   │   └── analytics/             # KB analytics
│   ├── dashboard/                 # Agent dashboard
│   └── layout.tsx                 # Root layout with providers
├── src/
│   ├── app/
│   │   ├── features/              # Feature-specific components
│   │   │   ├── tickets/           # Ticket components
│   │   │   │   ├── TicketsList.tsx
│   │   │   │   ├── TicketDetail.tsx
│   │   │   │   └── TicketForm.tsx
│   │   │   ├── categories/        # Category components
│   │   │   │   └── CategoriesList.tsx
│   │   │   ├── dashboard/         # Dashboard components
│   │   │   └── knowledge-base/    # KB components
│   │   └── shared/
│   │       ├── components/        # Reusable components
│   │       │   ├── ProtectedRoute.tsx
│   │       │   ├── Header.tsx
│   │       │   └── Sidebar.tsx
│   │       └── types/             # TypeScript type definitions
│   ├── contexts/
│   │   └── AuthContext.tsx        # Authentication state management
│   ├── lib/
│   │   └── api/                   # API client modules
│   │       ├── client.ts          # Base Axios client
│   │       ├── tickets.ts         # Ticket API
│   │       ├── categories.ts      # Category API
│   │       └── ...
│   └── hooks/                     # Custom React hooks
├── public/                        # Static assets
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── Dockerfile                     # Container definition
└── README.md                      # This file
```

## 🔑 Key Features

### Authentication & Session Management
- **JWT Token Handling**: Secure token storage in localStorage
- **Auto-Refresh**: Validates tokens on page refresh
- **Protected Routes**: Client-side route protection with redirect
- **Persistent Sessions**: Maintains login state across browser sessions
- **Graceful Error Handling**: Network errors don't force logout
- **Role-Based Access**: Different views for users vs agents

### Ticket Management
- **Real-time Updates**: Cache-busting ensures fresh data on every request
- **Dynamic Filtering**: Filter by status, priority, category
- **Rich Text Editor**: TipTap editor with formatting, lists, links
- **Category Refresh**: Automatic refresh when categories are updated
- **Comment System**: Real-time commenting on tickets
- **Status Tracking**: Visual indicators for ticket status

### Category System
- **Real-time Updates**: Event-driven refresh when categories change
- **Cache Prevention**: Timestamp-based cache busting (`?_t=timestamp`)
- **Cascading Updates**: Category name changes reflect in all tickets
- **Hierarchical Management**: Categories with nested subcategories
- **Inline Editing**: Edit categories and subcategories in place

### Knowledge Base
- **AI Chat Interface**: Powered by Google Generative AI
- **Chat History**: Persistent chat sessions with sessionStorage
- **Rich Articles**: Full-featured article creation and viewing
- **Analytics Dashboard**: Visual charts for KB metrics
- **Search & Filter**: Find articles by category or content

### User Experience
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Loading States**: Skeleton loaders and spinners
- **Error Boundaries**: Graceful error handling
- **Toast Notifications**: User feedback for actions
- **Accessibility**: ARIA labels and keyboard navigation

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### API Client Configuration

The API client in `src/lib/api/client.ts` includes:
- Automatic auth token injection
- Request/response interceptors
- Error handling
- Cache-busting timestamps

## 🎨 Styling

### Tailwind CSS Classes
The app uses Tailwind CSS with custom configuration:
- Custom color palette
- Dark mode support (class-based)
- Responsive breakpoints
- Custom animations

### Flowbite Components
Pre-built React components from Flowbite:
- Buttons, Cards, Modals
- Forms, Inputs, Dropdowns
- Tables, Badges, Alerts
- Sidebars, Navbars

## 🔄 Recent Updates

### Latest Improvements
- **Cache Busting**: All API requests include timestamp parameters to prevent stale data
- **Fresh Category Names**: Tickets always display the latest category names
- **Event-Driven Refresh**: Custom events trigger automatic ticket list refresh when categories are updated
- **Auth Persistence**: Enhanced authentication state management with proper loading states
- **Hydration Fix**: Resolved React hydration mismatches on page refresh
- **Protected Routes**: Improved route protection with loading spinners
- **Session Validation**: Robust token validation with network error handling
- **Analytics Buttons**: Quick access to analytics from all major pages

### Cache-Busting Implementation
```typescript
// Example from tickets.ts
async getAll(params?: TicketQueryParams): Promise<Ticket[]> {
  const timestamp = new Date().getTime();
  return apiClient.get(API_ENDPOINTS.TICKETS.BASE, { 
    params: { ...params, _t: timestamp } 
  });
}
```

### Event-Driven Updates
```typescript
// Listen for category updates
useEffect(() => {
  const handleCategoryUpdate = () => {
    console.log('Category updated, refetching tickets...');
    fetchTickets();
  };
  
  window.addEventListener('categoryUpdated', handleCategoryUpdate);
  return () => window.removeEventListener('categoryUpdated', handleCategoryUpdate);
}, [fetchTickets]);
```

## 🐛 Debugging

### Common Issues

**Issue**: Page shows spinner after refresh
**Solution**: Check AuthContext initialState - `isLoading` should be `true`

**Issue**: Categories not updating in tickets
**Solution**: Check browser console for `categoryUpdated` events and ensure cache-busting timestamps are present in API calls

**Issue**: Login state lost on refresh
**Solution**: Check localStorage for `authToken` and `user` data

### Developer Tools

```bash
# View all logs
Open browser console (F12)

# Check localStorage
localStorage.getItem('authToken')
localStorage.getItem('user')

# Check sessionStorage (for chat)
sessionStorage.getItem('currentSessionId')
```

## 📦 Build & Deployment

### Development Build

```bash
npm run dev
# Runs on http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Docker Build

```bash
# Build image
docker build -t revtickets-frontend .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 \
  revtickets-frontend
```

### Build Optimization
- **Standalone Output**: Minimal production bundle
- **Static Assets**: Optimized images and fonts
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Removes unused code

## 🧪 Testing

```bash
# Run tests (when available)
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage
```

## 🚢 Production Checklist

- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to production API
- [ ] Enable HTTPS for API calls
- [ ] Configure CORS on backend for your domain
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Enable CSP headers
- [ ] Optimize images and assets
- [ ] Test on multiple browsers and devices
- [ ] Set up CDN for static assets
- [ ] Configure caching headers

## 📚 Learn More

### Next.js Resources
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Next.js App Router](https://nextjs.org/docs/app) - Modern routing system
- [Next.js Deployment](https://nextjs.org/docs/deployment) - Deploy your Next.js app

### UI Framework Resources
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework
- [Flowbite React](https://flowbite-react.com/) - React component library
- [TipTap](https://tiptap.dev/) - Headless rich text editor

## 📄 License

This project is part of the Revature training program.
