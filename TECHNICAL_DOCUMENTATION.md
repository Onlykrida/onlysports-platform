# OnlyKrida - Technical Documentation

## Executive Summary

OnlyKrida is a comprehensive social networking platform built specifically for the sports community. The application connects athletes, coaches, scouts, teams, trainers, and fans in a unified ecosystem, facilitating networking, opportunity discovery, and content sharing.

## Project Overview

**Platform**: Cross-platform mobile application (iOS, Android, Web)  
**Framework**: React Native with Expo SDK 54  
**Backend**: Supabase (PostgreSQL, Real-time, Storage, Auth)  
**Development Language**: TypeScript  
**Architecture**: Client-server with real-time capabilities

---

## Tech Stack

### Frontend
- **Framework**: React Native (Expo SDK 54)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: 
  - React Query for server state
  - Context API with `@nkzw/create-context-hook` for global state
  - AsyncStorage for persistence
- **UI Components**: Custom components with StyleSheet
- **Icons**: Lucide React Native
- **Media**: Expo AV (video player), Expo Image

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Row Level Security
- **Storage**: Supabase Storage (avatars, posts, videos)
- **Real-time**: Supabase Real-time subscriptions
- **Functions**: PostgreSQL triggers and functions

### Development Tools
- **Package Manager**: Bun
- **Version Control**: Git
- **Type Safety**: TypeScript with strict checking
- **Error Handling**: Custom Error Boundaries

---

## Architecture

### Application Structure

```
onlykrida/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Authentication flows
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── role-selection.tsx
│   │   └── signup-[role].tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── (home)/              # Feed/Home stack
│   │   ├── discover.tsx         # User discovery
│   │   ├── create.tsx           # Content creation
│   │   ├── opportunities.tsx    # Opportunities feed
│   │   ├── messages.tsx         # Messaging list
│   │   └── profile.tsx          # User profile
│   ├── chat/                     # Chat conversations
│   ├── post/                     # Post details
│   ├── user/                     # User profiles
│   ├── edit-profile.tsx
│   ├── settings.tsx
│   └── notifications.tsx
├── components/                   # Reusable components
├── hooks/                        # Context providers & hooks
├── constants/                    # Theme, config, Supabase client
├── types/                        # TypeScript type definitions
├── mocks/                        # Mock data
└── assets/                       # Static assets

```

### Navigation Flow

```
Root (_layout.tsx)
├── (auth) - Authentication stack
│   ├── /welcome
│   ├── /login
│   ├── /signup
│   └── /role-selection
└── (tabs) - Main application
    ├── /(home) - Feed & posts
    ├── /discover - Find users
    ├── /create - Create content
    ├── /opportunities - Browse opportunities
    ├── /messages - Messaging
    └── /profile - User profile
```

---

## Database Schema

### Core Tables

#### `profiles`
User profiles with role-based attributes
- **Fields**: id, email, name, role, avatar, bio, location, verified, sport, position, achievements, stats, followers_count, following_count, posts_count
- **Roles**: athlete, coach, scout, team, trainer, fan
- **Indexes**: email, role

#### `posts`
User-generated content (highlights, training, matches, achievements)
- **Fields**: id, user_id, title, description, video_url, image_url, type, likes_count, comments_count, views_count
- **Types**: highlight, training, match, achievement
- **Indexes**: user_id, created_at, type

#### `opportunities`
Job postings, tryouts, tournaments, scholarships
- **Fields**: id, team_id, title, description, type, sport, location, deadline, requirements, paid
- **Types**: tryout, tournament, sponsorship, scholarship
- **Indexes**: team_id, sport, deadline

#### `applications`
Athletes applying to opportunities
- **Fields**: id, opportunity_id, athlete_id, status, cover_letter
- **Status**: pending, accepted, rejected
- **Constraints**: Unique per athlete-opportunity pair

#### `follows`
Social follow relationships
- **Fields**: id, follower_id, following_id
- **Constraints**: Unique pairs, no self-follows

#### `likes`
Post likes
- **Fields**: id, user_id, post_id
- **Constraints**: Unique per user-post pair

#### `comments`
Post comments with nested support
- **Fields**: id, user_id, post_id, content, likes_count
- **Indexes**: post_id, user_id, created_at

#### `comment_likes`
Comment likes
- **Fields**: id, user_id, comment_id
- **Constraints**: Unique per user-comment pair

#### `messages`
Direct messaging between users
- **Fields**: id, sender_id, receiver_id, content, post_id, read
- **Indexes**: sender_id, receiver_id, created_at

#### `notifications`
In-app notifications
- **Fields**: id, user_id, type, title, message, read, data
- **Types**: like, follow, comment, opportunity, message
- **Indexes**: user_id, read, created_at

### Storage Buckets

#### `avatars`
- User profile pictures
- Max size: 2MB
- Formats: image/jpeg, image/png, image/webp

