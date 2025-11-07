import SwiftUI

struct FeaturesView: View {
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        Text("Innovative Features")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)
                            .padding(.top, 20)
                        
                        Text("Revolutionary music experiences")
                            .font(.subheadline)
                            .foregroundColor(.white.opacity(0.6))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)
                        
                        VStack(spacing: 16) {
                            // Feature 1
                            NavigationLink(destination: MoodPlaylistsView()) {
                                FeatureCard(
                                    icon: "brain.head.profile",
                                    title: "AI Mood Playlists",
                                    description: "Dynamic playlists that adapt to your mood, activity, and context",
                                    color: .purple
                                )
                            }
                            
                            // Feature 2
                            NavigationLink(destination: ListeningRoomsView()) {
                                FeatureCard(
                                    icon: "person.3.fill",
                                    title: "Social Rooms",
                                    description: "Listen together with friends in real-time",
                                    color: .blue
                                )
                            }
                            
                            // Feature 3
                            NavigationLink(destination: ArtistRevenueView()) {
                                FeatureCard(
                                    icon: "dollarsign.circle",
                                    title: "Artist Support",
                                    description: "See revenue transparency and support artists directly",
                                    color: .green
                                )
                            }
                            
                            // Feature 4
                            NavigationLink(destination: MashupStudioView()) {
                                FeatureCard(
                                    icon: "waveform.badge.magnifyingglass",
                                    title: "Mashup Studio",
                                    description: "Create AI-powered mashups of your favorite songs",
                                    color: .pink
                                )
                            }
                            
                            // Feature 5
                            NavigationLink(destination: AudioQualityView()) {
                                FeatureCard(
                                    icon: "waveform",
                                    title: "Smart Quality",
                                    description: "Context-aware audio quality optimization",
                                    color: .orange
                                )
                            }
                            
                            // Feature 6
                            NavigationLink(destination: TimeMachineView()) {
                                FeatureCard(
                                    icon: "clock.arrow.circlepath",
                                    title: "Time Machine",
                                    description: "Rediscover music from your memories",
                                    color: .cyan
                                )
                            }
                            
                            // Feature 7
                            NavigationLink(destination: MusicTribesView()) {
                                FeatureCard(
                                    icon: "person.2.badge.gearshape",
                                    title: "Music Tribes",
                                    description: "Discover music with like-minded listeners",
                                    color: .indigo
                                )
                            }
                            
                            // Feature 8
                            NavigationLink(destination: MusicDNAView()) {
                                FeatureCard(
                                    icon: "waveform.circle",
                                    title: "Music DNA",
                                    description: "Visualize your unique listening patterns",
                                    color: .mint
                                )
                            }
                            
                            // Feature 9
                            NavigationLink(destination: PracticeModeView()) {
                                FeatureCard(
                                    icon: "music.note.list",
                                    title: "Practice Mode",
                                    description: "Smart tools for musicians to practice",
                                    color: .teal
                                )
                            }
                            
                            // Feature 10
                            NavigationLink(destination: OfflineSyncView()) {
                                FeatureCard(
                                    icon: "arrow.down.circle",
                                    title: "Smart Offline",
                                    description: "AI predicts what you'll want to hear offline",
                                    color: .yellow
                                )
                            }
                        }
                        .padding(.horizontal)
                    }
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct FeatureCard: View {
    let icon: String
    let title: String
    let description: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(color.opacity(0.2))
                    .frame(width: 50, height: 50)
                
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(2)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(.white.opacity(0.3))
        }
        .padding()
        .background(Color.white.opacity(0.05))
        .cornerRadius(12)
    }
}
