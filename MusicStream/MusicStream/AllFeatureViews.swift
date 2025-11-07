import SwiftUI

// MARK: - Feature 2: Social Listening Rooms
struct ListeningRoomsView: View {
    @State private var showCreateRoom = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Listening Rooms")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal)
                    
                    Button(action: { showCreateRoom = true }) {
                        HStack {
                            Image(systemName: "plus.circle.fill")
                            Text("Create Room")
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Active Rooms")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(0..<5) { _ in
                            RoomCard()
                        }
                    }
                }
                .padding(.vertical)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct RoomCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 40, height: 40)
                    .overlay(Text("JD").foregroundColor(.white).fontWeight(.bold))
                
                VStack(alignment: .leading) {
                    Text("Chill Vibes Only")
                        .font(.headline)
                        .foregroundColor(.white)
                    Text("Hosted by John • 12 listening")
                        .font(.caption)
                        .foregroundColor(.white.opacity(0.6))
                }
                Spacer()
                Image(systemName: "person.3.fill")
                    .foregroundColor(.green)
            }
            
            Text("🎵 Playing: Midnight City - M83")
                .font(.caption)
                .foregroundColor(.white.opacity(0.8))
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Feature 3: Artist Revenue Dashboard
struct ArtistRevenueView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Artist Support")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal)
                    
                    // Your Contribution
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Impact This Month")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack(spacing: 20) {
                            StatCard(value: "$12.50", label: "Total Contributed", color: .green)
                            StatCard(value: "340", label: "Streams", color: .blue)
                        }
                        
                        HStack(spacing: 20) {
                            StatCard(value: "25", label: "Artists Supported", color: .purple)
                            StatCard(value: "$0.037", label: "Avg per Stream", color: .orange)
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Top Supported Artists
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Artists You Support")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(0..<3) { _ in
                            ArtistRevenueCard()
                        }
                    }
                }
                .padding(.vertical)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct ArtistRevenueCard: View {
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color.purple)
                .frame(width: 50, height: 50)
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Taylor Swift")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                Text("Your contribution: $2.85")
                    .font(.caption)
                    .foregroundColor(.green)
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "heart.circle.fill")
                    .font(.title2)
                    .foregroundColor(.red)
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Feature 4: Mashup Studio
struct MashupStudioView: View {
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("Mashup Studio")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .padding(.horizontal)
                    
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "waveform.badge.plus")
                            Text("Create New Mashup")
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.pink)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Your Mashups")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(0..<2) { _ in
                            MashupCard()
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Trending")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ForEach(0..<3) { _ in
                            MashupCard()
                        }
                    }
                }
                .padding(.vertical)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct MashupCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: 8)
                .fill(LinearGradient(colors: [.pink, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(height: 100)
                .overlay(
                    Image(systemName: "waveform")
                        .font(.largeTitle)
                        .foregroundColor(.white)
                )
            
            Text("Summer Vibes Mix")
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.white)
            
            Text("2 songs • 3:45")
                .font(.caption)
                .foregroundColor(.white.opacity(0.6))
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
        .padding(.horizontal)
    }
}

// MARK: - Features 5-10 (Placeholder Views)
struct AudioQualityView: View {
    var body: some View {
        FeaturePlaceholder(title: "Smart Audio Quality", icon: "waveform", description: "Context-aware quality switching based on network, battery, and headphones")
    }
}

struct TimeMachineView: View {
    var body: some View {
        FeaturePlaceholder(title: "Time Machine", icon: "clock.arrow.circlepath", description: "Rediscover music from your memories and special moments")
    }
}

struct MusicTribesView: View {
    var body: some View {
        FeaturePlaceholder(title: "Music Tribes", icon: "person.2.badge.gearshape", description: "Discover music with like-minded listeners")
    }
}

struct MusicDNAView: View {
    var body: some View {
        FeaturePlaceholder(title: "Music DNA", icon: "waveform.circle", description: "Visualize your unique listening patterns")
    }
}

struct PracticeModeView: View {
    var body: some View {
        FeaturePlaceholder(title: "Practice Mode", icon: "music.note.list", description: "Loop, slow down, and isolate instruments")
    }
}

struct OfflineSyncView: View {
    var body: some View {
        FeaturePlaceholder(title: "Smart Offline Sync", icon: "arrow.down.circle", description: "AI predicts and downloads music you'll want")
    }
}

struct FeaturePlaceholder: View {
    let title: String
    let icon: String
    let description: String
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            VStack(spacing: 20) {
                Image(systemName: icon)
                    .font(.system(size: 60, weight: .thin))
                    .foregroundColor(.white.opacity(0.3))
                
                Text(title)
                    .font(.title)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.6))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                Text("Coming Soon")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.purple)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.purple.opacity(0.2))
                    .cornerRadius(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}
