# GifHub - Product Requirements Document

## Project Overview

**Project Name:** GifHub  
**Version:** 1.0 (MVP)  
**Project Type:** Full-stack web application for video-to-GIF conversion and sharing  
**Budget Constraint:** $0 - Must use only free technologies and services  

## Product Vision

GifHub is a global hub for high-quality GIFs that enables users to upload videos, convert selected timeframes to GIFs, organize them into repositories with tags, and share them publicly. The platform focuses on simplicity, quality, and community-driven content curation.

## Technical Architecture

### Technology Stack (100% Free)

**Frontend:**

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form
- Zustand (state management)

**Backend:**

- Next.js API Routes
- Prisma ORM
- PostgreSQL (via Supabase free tier)
- NextAuth.js

**File Storage & Processing:**

- Google Cloud Storage (no file size limits, cost-effective scaling)
- FFmpeg.wasm (browser-based video processing)
- Canvas API for video preview

**Deployment & Hosting:**

- Vercel (free tier)
- Supabase (PostgreSQL only)
- Google Cloud Storage (file storage)

**Additional Tools:**

- ESLint + Prettier
- Git + GitHub

## Design System

### Visual Design Principles

- **Background:** Minimalistic glassy white background
- **Typography:** Black text, large font sizes (minimum 18px on mobile, 20px+ on desktop)
- **Buttons:** Black background, white text, no border radius (sharp rectangular corners)
- **Cards/Containers:** Semi-transparent white with subtle glass effect, no border radius
- **Layout:** Clean, spacious, plenty of whitespace
- **Responsiveness:** Mobile-first approach with large touch targets
- **No Border Radius:** All elements use sharp, rectangular corners throughout

### Color Palette

- Primary Background: `bg-white/80` (80% opacity white)
- Secondary Background: `bg-white/60` (60% opacity white)
- Text Primary: `text-black`
- Text Secondary: `text-gray-700`
- Buttons: `bg-black text-white`
- Accent: `bg-gray-100` for subtle highlights

### Typography Scale

- Mobile: Base 18px, Headings 24px-32px
- Desktop: Base 20px, Headings 28px-40px
- Font Family: System fonts (font-sans)

## Core Features & User Stories

### 1. Video Upload & Processing

**User Story:** As a user, I want to upload a video file and convert specific timeframes to high-quality GIFs.

**Acceptance Criteria:**

- Support video formats: MP4, MOV, AVI, WebM
- Maximum file size: 2GB (significantly increased from previous 100MB limit)
- Maximum video duration: No hard limit (enhanced for movie-length content)
- Video preview with timeline scrubber and zoom capabilities for long videos
- Select start and end times for GIF creation (up to 60s for long videos, 30s for shorter ones)
- Preview selected segment before conversion
- Download generated GIF
- Client-side processing using FFmpeg.wasm
- Enhanced timeline with zoom, pan, and focus features for large video files

**Technical Implementation:**

```typescript
// File upload component with drag-and-drop
interface VideoUploadProps {
  onVideoSelect: (file: File) => void;
  maxSize: number; // 2GB (2 * 1024 * 1024 * 1024 bytes)
  acceptedFormats: string[];
}

// Video timeline selector with enhanced features for large videos
interface TimelineProps {
  videoDuration: number;
  onTimeSelect: (start: number, end: number) => void;
  maxGifDuration: number; // 30-60 seconds (adaptive based on video length)
  zoomLevel?: number; // 1x to 16x zoom for long videos
  viewWindow?: { start: number; end: number }; // Visible portion of timeline (0-1 range)
}

// GIF generation using FFmpeg.wasm
const generateGIF = async (
  videoFile: File,
  startTime: number,
  endTime: number,
  quality: 'low' | 'medium' | 'high'
) => {
  // Implementation using FFmpeg.wasm
};
```

### 2. User Authentication

**User Story:** As a user, I want to create an account to save and manage my GIFs and repositories.

**Acceptance Criteria:**

- Email/password registration
- Google OAuth integration
- Email verification
- Password reset functionality
- User profile management

**Technical Implementation:**

- NextAuth.js configuration
- Supabase Auth integration
- User schema in Prisma

### 3. Repository Management

**User Story:** As a user, I want to organize my GIFs into repositories with tags for better organization.

**Acceptance Criteria:**

- Create repositories with name and description
- Add tags to repositories
- Make repositories public/private
- Search repositories by tags
- Repository statistics (views, downloads)

**Database Schema:**

