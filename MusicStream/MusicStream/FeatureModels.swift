import Foundation
import CoreLocation
import MusicKit

// MARK: - Feature 1: AI Mood-Based Dynamic Playlists
enum MoodType: String, Codable, CaseIterable {
    case energetic = "Energetic"
    case calm = "Calm"
    case focused = "Focused"
    case happy = "Happy"
    case melancholic = "Melancholic"
    case workout = "Workout"
    case sleep = "Sleep"
    case party = "Party"
}

struct MoodContext: Codable {
    var mood: MoodType
    var timeOfDay: TimeOfDay
    var weather: WeatherCondition?
    var activity: ActivityType
    var heartRate: Int?
    var location: LocationContext?
    var energyLevel: Double // 0.0 - 1.0
}

enum TimeOfDay: String, Codable {
    case morning, afternoon, evening, night, lateNight
}

enum WeatherCondition: String, Codable {
    case sunny, cloudy, rainy, snowy, stormy
}

enum ActivityType: String, Codable {
    case working, exercising, relaxing, commuting, socializing, sleeping
}

struct LocationContext: Codable {
    var type: LocationType
    var coordinate: Coordinate?
}

enum LocationType: String, Codable {
    case home, work, gym, outdoors, venue, car
}

struct Coordinate: Codable {
    var latitude: Double
    var longitude: Double
}

struct DynamicPlaylist: Identifiable, Codable {
    let id: String
    var name: String
    var mood: MoodType
    var songs: [String] // Song IDs
    var lastUpdated: Date
    var context: MoodContext
}

// MARK: - Feature 2: Social Listening Rooms
struct ListeningRoom: Identifiable, Codable {
    let id: String
    var name: String
    var hostID: String
    var hostName: String
    var participants: [Participant]
    var currentSong: String? // Song ID
    var queue: [String] // Song IDs
    var isPublic: Bool
    var maxParticipants: Int
    var createdAt: Date
    var playbackPosition: TimeInterval
    var isPlaying: Bool
}

struct Participant: Identifiable, Codable {
    let id: String
    var username: String
    var avatarURL: String?
    var isModerator: Bool
    var joinedAt: Date
}

struct ChatMessage: Identifiable, Codable {
    let id: String
    var userID: String
    var username: String
    var message: String
    var timestamp: Date
    var type: MessageType
}

enum MessageType: String, Codable {
    case text, reaction, system, songRequest
}

// MARK: - Feature 3: Artist Revenue Dashboard
struct ArtistRevenue: Identifiable, Codable {
    let id: String
    var artistID: String
    var artistName: String
    var perStreamRate: Double
    var monthlyRevenue: Double
    var yearlyRevenue: Double
    var totalStreams: Int64
    var userContribution: Double // How much this user contributed
    var lastUpdated: Date
}

struct ArtistTip: Identifiable, Codable {
    let id: String
    var artistID: String
    var amount: Double
    var message: String?
    var isRecurring: Bool
    var date: Date
}

struct ArtistSupportSubscription: Identifiable, Codable {
    let id: String
    var artistID: String
    var tier: SupportTier
    var amount: Double
    var startDate: Date
    var benefits: [String]
}

enum SupportTier: String, Codable {
    case basic = "Basic Fan"
    case supporter = "Supporter"
    case superfan = "Superfan"
    case patron = "Patron"
}

// MARK: - Feature 4: AI Song Mashup
struct Mashup: Identifiable, Codable {
    let id: String
    var name: String
    var creatorID: String
    var creatorName: String
    var songIDs: [String]
    var duration: TimeInterval
    var likes: Int
    var plays: Int
    var isPublished: Bool
    var artistApproved: Bool
    var createdAt: Date
    var audioURL: String?
}

struct MashupRequest: Codable {
    var songIDs: [String]
    var style: MashupStyle
    var transitionType: TransitionType
}

enum MashupStyle: String, Codable {
    case seamless, djMix, remix, medley
}

enum TransitionType: String, Codable {
    case crossfade, beatMatch, silence, creative
}

// MARK: - Feature 5: Context-Aware Audio Quality
struct AudioQualitySettings: Codable {
    var autoSwitch: Bool
    var wifiQuality: Quality
    var cellularQuality: Quality
    var lowBatteryQuality: Quality
    var currentQuality: Quality
}

enum Quality: String, Codable, CaseIterable {
    case low = "Low (64kbps)"
    case normal = "Normal (128kbps)"
    case high = "High (256kbps)"
    case hifi = "HiFi (FLAC)"
    case master = "Master (MQA)"
}

// MARK: - Feature 6: Time Machine Mode
struct MusicMemory: Identifiable, Codable {
    let id: String
    var songID: String
    var date: Date
    var location: LocationContext?
    var photos: [String]? // Photo URLs
    var notes: String?
    var mood: MoodType?
}

struct AnniversaryPlaylist: Identifiable, Codable {
    let id: String
    var date: Date
    var title: String
    var songs: [String]
    var memories: [MusicMemory]
}

// MARK: - Feature 7: Collaborative Discovery
struct MusicTribe: Identifiable, Codable {
    let id: String
    var name: String
    var description: String
    var members: [TribeMember]
    var genre: String?
    var isPublic: Bool
    var createdAt: Date
}

struct TribeMember: Identifiable, Codable {
    let id: String
    var username: String
    var trustScore: Double // 0.0 - 1.0
    var tasteSimilarity: Double // 0.0 - 1.0
    var joinedAt: Date
}

struct TribeRecommendation: Identifiable, Codable {
    let id: String
    var songID: String
    var recommendedBy: [String] // User IDs
    var tribeID: String
    var score: Double
    var reason: String
}

// MARK: - Feature 8: Soundwave Visualization
struct ListeningPattern: Codable {
    var topGenres: [String: Int]
    var listeningTimes: [Int: Int] // Hour: count
    var moodDistribution: [MoodType: Int]
    var totalListeningTime: TimeInterval
    var uniqueArtists: Int
    var uniqueSongs: Int
}

struct MusicDNA: Identifiable, Codable {
    let id: String
    var userID: String
    var pattern: ListeningPattern
    var visualizationData: [Double]
    var generatedAt: Date
    var shareableURL: String?
}

// MARK: - Feature 9: Smart Practice Mode
struct PracticeSession: Identifiable, Codable {
    let id: String
    var songID: String
    var loopStart: TimeInterval
    var loopEnd: TimeInterval
    var playbackSpeed: Double // 0.5 - 2.0
    var isolatedInstrument: InstrumentType?
    var notes: String?
    var duration: TimeInterval
    var startedAt: Date
}

enum InstrumentType: String, Codable, CaseIterable {
    case vocals, guitar, bass, drums, piano, strings, all
}

// MARK: - Feature 10: Predictive Offline Sync
struct OfflinePrediction: Codable {
    var predictedSongs: [String] // Song IDs
    var confidence: Double
    var basedOn: [PredictionFactor]
    var updatedAt: Date
}

enum PredictionFactor: String, Codable {
    case timeOfDay, dayOfWeek, location, mood, recentHistory, upcomingEvents
}

struct DownloadQueue: Codable {
    var items: [DownloadItem]
    var totalSize: Int64
    var estimatedTime: TimeInterval
}

struct DownloadItem: Identifiable, Codable {
    let id: String
    var songID: String
    var priority: Int
    var quality: Quality
    var status: DownloadStatus
}

enum DownloadStatus: String, Codable {
    case pending, downloading, completed, failed, paused
}
