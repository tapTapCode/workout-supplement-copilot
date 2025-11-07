import SwiftUI
import MusicKit

struct HomeView: View {
    @StateObject private var musicService = MusicKitService.shared
    @State private var topAlbums: [Album] = []
    @State private var topSongs: [Song] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 32) {
                        Text("For You")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal)
                            .padding(.top, 20)
                        
                        if !musicService.isAuthorized {
                            VStack(spacing: 16) {
                                Text("Connect Apple Music")
                                    .font(.title3)
                                    .foregroundColor(.white.opacity(0.8))
                                
                                Button(action: {
                                    Task {
                                        await musicService.requestAuthorization()
                                        await loadMusic()
                                    }
                                }) {
                                    Text("Authorize")
                                        .font(.system(size: 16, weight: .medium))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 32)
                                        .padding(.vertical, 12)
                                        .background(Color.white)
                                        .cornerRadius(8)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.top, 100)
                        } else if isLoading {
                            ProgressView()
                                .tint(.white)
                                .frame(maxWidth: .infinity)
                                .padding(.top, 100)
                        } else {
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Top Albums")
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal)
                                
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 16) {
                                        ForEach(topAlbums.prefix(10)) { album in
                                            AlbumCardView(album: album)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                            
                            VStack(alignment: .leading, spacing: 16) {
                                Text("Top Songs")
                                    .font(.title3)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal)
                                
                                VStack(spacing: 12) {
                                    ForEach(topSongs.prefix(5)) { song in
                                        SongRowView(song: song)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                }
                .task {
                    if musicService.isAuthorized {
                        await loadMusic()
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
}

    func loadMusic() async {
        isLoading = true
        do {
            let albums = try await musicService.getTopAlbums()
            topAlbums = Array(albums)
            
            let songs = try await musicService.getTopSongs()
            topSongs = Array(songs)
        } catch {
            print("Error loading music: \(error)")
        }
        isLoading = false
    }
}

struct AlbumCardView: View {
    let album: Album
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let artwork = album.artwork {
                ArtworkImage(artwork, width: 140)
                    .cornerRadius(8)
            } else {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 140, height: 140)
            }
            
            Text(album.title)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.white)
                .lineLimit(1)
                .frame(width: 140, alignment: .leading)
            
            Text(album.artistName)
                .font(.caption2)
                .foregroundColor(.white.opacity(0.6))
                .lineLimit(1)
                .frame(width: 140, alignment: .leading)
        }
    }
}

struct SongRowView: View {
    let song: Song
    
    var body: some View {
        HStack(spacing: 12) {
            if let artwork = song.artwork {
                ArtworkImage(artwork, width: 50)
                    .cornerRadius(4)
            } else {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 50, height: 50)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(song.title)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                Text(song.artistName)
                    .font(.caption)
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(1)
            }
            
            Spacer()
            
            Button(action: {}) {
                Image(systemName: "ellipsis")
                    .foregroundColor(.white.opacity(0.6))
            }
        }
    }
}

struct PlaceholderCard: View {
    var body: some View {
        VStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.white.opacity(0.05))
                .frame(width: 140, height: 140)
                .overlay(
                    Image(systemName: "music.note")
                        .font(.largeTitle)
                        .foregroundColor(.white.opacity(0.3))
                )
        }
    }
}
