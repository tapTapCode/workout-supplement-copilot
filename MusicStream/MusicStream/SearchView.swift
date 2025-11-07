import SwiftUI
import MusicKit

struct SearchView: View {
    @StateObject private var musicService = MusicKitService.shared
    @State private var searchText = ""
    @State private var searchResults: [Song] = []
    @State private var isSearching = false
    
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack(spacing: 0) {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.6))
                        
                        TextField("Search", text: $searchText)
                            .textFieldStyle(.plain)
                            .foregroundColor(.white)
                            .onChange(of: searchText) { newValue in
                                Task {
                                    await performSearch(query: newValue)
                                }
                            }
                            .submitLabel(.search)
                        
                        if !searchText.isEmpty {
                            Button(action: { 
                                searchText = ""
                                searchResults = []
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.white.opacity(0.6))
                            }
                        }
                    }
                    .padding(12)
                    .background(Color.white.opacity(0.08))
                    .cornerRadius(8)
                    .padding()
                    
                    if searchText.isEmpty {
                        VStack(spacing: 24) {
                            Spacer()
                            Image(systemName: "magnifyingglass")
                                .font(.system(size: 50, weight: .thin))
                                .foregroundColor(.white.opacity(0.3))
                            Text("Search for songs, artists, albums")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.5))
                            Spacer()
                        }
                    } else if isSearching {
                        VStack {
                            Spacer()
                            ProgressView()
                                .tint(.white)
                            Spacer()
                        }
                    } else if !searchResults.isEmpty {
                        ScrollView {
                            VStack(spacing: 12) {
                                ForEach(searchResults) { song in
                                    SongRowView(song: song)
                                }
                            }
                            .padding()
                        }
                    } else if !searchText.isEmpty {
                        VStack(spacing: 24) {
                            Spacer()
                            Text("No results found")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.5))
                            Spacer()
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    func performSearch(query: String) async {
        guard !query.isEmpty, musicService.isAuthorized else {
            searchResults = []
            return
        }
        
        isSearching = true
        
        do {
            let results = try await musicService.search(for: query)
            searchResults = Array(results)
        } catch {
            print("Search error: \(error)")
            searchResults = []
        }
        
        isSearching = false
    }
}
