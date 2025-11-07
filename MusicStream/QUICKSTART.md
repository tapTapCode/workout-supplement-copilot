# MusicStream - Quick Start Guide

This guide will help you get MusicStream up and running in under 10 minutes.

## Step 1: Create Xcode Project

1. Open Xcode
2. Select **File → New → Project**
3. Choose **iOS → App**
4. Configure:
   - Product Name: `MusicStream`
   - Team: Select your team
   - Organization Identifier: `com.yourname.musicstream`
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: None
   - Include Tests: Optional
5. Click **Next** and save to: `/Users/jumar.juaton/Documents/Github/MusicStream`

## Step 2: Add Existing Swift Files

1. In Xcode, **right-click** on the `MusicStream` folder in the Project Navigator
2. Select **Add Files to "MusicStream"...**
3. Navigate to `/Users/jumar.juaton/Documents/Github/MusicStream/MusicStream/`
4. Select all folders and files:
   - Models/
   - Views/
   - ViewModels/
   - Services/
5. Ensure **"Copy items if needed"** is UNCHECKED (they're already in the right place)
6. Ensure **"Create groups"** is selected
7. Click **Add**

## Step 3: Remove Default Files

Xcode creates a default `ContentView.swift` file. Remove it:
1. Right-click on `ContentView.swift`
2. Select **Delete**
3. Choose **Move to Trash**

## Step 4: Configure Info.plist

1. Select your project in the Project Navigator
2. Select the **MusicStream** target
3. Go to the **Info** tab
4. Add these keys:

### Privacy - Media Library Usage Description
- Key: `NSAppleMusicUsageDescription`
- Value: `MusicStream needs access to play music`

### Background Modes
1. Go to **Signing & Capabilities** tab
2. Click **+ Capability**
3. Add **Background Modes**
4. Enable **Audio, AirPlay, and Picture in Picture**

## Step 5: Set Deployment Target

1. In the project settings, set **iOS Deployment Target** to **17.0**
2. This ensures compatibility with all SwiftUI features used

## Step 6: Build and Run

1. Select a simulator (e.g., iPhone 15 Pro)
2. Press **⌘ + B** to build
3. Fix any initial build errors (usually import statements)
4. Press **⌘ + R** to run

## Expected Behavior

When you first run the app, you'll see:

1. **Welcome Screen** with:
   - MusicStream logo
   - "110M+ songs in HiFi quality"
   - Sign In, Create Account, and Continue as Guest buttons

2. After clicking **Continue as Guest**:
   - Main tab bar with Home, Search, Library, Profile
   - Empty content (since no backend is connected yet)

## Step 7: Connect to Backend (Optional)

To connect to a real backend:

1. Open `MusicStream/Services/APIService.swift`
2. Update the `baseURL`:
```swift
private let baseURL = "https://your-api.com/api"
```
3. Implement your backend API following the endpoints documented in README.md

## Common Issues & Fixes

### Build Error: "Cannot find type 'X' in scope"
**Solution**: Make sure all Swift files are added to the project target
- Select the file in Project Navigator
- Check **Target Membership** in File Inspector (⌘ + ⌥ + 1)

### App Crashes on Launch
**Solution**: Check that `MusicStreamApp.swift` is the main entry point
- Should have `@main` attribute
- Should create `PlayerViewModel` and `AuthViewModel`

### Player Not Working
**Solution**: Background audio not configured
- Add Background Modes capability
- Enable Audio, AirPlay, and Picture in Picture

### UI Not Displaying Correctly
**Solution**: iOS version incompatibility
- Ensure deployment target is iOS 17.0+
- Some SwiftUI features require iOS 17+

## Next Steps

### Add Test Data
To see the UI with content, add mock data in the ViewModels:

```swift
// In HomeViewModel.swift
func loadContent() {
    isLoading = true
    
    // Mock data
    self.featuredArtists = [
        Artist(id: "1", name: "Test Artist", ...)
    ]
    
    isLoading = false
}
```

### Implement Real Backend
1. Set up a REST API with the documented endpoints
2. Update APIService.swift with your URL
3. Test with real data

### Customize Branding
1. Add custom app icons (Assets.xcassets)
2. Update colors in views (replace Color.purple)
3. Add launch screen

## Testing Checklist

- [ ] App launches without crashes
- [ ] Welcome screen displays
- [ ] Can navigate to guest mode
- [ ] All tabs are accessible/Users/jumar.juaton/Documents/GitHub/MusicStream/MusicStream
- [ ] Search bar is functional (UI only)
- [ ] Profile screen displays subscription options
- [ ] Mini player appears when song is "playing" (mock)

## Need Help?

1. Check README.md for detailed documentation
2. Review the code comments in each Swift file
3. Xcode's documentation (⌘ + Shift + 0) for SwiftUI help
4. SwiftUI tutorials on developer.apple.com

## Performance Tips

- Use **Instruments** to profile performance
- Test on real device for accurate audio performance
- Use **Xcode Previews** for rapid UI development:
```swift
#Preview {
    HomeView()
}
```

---

**You're all set!** 🎉 Start building your music streaming empire!
