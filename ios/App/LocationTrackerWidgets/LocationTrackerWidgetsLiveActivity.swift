//
//  LocationTrackerWidgetsLiveActivity.swift
//  LocationTrackerWidgets
//
//  Created by Kho Ka Jie on 28/01/2026.
//

import ActivityKit
import SwiftUI
import WidgetKit

struct LocationTrackerWidgetsLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: LocationTrackerAttributes.self) { context in
            // LOCK SCREEN / STANDBY banner
            HStack(spacing: 12) {
                // Custom icon - uses "LiveActivityIcon" from widget's Assets.xcassets
                // Falls back to green dot if image not found
                if let uiImage = UIImage(named: "LiveActivityIcon") {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 28, height: 28)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 12, height: 12)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("Location Tracking")
                        .font(.headline)
                        .foregroundColor(.primary)
                    Text("\(context.state.locationCount) points captured")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(context.state.lastUpdateTime)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.8))

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    if let uiImage = UIImage(named: "LiveActivityIcon") {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(width: 24, height: 24)
                            .clipShape(Circle())
                    } else {
                        Circle()
                            .fill(Color.green)
                            .frame(width: 14, height: 14)
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    Text("Tracking Active")
                        .font(.headline)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    EmptyView()
                }

                DynamicIslandExpandedRegion(.bottom) {
                    Text("Last update: \(context.state.lastUpdateTime)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } compactLeading: {
                // Compact leading: custom icon or green dot
                if let uiImage = UIImage(named: "LiveActivityIcon") {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 16, height: 16)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 10, height: 10)
                }
            } compactTrailing: {
                EmptyView()
            } minimal: {
                // Minimal: custom icon or green dot
                if let uiImage = UIImage(named: "LiveActivityIcon") {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 16, height: 16)
                        .clipShape(Circle())
                } else {
                    Circle()
                        .fill(Color.green)
                        .frame(width: 10, height: 10)
                }
            }
        }
    }
}
