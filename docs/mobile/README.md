# Sigmagit Mobile App

React Native mobile application built with Expo.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ or Bun 1.3+
- **Expo CLI** - Expo development tools
- **iOS Simulator** - For iOS development (requires macOS)
- **Android Emulator** - For Android development
- **Physical Device** - For testing on real device

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev:mobile

# Start Expo Go
expo start

# On physical device
expo start --clear
```

## 📁 Project Structure

```
apps/mobile/
├── app/
│   ├── app.tsx                 # App entry point
│   ├── layout.tsx              # Root layout navigator
│   ├── (tabs)                # Tab navigator
│   │     ├── _layout.tsx      # Home tab
│   │     ├── _layout.tsx      # Repositories tab
│   │     └── _layout.tsx      # Settings tab
│   ├── (tabs)/               # Tab screens
│   │     ├── home/            # Home screen
│   │     ├── repositories      # Repository list
│     │     ├── explore         # Repository discovery
│   │     ├── notifications   - Notifications
│   │     └── profile         - User profile
│   │   ├── _layout.tsx      # Repositories tab
│   │     ├── repo-detail/      # Repository detail
│   │     │     ├── issues/         Issues list and detail
│   │     │     ├── pull-requests  - PR list and detail
│   │     │     ├── settings        - Repository settings
│   │     └── _layout.tsx      - Branch and file explorer
│   ├── (tabs)/               # Settings tab
│     │     ├── _layout.tsx      - Settings screens
│   │     └── _layout.tsx      - Account settings
│   ├── (tabs)/               # Profile tab
│   │     └── _layout.tsx      - User profile
│   ├── components/               # Shared components
│   │   ├── navigation/       # Bottom tab navigation
│   │   ├── repo/            # Repository components
│   │   ├── issues/           # Issue components
│   │   └── ui/               # Shared UI components
│   ├── lib/                   # Utilities
│   │   └── constants.ts      # App constants
└── assets/                  # Images and fonts
```

## 🎨 Tech Stack

- **Framework**: React Native
- **Platform**: Expo SDK 51+
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based)
- **State Management**: Zustand
- **Forms**: react-hook-form + zod validation
- **HTTP Client**: Axios
- **Icons**: lucide-react
- **Styling**: NativeWind

## 📱 Navigation

### Tabs

- **Repositories Tab**
  - Repository list
  - Repository discovery
  - Notifications

- **Profile Tab**
  - User profile
  - Account settings

### Routes

| Path | Description |
|------|-------------|
| `/` | Home screen (repositories list) |
| `/:username` | User profile |
| `/:username/:repo` | Repository overview |
| `/:username/:repo/issues` | Issues list |
| `/:username/:repo/pulls` | Pull requests list |
| `/:username/:repo/tree/*` | File tree and file viewer |
| `/:username/:repo/blob/*` | File viewer |
| `/:username/:repo/settings` | Repository settings |
| `/notifications` | All notifications |
| `/settings/*` | Settings pages |
| `/profile` | Edit user profile |
| `/settings/*` | Account settings |

## 🎨 Components

### Navigation
- **Tab Bar** - Bottom tab navigation
- **Header** - App header with actions
- **Back Button** - Navigation back button

### Repository Components
- **RepoList** - Repository list with search
- **RepoCard** - Repository card component
- **CloneButton** - Git clone URL with copy

### Issue Components
- **IssueList** - Issue list with filters
- **IssueCard** - Issue summary card
- **IssueFilter** - Issue filter dropdown

### UI Components
- **Button** - Primary and secondary buttons
- **Input** - Form inputs with validation
- **Badge** - Status and label badges
- **Avatar** - User avatar component
- **Skeleton** - Loading skeleton
- **ActivityIndicator** - Loading spinner
- **Toast** - Toast notifications
- **BottomSheet** - Bottom sheet modals

### Utilities
- **api.ts** - API client wrapper
- **formatDate.ts` - Date formatting utilities
- **git.ts` - Git-related utilities

## 🎨 Styling

**Design System**: NativeWind (Tailwind CSS for React Native)
**Theme**: Built-in light mode (dark mode TBD)
- **Responsive**: Mobile-first design principles

**Colors:**
- **Primary**: `#0066CC` (blue)
- **Success**: `#00C853` (green)
- **Warning**: `F59E0B` (orange)
- **Error**: `EF4444` (red)
- **Neutral**: `64748B` (gray)
- **Background**: `#FFFFFF` (white)
- **Surface**: `#F6F8FA` (light gray)

## 📊 State Management

### Authentication
- **Provider**: better-auth Expo client
- **Storage**: AsyncStorage for persistence
- **Session**: Managed by better-auth automatically

### Cache Strategy
- React Query with AsyncStorage persistence
- Optimistic updates for better UX

### Configuration
```typescript
import { useAuth } from '@sigmagit/hooks';

const { user } = useAuth();
```

## 🌐 API Integration

### API Client
- **Location**: `apps/mobile/lib/api.ts`
- **Base URL**: `process.env.EXPO_PUBLIC_API_URL` || 'http://localhost:3001'`

**Usage:**
```typescript
import { api } from '@/lib/api';

const { data } = await api.get(`/api/repositories/owner/repo`);
```

### React Query Hooks
- **Location**: `packages/hooks/src/`
- **Usage:**
```typescript
import { useRepository } from '@sigmagit/hooks';

const { repo } = await useRepository('owner', 'repo');
```

Available hooks:
- `useRepository` - Repository information
- `useRepositories` - Repository listings
- `useIssues` - Issues list and details
- `usePullRequests` - PR list and details
- `useCommits` - Commit history
- `useTree` - File tree
- useNotifications` - Notification management
- `useSettings` - User settings

## 🚀 Development

### Running Development Server

```bash
# Start mobile app with API server
bun run dev:mobile

# Start mobile app only
bun run dev --filter=@sigmagit/mobile

# Start Expo Go
expo start

# For iOS Simulator
bun run ios

# For Android Emulator
bun run android
```

### Testing

```bash
# Run type checking
bunx tsc --noEmit

# Run linter
bun run lint

# Test on device
expo start --clear
```

### Building

```bash
# Build for iOS
bun run ios

# Build for Android
bun run android

# Build for web
bun run web
```

### Environment Variables

Required:
- `EXPO_PUBLIC_API_URL` - API server URL (default: http://localhost:3001)

Optional:
- `EXPO_PUBLIC_API_URL` - API server URL
- `WEB_URL` - Web app URL

## 📱 Platform-Specific

### iOS

**Build:** `bun run ios`
- **Test:** `bun run ios`
- **Deploy:** TestFlight or App Store

### Android

**Build:** `bun run android`
- **Test:** `bun run android`
- **Deploy:** Google Play Store

### Web

**Build:** `bun run web`
**Test:** `bun run web`
**Deploy**: Web hosting platform

## 🔧 Configuration

### `app.json` Configuration

```json
{
  "expo": {
    "name": "sigmagit",
    "slug": "sigmagit",
    "version": "1.0.0",
    "orientation": "default",
    "icon": "./assets/icon.png",
    "scheme": "sigmagit",
    "android": {
      "package": "com.sigmagit.app",
      "versionCode": 1",
      "adaptiveIcon": false,
      "permissions": ["INTERNET", "READ_EXTERNAL_STORAGE", "WRITE_EXTERNAL_STORAGE"]
    },
    "ios": {
      "bundleIdentifier": "com.sigmagit.app",
      "buildNumber": 1,
      "infoPlist": {
        "NSCameraUsageDescription": "This app requires camera access to scan QR codes"
      },
      "permissions": [
        "camera"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-linear-gradient"
    ],
    "updates": {
      "url": "https://github.com/expo/expo/tree/sdk-51/%40"
    }
  }
}
```

## 🎨 Native Modules

### File System
- **expo-file-system** - Local file access
- **expo-document-picker** - Document picker
- **expo-sharing** - Share functionality
- **expo-camera** - Camera access

### Storage
- **expo-secure-store** - Secure key-value storage
- **AsyncStorage** - Asynchronous storage
- **expo-sqlite** - Local database

## 🚀 Common Issues

### Environment Setup
- **Problem**: API requests failing
- **Solution**: Verify `EXPO_PUBLIC_API_URL` is set correctly

### Authentication
- **Problem**: Session not persisting
****Solution**: Check network connection
- **Solution**: Clear AsyncStorage and restart app

### Git Operations
- **Problem**: Clone/fetch failing
- **Solution**: Check storage backend is configured
- **Solution** Verify git clone URL is accessible

### Notifications
- **Problem**: Not receiving push notifications
-**Solution**: Verify WebSocket connection
- **Solution**: Check notification permissions

### Build Issues
**Problem**: Build fails on iOS
-**Solution**: Check Xcode and iOS simulator
****Problem**: Build fails on Android
******Solution**: Check Android SDK and emulator

### Performance
- **Problem**: App is slow
-**Solution**: Check network connection
-**Solution**: Clear cache and restart
- **Solution**: Disable expensive animations in settings

## 📚 See Also

- [Main README](../README.md) - Project overview
- [API Documentation](../api/README.md) - API endpoints
- [Web App](../web/README.md) - Web application
- [Discord Bot](../discord-bot/README.md) - Discord integration
- [Architecture](../architecture/README.md) - System architecture
- [Development](../development/README.md) - Development workflow
- [Deployment](../deployment/README.md) - Deployment guides
- [Git Operations](../features/git/README.md) - Git features
- [Authentication](../features/auth/README.md) - Auth details
- [Storage](../storage/README.md) - Storage backend
- [Webhooks](../features/webhooks/README.md) - Webhook system
- [Account Linking](../features/account-linking/README.md) - Account linking

---

**Built with Expo 51 + React Native**