#### `posts`
- Post media (images/videos)
- Max size: 50MB
- Formats: video/mp4, video/quicktime, image/*

---

## Features

### 1. Authentication & Authorization
- **Email/Password authentication** via Supabase Auth
- **Role-based registration** (6 user types)
- **Protected routes** with authentication guards
- **Row Level Security (RLS)** on all tables
- **Secure storage access** with signed URLs

### 2. User Profiles
- **Role-specific profiles** with custom fields
- **Avatar upload** and management
- **Bio, location, sport, position**
- **Achievements & stats** (JSONB)
- **Verification badges**
- **Follow/Unfollow** functionality
- **Follower/Following counts**

### 3. Social Feed
- **Create posts** (highlight, training, match, achievement)
- **Video/Image uploads** to Supabase Storage
- **Like/Unlike** posts
- **Comment** on posts
- **Comment likes**
- **Real-time updates** via Supabase subscriptions
- **Infinite scroll** feed
- **Post editing/deletion**

### 4. Messaging System
- **Direct messaging** between users
- **Real-time message delivery**
- **Message read status**
- **Share posts** via DM
- **Conversation list** with last message preview
- **Unread message indicators**

### 5. Notifications
- **Real-time notifications** for:
  - New likes
  - New followers
  - New comments
  - New messages
  - Opportunity updates
- **Read/Unread status**
- **Notification badges**
- **Deep linking** to relevant content

### 6. Opportunities
- **Create opportunities** (teams/scouts)
- **Browse opportunities** (athletes)
- **Apply to opportunities** with cover letter
- **Application tracking** (pending, accepted, rejected)
- **Deadline management**
- **Sport and location filtering**
- **Paid/Free opportunity tags**

### 7. Discovery
- **Search users** by name, sport, role
- **Filter by role** (athletes, coaches, etc.)
- **Trending users**
- **Suggested follows**
- **User profile preview**

### 8. Settings
- **Profile editing**
- **Password change**
- **Privacy settings**
- **Notification preferences**
- **Account deletion**
- **Logout**

---

## Security Implementation

### Row Level Security (RLS)

All tables have RLS enabled with strict policies:

**Profiles**
- ✅ Public read access
- ✅ Users can update only their own profile
- ✅ Authenticated users can create profiles

**Posts**
- ✅ Public read access
- ✅ Users can create, update, delete only their own posts

**Opportunities**
- ✅ Public read access
- ✅ Only teams/scouts can create opportunities
- ✅ Only creators can update/delete their opportunities

**Applications**
- ✅ Visible only to applicant and opportunity owner
- ✅ Athletes can create/update their applications
- ✅ Teams can update application status

**Follows, Likes, Comments**
- ✅ Public read access
- ✅ Users can create/delete only their own actions

**Messages**
- ✅ Visible only to sender and receiver
- ✅ Encrypted end-to-end ready architecture

**Notifications**
- ✅ Users see only their own notifications
- ✅ Users can mark as read

### Storage Security

**Avatars Bucket**
- Read: Public
- Insert: Authenticated users only
- Update/Delete: Object owner only

**Posts Bucket**
- Read: Public
- Insert: Authenticated users only
- Update/Delete: Object owner only

---

## Backend Functions & Triggers

### Automated Counter Updates
- **Post likes counter** - Updates on like/unlike
- **Post comments counter** - Updates on comment add/remove
- **Comment likes counter** - Updates on comment like/unlike
- **Follower counts** - Updates on follow/unfollow
- **User posts count** - Updates on post create/delete

### Automated Notifications
- **Like notification** - Triggers when post is liked
- **Follow notification** - Triggers when user is followed
- **Comment notification** - Triggers when post is commented on
- **Message notification** - Triggers when message is received

### Database Functions
```sql
- update_post_likes_count()
- update_post_comments_count()
- update_comment_likes_count()
- update_follow_counts()
- update_posts_count()
- create_like_notification()
- create_follow_notification()
- create_comment_notification()
- create_message_notification()
```

---

## State Management Strategy

### Server State (React Query)
- Posts feed
- User profiles
- Opportunities
- Messages
- Notifications
- Comments

### Global State (Context API)
- **AuthContext**: Current user, session, auth methods
- **PostsContext**: Post CRUD operations, feed management
- **FollowContext**: Follow/unfollow operations, follow checks
- **MessagesContext**: Chat management, unread counts
- **NotificationsContext**: Notification management
- **OpportunitiesContext**: Opportunity CRUD, applications
- **UsersContext**: User search, user data
- **ScoutingContext**: Scouting-specific features
- **SearchContext**: Global search state

### Local State (useState)
- Form inputs
- UI toggles
- Modal visibility
- Temporary filters

### Persistent State (AsyncStorage)
- User preferences
- Theme settings
- Cache for offline support

---

## Real-time Features

### Supabase Real-time Subscriptions

**Feed Updates**
- New posts appear instantly
- Like/comment counts update live
- User status updates

**Messaging**
- Real-time message delivery
- Typing indicators
- Read receipts

**Notifications**
- Instant notification delivery
- Badge count updates
- Toast notifications

**Opportunities**
- New opportunity alerts
- Application status updates

---

## API Integration

### Supabase Client Configuration

```typescript
// constants/supabase.ts
- createClient with anon key
- Storage configuration
- Real-time subscriptions
- Auth listeners
```

### Context Providers Pattern

```typescript
// Example: hooks/posts-context.tsx
- useQuery for data fetching
- useMutation for write operations
- Optimistic updates
- Cache invalidation
- Error handling
```

---

## File Upload System

### Avatar Upload
1. User selects image from device
2. Image compressed (if needed)
3. Upload to `avatars` bucket
4. Public URL stored in profile
5. Old avatar deleted

### Post Media Upload
1. User selects media (image/video)
2. Upload to `posts` bucket
3. Generate signed URL
4. Store URL in post record
5. Display in feed

### Storage Limits
- Avatars: 2MB max
- Posts: 50MB max
- Supported formats: JPEG, PNG, WebP, MP4, MOV

---

## Error Handling

### Error Boundaries
- Root-level error boundary
- Graceful error UI
- Error logging
- Recovery actions

### Network Error Handling
- Retry logic in React Query
- Offline detection
- User-friendly error messages
- Fallback UI states

### Validation
- Client-side form validation
- Server-side constraint validation
- Type safety with TypeScript
- Input sanitization

---

## Performance Optimizations

### Code Splitting
- Route-based code splitting via Expo Router
- Lazy loading of heavy components

### Image Optimization
- expo-image for cached images
- Lazy loading images in feed
- Thumbnail generation

### List Virtualization
- FlatList with efficient rendering
- Pagination for infinite scroll
- Window size optimization

### Query Optimization
- React Query caching
- Selective re-fetching
- Stale-while-revalidate strategy
- Index usage in database

---

## Testing Strategy

### Type Safety
- Strict TypeScript mode
- Interface definitions for all data
- Type guards for runtime checks

### Manual Testing
- Cross-platform testing (iOS, Android, Web)
- Role-based testing scenarios
- Edge case handling
- Permission testing

### Test Identifiers
- testID props on interactive elements
- Prepared for automated UI testing

---

## Deployment

### Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Build Configuration
- app.json configured for production
- Splash screen and icons
- App identifiers
- Version management

### Platform Support
- ✅ iOS (via Expo Go)
- ✅ Android (via Expo Go)
- ✅ Web (via React Native Web)

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- Bun package manager
- Expo CLI
- Supabase account

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd onlykrida
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Add Supabase credentials
   ```

4. **Run database migrations**
   - Execute SQL files in Supabase SQL Editor:
     1. `supabase-final-working-setup.sql` (complete database schema)
     2. Storage policies (via Supabase dashboard)

5. **Start development server**
   ```bash
   bun start
   ```

6. **Run on device**
   - Scan QR code with Expo Go (iOS/Android)
   - Press 'w' for web

---

## Future Enhancements

### Planned Features
- [ ] Video streaming optimization
- [ ] Advanced analytics dashboard
- [ ] ML-powered content recommendations
- [ ] Team management tools
- [ ] Event scheduling and calendar
- [ ] Payment integration for paid opportunities
- [ ] Live match streaming
- [ ] Coach/athlete training plans
- [ ] Performance tracking and stats
- [ ] Recruitment pipeline management

### Technical Improvements
- [ ] Offline-first architecture
- [ ] Push notifications (Expo Notifications)
- [ ] E2E testing suite
- [ ] Performance monitoring
- [ ] Analytics integration
- [ ] CI/CD pipeline
- [ ] Automated backups
- [ ] CDN for media assets

---

## Team & Maintenance

### Code Quality Standards
- TypeScript strict mode
- Consistent file structure
- Component reusability
- Comprehensive error handling
- Security-first approach

### Documentation
- Inline code comments (when necessary)
- Type definitions for all functions
- README files for complex features
- SQL schema documentation
- API documentation

---

## Conclusion

OnlyKrida is a production-ready, scalable social platform built with modern technologies and best practices. The application leverages Supabase for a robust backend infrastructure while maintaining a clean, performant React Native frontend. With comprehensive security measures, real-time capabilities, and a well-structured codebase, the platform is ready for further development and scaling.

### Key Strengths
✅ **Type-safe** - Full TypeScript coverage  
✅ **Secure** - Comprehensive RLS policies  
✅ **Real-time** - Live updates via Supabase  
✅ **Scalable** - Cloud infrastructure  
✅ **Cross-platform** - iOS, Android, Web  
✅ **Maintainable** - Clean architecture  
✅ **Feature-rich** - Complete social platform  

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Project Status**: Active Development  
**Contact**: [Your contact information]
