# MusicStream

An artist-first, fan-centered music streaming platform delivering 110+ million songs in HiFi sound quality.

## Overview

MusicStream is a modern iOS music streaming application built with SwiftUI, designed to prioritize artist revenue and fan experience. The platform features lossless audio quality, revenue transparency, and direct artist support.

## Features

### Core Features
- 🎵 **110M+ Songs** - Massive music library with diverse content
- 🎧 **HiFi Audio Quality** - Lossless FLAC and Master Quality Audio (MQA)
- 🔍 **Advanced Search** - Powered by Elasticsearch for fast, relevant results
- 📱 **Modern iOS App** - Built with SwiftUI and native iOS frameworks
- 🎨 **Beautiful UI** - Clean, intuitive interface with smooth animations

### Artist-First Features
- 💰 **Revenue Transparency** - Artists can display per-stream rates and monthly revenue
- ❤️ **Direct Artist Support** - Fans can directly support artists with 100% going to the artist
- ✅ **Artist Verification** - Verified badge system for authentic artist profiles
- 📊 **Artist Analytics** - Monthly listeners, total streams, and engagement metrics
- 🔗 **Social Integration** - Direct links to artist social media and websites

### Fan Experience
- 📚 **Personal Library** - Save playlists, artists, albums, and songs
- 🎯 **Smart Recommendations** - Personalized music discovery
- 📝 **Playlist Creation** - Create and share custom playlists
- ⬇️ **Offline Mode** - Download music for offline listening
- 🎵 **Queue Management** - Full control over playback queue

### Subscription Tiers
- **Free** - Basic streaming with ads
- **HiFi** ($9.99/month) - Lossless FLAC, ad-free, unlimited skips
- **HiFi Plus** ($14.99/month) - MQA, exclusive content, higher artist revenue share

## Tech Stack

### iOS App
- **SwiftUI** - Modern declarative UI framework
- **Combine** - Reactive programming for async operations
- **AVFoundation** - High-quality audio playback
- **URLSession** - Network requests
- **Swift 5.9+** - Latest Swift features

### Architecture
- **MVVM Pattern** - Clean separation of concerns
- **Combine Publishers** - Reactive data flow
- **Environment Objects** - Shared state management
- **Async/Await** - Modern concurrency

## Project Structure

```
MusicStream/
├── MusicStream/
│   ├── MusicStreamApp.swift       # App entry point
│   ├── Models/
│   │   └── Models.swift           # Data models (Song, Artist, Album, etc.)
│   ├── Views/
│   │   ├── MainTabView.swift      # Tab navigation
│   │   ├── WelcomeView.swift      # Onboarding
│   │   ├── HomeView.swift         # Home feed
│   │   ├── SearchView.swift       # Search interface
│   │   ├── LibraryView.swift      # User library
│   │   ├── ProfileView.swift      # User profile & settings
│   │   ├── ArtistProfileView.swift # Artist detail page
│   │   ├── DetailViews.swift      # Album, Playlist, Player views
│   │   └── Components.swift       # Reusable UI components
│   ├── ViewModels/
│   │   └── ViewModels.swift       # Business logic
│   ├── Services/
│   │   └── APIService.swift       # Network layer
│   ├── Utils/
│   └── Resources/
└── README.md
```

## Getting Started

### Prerequisites
- macOS 13.0 or later
- Xcode 15.0 or later
- iOS 17.0+ deployment target
- Apple Developer account (for device testing)

### Installation

1. **Clone the repository**
```bash
cd /Users/jumar.juaton/Documents/Github/MusicStream
```

2. **Open in Xcode**
```bash
open MusicStream.xcodeproj
```
*Note: You'll need to create an Xcode project first*

3. **Configure Backend URL**
Edit `MusicStream/Services/APIService.swift` and update the `baseURL`:
```swift
private let baseURL = "https://your-backend-api.com/api"
```

4. **Build and Run**
- Select your target device or simulator
- Press `⌘ + R` to build and run

### Creating the Xcode Project

Since we've created the Swift files manually, you'll need to create an Xcode project:

1. Open Xcode
2. File → New → Project
3. Select "iOS" → "App"
4. Product Name: **MusicStream**
5. Interface: **SwiftUI**
6. Language: **Swift**
7. Save to: `/Users/jumar.juaton/Documents/Github/MusicStream`
8. Add all the created `.swift` files to the project
9. Configure Info.plist for audio playback

### Required Capabilities
Add these to your Info.plist:
```xml
<key>NSAppleMusicUsageDescription</key>
<string>MusicStream needs access to play music</string>
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

## Backend Integration

The app expects a REST API with the following endpoints:

### Songs
- `GET /api/songs/:id` - Get song details
- `GET /api/songs/recommended` - Get personalized recommendations

### Artists
- `GET /api/artists/:id` - Get artist details
- `GET /api/artists/:id/top-songs` - Get artist's top songs
- `GET /api/artists/:id/albums` - Get artist's albums
- `GET /api/artists/featured` - Get featured artists
- `POST /api/artists/:id/support` - Support an artist financially

### Albums
- `GET /api/albums/:id` - Get album details
- `GET /api/albums/new-releases` - Get new releases

### Playlists
- `GET /api/playlists/:id` - Get playlist details
- `GET /api/playlists/trending` - Get trending playlists

### Search
- `GET /api/search?q=query` - Search songs, artists, albums, playlists

### User
- `GET /api/user/library` - Get user's saved content

## Development Roadmap

### Phase 1 (Current)
- [x] Core UI/UX design
- [x] Data models
- [x] View hierarchy
- [x] Audio player foundation
- [x] Artist-first features

### Phase 2
- [ ] Backend API integration
- [ ] Real audio streaming
- [ ] User authentication
- [ ] Playlist management
- [ ] Offline downloads

### Phase 3
- [ ] Social features (sharing, following)
- [ ] In-app purchases
- [ ] Push notifications
- [ ] CarPlay support
- [ ] Apple Watch app

### Phase 4
- [ ] Lyrics display
- [ ] Concert ticket integration
- [ ] Artist messaging
- [ ] Live streaming events
- [ ] Community features

## Artist-First Philosophy

MusicStream is built on the principle that artists deserve fair compensation and transparency. Our platform:

1. **Higher Payouts** - HiFi Plus subscribers contribute more to artist revenue
2. **Direct Support** - 100% of direct support goes to artists
3. **Transparency** - Artists can show their per-stream rates
4. **No Exploitation** - Fair contracts and honest business practices
5. **Artist Tools** - Analytics, fan engagement, and promotional features

## Contributing

This is a personal project, but contributions are welcome! Areas for contribution:
- UI/UX improvements
- Performance optimizations
- Bug fixes
- New features
- Documentation

## License

Copyright © 2025 MusicStream. All rights reserved.

## Contact

For questions or feedback, please open an issue on GitHub.

---

**Built with ❤️ for artists and music lovers**
