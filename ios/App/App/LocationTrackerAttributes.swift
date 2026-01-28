import Foundation
import ActivityKit

public struct LocationTrackerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var isTracking: Bool
        public var lastUpdateTime: String
        public var locationCount: Int
    }

    public var sessionStartTime: Date
}
