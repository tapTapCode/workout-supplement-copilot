import SwiftUI

struct LibraryView: View {
    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                
                VStack {
                    Text("Your Library")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                    
                    List {
                        NavigationLink(destination: Text("Playlists")) {
                            Label("Playlists", systemImage: "music.note.list")
                                .foregroundColor(.white)
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                        
                        NavigationLink(destination: Text("Artists")) {
                            Label("Artists", systemImage: "person.2")
                                .foregroundColor(.white)
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                        
                        NavigationLink(destination: Text("Albums")) {
                            Label("Albums", systemImage: "square.stack")
                                .foregroundColor(.white)
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                        
                        NavigationLink(destination: Text("Liked Songs")) {
                            Label("Liked Songs", systemImage: "heart")
                                .foregroundColor(.white)
                        }
                        .listRowBackground(Color.white.opacity(0.05))
                    }
                    .scrollContentBackground(.hidden)
                    .listStyle(.plain)
                }
            }
            .navigationBarHidden(true)
        }
    }
}