```prisma
model User {
  id          String @id @default(cuid())
  email       String @unique
  name        String?
  repositories Repository[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Repository {
  id          String @id @default(cuid())
  name        String
  description String?
  isPublic    Boolean @default(false)
  tags        Tag[]
  gifs        Gif[]
  userId      String
  user        User @relation(fields: [userId], references: [id])
  views       Int @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Gif {
  id           String @id @default(cuid())
  filename     String
  originalName String
  fileSize     Int
  duration     Float
  width        Int
  height       Int
  repositoryId String
  repository   Repository @relation(fields: [repositoryId], references: [id])
  downloads    Int @default(0)
  createdAt    DateTime @default(now())
}

model Tag {
  id           String @id @default(cuid())
  name         String @unique
  repositories Repository[]
}
```

### 4. Public Sharing & Discovery

**User Story:** As a user, I want to share my public repositories and discover GIFs created by others.

**Acceptance Criteria:**

- Public repository pages with shareable URLs
- Browse public repositories
- Search functionality
- Repository rating system
- Download GIFs from public repositories

### 5. GIF Quality Management

**User Story:** As a user, I want to control the quality and file size of my generated GIFs.

**Acceptance Criteria:**

- Quality presets: Low (256 colors), Medium (128 colors), High (64 colors)
- Frame rate options: 10fps, 15fps, 24fps
- Resolution options: Original, 720p, 480p, 360p
- File size preview before generation
- Batch processing for multiple segments

## Page Structure & Routing

### Public Pages

- `/` - Landing page with hero section and public GIF showcase
- `/explore` - Browse public repositories
- `/repository/[id]` - Public repository view
- `/login` - Authentication page
- `/register` - User registration

### Authenticated Pages

- `/dashboard` - User dashboard with repositories overview
- `/upload` - Video upload and GIF creation
- `/repositories` - User's repositories management
- `/repository/[id]/edit` - Repository editing
- `/profile` - User profile settings

## Component Architecture

### Layout Components

```typescript
// Main layout with glassy white background
const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-white/90 to-white/80 backdrop-blur-sm">
    <Header />
    <main className="container mx-auto px-6 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

// Header with navigation
const Header = () => (
  <header className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
    <nav className="container mx-auto px-6 py-4">
      {/* Navigation items */}
    </nav>
  </header>
);

// Glassy card component
const GlassCard = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white/70 backdrop-blur-sm p-6 ${className}`}>
    {children}
  </div>
);

// Button component (no border radius)
const Button = ({ variant = "primary", children, ...props }: ButtonProps) => (
  <button 
    className={`px-6 py-3 text-lg font-medium transition-all duration-200 ${
      variant === "primary" 
        ? "bg-black text-white hover:bg-gray-800" 
        : "bg-white/80 text-black border border-gray-300 hover:bg-white"
    }`}
    {...props}
  >
    {children}
  </button>
);
```

### Core Feature Components

```typescript
// Video upload component
const VideoUploader = () => {
  // Drag and drop functionality
  // File validation
  // Upload progress
};

// Timeline selector for GIF creation
const TimelineSelector = () => {
  // Video preview
  // Timeline scrubber
  // Start/end time selection
};

// Repository grid
const RepositoryGrid = () => {
  // Grid layout of repositories
  // Search and filter
  // Pagination
};

// GIF preview grid
const GifGrid = () => {
  // Masonry or grid layout
  // Lazy loading
  // Download buttons
};
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Repositories

- `GET /api/repositories` - Get user's repositories
- `POST /api/repositories` - Create repository
- `GET /api/repositories/[id]` - Get repository details
- `PUT /api/repositories/[id]` - Update repository
- `DELETE /api/repositories/[id]` - Delete repository
- `GET /api/repositories/public` - Get public repositories

### GIFs

- `POST /api/gifs/upload` - Upload and process video to GIF
- `GET /api/gifs/[id]` - Get GIF details
- `DELETE /api/gifs/[id]` - Delete GIF
- `POST /api/gifs/[id]/download` - Track download

### Public API

- `GET /api/public/repositories` - Browse public repositories
- `GET /api/public/repositories/[id]` - Get public repository
- `GET /api/public/search` - Search public content

## Mobile Responsiveness

### Breakpoints

- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

### Mobile-Specific Features

- Touch-friendly interface (minimum 44px touch targets)
- Swipe gestures for timeline navigation
- Mobile-optimized video player
- Responsive typography (18px+ base font size)
- Simplified navigation menu

### Responsive Layout Examples

