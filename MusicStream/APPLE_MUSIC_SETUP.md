# Apple Music API Setup Guide

This guide will help you configure MusicKit (Apple Music API) in your MusicStream app.

## Prerequisites

- Active Apple Developer account
- Xcode 15.0 or later
- iOS 17.0 or later deployment target

## Step 1: Enable MusicKit Capability

1. **Open your project** in Xcode
2. Select your **MusicStream** target
3. Go to **Signing & Capabilities** tab
4. Click **+ Capability**
5. Search for and add **"MusicKit"**

## Step 2: Get Apple Music API Key

### Create a MusicKit Identifier

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **MusicKit Identifiers** → Continue
5. Enter a description (e.g., "MusicStream MusicKit")
6. Click **Continue** → **Register**

### Create a MusicKit Key

1. In the Developer Portal, go to **Keys** section
2. Click **+** button
3. Enter a name (e.g., "MusicStream MusicKit Key")
4. Check **MusicKit**
5. Click **Continue** → **Register**
6. **Download the key** (.p8 file) - you can only do this once!
7. Note your **Key ID** and **Team ID**

## Step 3: Configure Info.plist

Add these keys to your `Info.plist`:

### Method 1: Using Info Tab in Xcode

1. Select your project → Target → **Info** tab
2. Add the following keys:

**Privacy - Media Library Usage Description**
- Key: `NSAppleMusicUsageDescription`
- Value: `MusicStream uses Apple Music to provide you with millions of songs`

### Method 2: Edit Info.plist directly

```xml
<key>NSAppleMusicUsageDescription</key>
<string>MusicStream uses Apple Music to provide you with millions of songs</string>
```

## Step 4: Add MusicKit to Project

The MusicKit framework is already imported in the following files:
- `MusicKitService.swift`
- `HomeView.swift`
- `SearchView.swift`

Make sure all these files are added to your Xcode project.

## Step 5: Test the Integration

### Build and Run

1. Press **⌘ + B** to build
2. Press **⌘ + R** to run on simulator or device

### Authorization Flow

1. When you open the app and navigate to the Home tab
2. If Apple Music is not authorized, you'll see "Connect Apple Music" button
3. Click **Authorize**
4. Grant permission when prompted
5. The app will load Apple Music's top charts

### Test Search

1. Go to the Search tab
2. Type any song, artist, or album name
3. Real-time search results will appear from Apple Music catalog

## Features Enabled

✅ **Top Charts** - Browse Apple Music's current top songs and albums
✅ **Search** - Search the entire Apple Music catalog (100M+ songs)
✅ **Album Art** - Display high-quality album artwork
✅ **Song Metadata** - Artist names, album info, track details

## Important Notes

### Subscription Requirements

- **MusicKit API** is free to use for browsing and searching
- **Playback** requires an active Apple Music subscription
- The current implementation shows music data but doesn't play audio yet

### Testing

- Test on a **real iOS device** for best results
- **Simulator works** but may have limitations
- Make sure you're signed in to Apple Music on the test device

### Rate Limits

- Apple Music API has rate limits
- For development: Generally very generous
- For production: Contact Apple if you need higher limits

## Troubleshooting

### "Music access not authorized"
**Solution**: Make sure you granted permission when prompted. Go to Settings → Privacy → Media & Apple Music → MusicStream and enable access.

### Build error: "Cannot find 'MusicKit' in scope"
**Solution**: 
1. Make sure MusicKit capability is added
2. Clean build folder (⌘ + Shift + K)
3. Rebuild (⌘ + B)

### No results in search
**Solution**:
1. Check internet connection
2. Verify Apple Music authorization
3. Make sure you're signed in to Apple Music

### "Developer token required"
**Solution**: For production apps, you'll need to implement server-side token generation. For development/testing, MusicKit handles this automatically when using the device's Apple Music account.

## Next Steps

### Add Playback

To add actual music playback:
1. Use `MusicPlayer` from MusicKit
2. User must have active Apple Music subscription
3. Implement player controls in `PlayerViewModel`

Example:
```swift
import MusicKit

let player = ApplicationMusicPlayer.shared
try await player.play(song: song)
```

### Personalization

- Get user's library with `MusicLibraryRequest`
- Show recently played with `RecentlyPlayedMusicItem`
- Recommendations based on listening history

### Offline Support

- MusicKit doesn't support offline playback
- Users can download songs in Apple Music app
- Your app can access downloaded content

## Resources

- [MusicKit Documentation](https://developer.apple.com/documentation/musickit/)
- [Apple Music API Reference](https://developer.apple.com/documentation/applemusicapi)
- [Human Interface Guidelines - Music](https://developer.apple.com/design/human-interface-guidelines/apple-music)

---

**You're all set!** 🎵 Your app now has access to Apple Music's entire catalog.
