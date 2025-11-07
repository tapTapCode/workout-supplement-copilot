import SwiftUI

struct MoodPlaylistsView: View {
    @State private var selectedMood: MoodType = .energetic
    @State private var currentContext: String = "Detecting..."
    @State private var isGenerating = false
    
    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text("AI Mood Playlists")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                        
                        Text("Dynamic playlists that adapt to your current state")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .padding(.horizontal)
                    
                    // Current Context Card
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Current Context")
                            .font(.headline)
                            .foregroundColor(.white)
                        
                        HStack(spacing: 16) {
                            ContextBadge(icon: "clock", label: "Morning", color: .orange)
                            ContextBadge(icon: "sun.max", label: "Sunny", color: .yellow)
                            ContextBadge(icon: "figure.walk", label: "Active", color: .green)
                        }
                        
                        HStack(spacing: 16) {
                            ContextBadge(icon: "location", label: "Home", color: .blue)
                            ContextBadge(icon: "heart", label: "72 BPM", color: .red)
                        }
                    }
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Mood Selector
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Select Your Mood")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(MoodType.allCases, id: \.self) { mood in
                                    MoodChip(
                                        mood: mood,
                                        isSelected: selectedMood == mood,
                                        action: { selectedMood = mood }
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    
                    // Generate Button
                    Button(action: {
                        isGenerating = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            isGenerating = false
                        }
                    }) {
                        HStack {
                            if isGenerating {
                                ProgressView()
                                    .tint(.black)
                            } else {
                                Image(systemName: "sparkles")
                            }
                            Text(isGenerating ? "Generating..." : "Generate Playlist")
                                .fontWeight(.medium)
                        }
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    
                    // Recently Generated
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Recently Generated")
                            .font(.headline)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                        
                        VStack(spacing: 12) {
                            ForEach(0..<3) { _ in
                                PlaylistRow()
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct ContextBadge: View {
    let icon: String
    let label: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
            Text(label)
                .font(.caption)
                .fontWeight(.medium)
        }
        .foregroundColor(color)
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(color.opacity(0.2))
        .cornerRadius(20)
    }
}

struct MoodChip: View {
    let mood: MoodType
    let isSelected: Bool
    let action: () -> Void
    
    var moodIcon: String {
        switch mood {
        case .energetic: return "bolt.fill"
        case .calm: return "leaf.fill"
        case .focused: return "brain.head.profile"
        case .happy: return "sun.max.fill"
        case .melancholic: return "cloud.rain.fill"
        case .workout: return "figure.run"
        case .sleep: return "moon.fill"
        case .party: return "sparkles"
        }
    }
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: moodIcon)
                    .font(.title2)
                Text(mood.rawValue)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .foregroundColor(isSelected ? .black : .white)
            .frame(width: 80, height: 80)
            .background(isSelected ? Color.white : Color.white.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

struct PlaylistRow: View {
    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 8)
                .fill(LinearGradient(
                    colors: [.purple, .blue],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .frame(width: 50, height: 50)
                .overlay(
                    Image(systemName: "music.note")
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                Text("Energetic Morning")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                
                Text("25 songs • Updated 2h ago")
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "play.circle.fill")
                    .font(.title2)
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}