```typescript
// Responsive grid
const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {/* Repository cards */}
  </div>
);

// Mobile-first typography
const Typography = {
  h1: "text-2xl md:text-4xl font-bold text-black leading-tight",
  h2: "text-xl md:text-3xl font-semibold text-black",
  body: "text-lg md:text-xl text-black leading-relaxed",
  button: "text-lg md:text-xl font-medium"
};
```

## Performance Requirements

### Core Metrics

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- First Input Delay: < 100ms

### Optimization Strategies

- Next.js Image optimization
- Lazy loading for GIF previews
- Code splitting by routes
- Service Worker for offline functionality
- WebP format for images
- Efficient FFmpeg.wasm usage

## Security Considerations

### Data Protection

- Input validation on all forms
- File type and size validation
- Rate limiting on API endpoints
- CSRF protection
- Secure file uploads to Supabase Storage

### Content Security

- Content moderation (basic profanity filter)
- Copyright respect guidelines
- User reporting system
- Admin moderation tools

## Development Setup Instructions

### Prerequisites

```bash
Node.js 18+
Git
VS Code (recommended)
```

### Initial Setup

```bash
# 1. Create Next.js project
npx create-next-app@latest gifhub --typescript --tailwind --eslint --app

# 2. Install dependencies
npm install prisma @prisma/client next-auth @next-auth/prisma-adapter zustand react-hook-form @hookform/resolvers zod @supabase/supabase-js @ffmpeg/ffmpeg @ffmpeg/util

# 3. Install dev dependencies
npm install -D @types/node prisma

# 4. Setup environment variables
cp .env.example .env.local
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── upload/
│   │   └── repositories/
│   ├── api/
│   │   ├── auth/
│   │   ├── repositories/
│   │   └── gifs/
│   ├── components/
│   │   ├── ui/
│   │   ├── video/
│   │   └── repository/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   └── utils.ts
│   └── types/
├── prisma/
│   └── schema.prisma
└── public/
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] Project setup and configuration
- [ ] Authentication system
- [ ] Database schema and Prisma setup
- [ ] Basic UI components with glassy design
- [ ] User registration/login pages

### Phase 2: Video Upload & Processing (Week 3-4)

- [ ] Video upload component
- [ ] FFmpeg.wasm integration
- [ ] Timeline selector component
- [ ] GIF generation and preview
- [ ] File storage integration

### Phase 3: Repository Management (Week 5-6)

- [ ] Repository CRUD operations
- [ ] Tag system
- [ ] Repository listing and management
- [ ] Public/private repository settings

### Phase 4: Public Features (Week 7-8)

- [ ] Public repository pages
- [ ] Browse and search functionality
- [ ] Landing page and marketing content
- [ ] Social sharing features

### Phase 5: Polish & Optimization (Week 9-10)

- [ ] Performance optimization
- [ ] Mobile responsiveness testing
- [ ] Bug fixes and improvements
- [ ] Documentation and deployment

## Success Metrics

### User Engagement

- Daily active users
- GIFs created per user
- Repository creation rate
- Public repository views

### Technical Performance

- Page load times
- Conversion success rate
- File upload success rate
- Error rates

### Content Quality

- Average GIF file size
- User retention rate
- Repository engagement
- Download rates

## Deployment Instructions

### Vercel Deployment

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Connect to Vercel
# - Import project from GitHub
# - Add environment variables
# - Deploy

# 3. Setup domain (optional)
# - Configure custom domain in Vercel dashboard
```

### Database Migration

```bash
# Run Prisma migrations
npx prisma migrate deploy
npx prisma generate
```

## Future Enhancements (Post-MVP)

### Advanced Features

- AI-powered GIF recommendations
- Collaborative repositories
- GIF marketplace (premium feature)
- Advanced editing tools
- Batch processing improvements

### Technical Improvements

- CDN integration
- Advanced caching strategies
- WebAssembly optimizations
- Progressive Web App features
- Advanced analytics

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Use semantic versioning
- Document complex functions

### Testing Strategy

- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Manual testing on multiple devices

### Git Workflow

- Feature branch workflow
- Pull request reviews
- Continuous integration checks
- Semantic commit messages

## Conclusion

This PRD provides a comprehensive roadmap for building GifHub as a fully-featured, production-ready application using only free technologies. The focus on minimalistic glassy design, mobile-first approach, and client-side video processing makes it unique while keeping costs at zero.

The modular architecture allows for iterative development, and the detailed technical specifications should enable autonomous development by AI coding assistants like Cursor.
