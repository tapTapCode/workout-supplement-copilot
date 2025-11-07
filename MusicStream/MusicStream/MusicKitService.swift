import Foundation
import MusicKit

@MainActor
class MusicKitService: ObservableObject {
    static let shared = MusicKitService()
    
    @Published var authorizationStatus: MusicAuthorization.Status = .notDetermined
    @Published var isAuthorized = false
    
    private init() {
        checkAuthorization()
    }
    
    // MARK: - Authorization
    func checkAuthorization() {
        authorizationStatus = MusicAuthorization.currentStatus
        isAuthorized = authorizationStatus == .authorized
    }
    
    func requestAuthorization() async {
        let status = await MusicAuthorization.request()
        authorizationStatus = status
        isAuthorized = status == .authorized
    }
    
    // MARK: - Search
    func search(for query: String) async throws -> MusicItemCollection<Song> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        var request = MusicCatalogSearchRequest(term: query, types: [Song.self])
        request.limit = 25
        let response = try await request.response()
        return response.songs
    }
    
    func searchArtists(for query: String) async throws -> MusicItemCollection<Artist> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        var request = MusicCatalogSearchRequest(term: query, types: [Artist.self])
        request.limit = 25
        let response = try await request.response()
        return response.artists
    }
    
    func searchAlbums(for query: String) async throws -> MusicItemCollection<Album> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        var request = MusicCatalogSearchRequest(term: query, types: [Album.self])
        request.limit = 25
        let response = try await request.response()
        return response.albums
    }
    
    // MARK: - Recommendations
    func getRecommendations() async throws -> MusicItemCollection<Album> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        let request = MusicCatalogResourceRequest<Album>(matching: \.id, equalTo: MusicItemID(""))
        // Note: Recommendations require user's library access
        // This is a placeholder - actual implementation would use personalized recommendations
        return MusicItemCollection<Album>()
    }
    
    // MARK: - Top Charts
    func getTopSongs(limit: Int = 25) async throws -> MusicItemCollection<Song> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        let request = MusicCatalogChartsRequest(types: [Song.self])
        let response = try await request.response()
        
        if let chart = response.songCharts.first {
            return chart.items
        }
        
        return MusicItemCollection<Song>()
    }
    
    func getTopAlbums(limit: Int = 25) async throws -> MusicItemCollection<Album> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        let request = MusicCatalogChartsRequest(types: [Album.self])
        let response = try await request.response()
        
        if let chart = response.albumCharts.first {
            return chart.items
        }
        
        return MusicItemCollection<Album>()
    }
    
    // MARK: - Artist Details
    func getArtist(id: MusicItemID) async throws -> Artist {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        let request = MusicCatalogResourceRequest<Artist>(matching: \.id, equalTo: id)
        let response = try await request.response()
        
        guard let artist = response.items.first else {
            throw MusicKitError.notFound
        }
        
        return artist
    }
    
    // MARK: - Album Details
    func getAlbum(id: MusicItemID) async throws -> Album {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        var request = MusicCatalogResourceRequest<Album>(matching: \.id, equalTo: id)
        request.properties = [.tracks]
        let response = try await request.response()
        
        guard let album = response.items.first else {
            throw MusicKitError.notFound
        }
        
        return album
    }
    
    // MARK: - Recently Played (requires user library access)
    func getRecentlyPlayed() async throws -> MusicItemCollection<RecentlyPlayedMusicItem> {
        guard isAuthorized else {
            throw MusicKitError.notAuthorized
        }
        
        let request = MusicLibraryRequest<RecentlyPlayedMusicItem>()
        let response = try await request.response()
        return response.items
    }
}

// MARK: - Errors
enum MusicKitError: LocalizedError {
    case notAuthorized
    case notFound
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .notAuthorized:
            return "Music access not authorized"
        case .notFound:
            return "Music item not found"
        case .networkError:
            return "Network error occurred"
        }
    }
}
