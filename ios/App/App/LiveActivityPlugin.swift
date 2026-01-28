import Capacitor
import Foundation
import ActivityKit

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPInstancePlugin, CAPBridgedPlugin {
    public let identifier = "LiveActivityPlugin"
    public let jsName = "LiveActivity"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateLiveActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopLiveActivity", returnType: CAPPluginReturnPromise),
    ]

    private var currentActivity: Any? = nil

    @objc func startLiveActivity(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.reject("Live Activities not enabled")
                return
            }

            let attributes = LocationTrackerAttributes(sessionStartTime: Date())
            let state = LocationTrackerAttributes.ContentState(
                isTracking: true,
                lastUpdateTime: Self.timeString(),
                locationCount: 0
            )

            do {
                let activity = try Activity.request(
                    attributes: attributes,
                    content: .init(state: state, staleDate: nil)
                )
                currentActivity = activity
                call.resolve(["activityId": activity.id])
            } catch {
                call.reject("Failed to start Live Activity: \(error.localizedDescription)")
            }
        } else {
            call.reject("Live Activities require iOS 16.2+")
        }
    }

    @objc func updateLiveActivity(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            guard let activity = currentActivity as? Activity<LocationTrackerAttributes> else {
                call.reject("No active Live Activity")
                return
            }

            let count = call.getInt("locationCount") ?? 0
            let state = LocationTrackerAttributes.ContentState(
                isTracking: true,
                lastUpdateTime: Self.timeString(),
                locationCount: count
            )

            Task {
                await activity.update(.init(state: state, staleDate: nil))
                call.resolve()
            }
        } else {
            call.reject("Requires iOS 16.2+")
        }
    }

    @objc func stopLiveActivity(_ call: CAPPluginCall) {
        if #available(iOS 16.2, *) {
            guard let activity = currentActivity as? Activity<LocationTrackerAttributes> else {
                call.reject("No active Live Activity")
                return
            }

            let finalState = LocationTrackerAttributes.ContentState(
                isTracking: false,
                lastUpdateTime: Self.timeString(),
                locationCount: call.getInt("locationCount") ?? 0
            )

            Task {
                await activity.end(
                    .init(state: finalState, staleDate: nil),
                    dismissalPolicy: .immediate
                )
                self.currentActivity = nil
                call.resolve()
            }
        } else {
            call.reject("Requires iOS 16.2+")
        }
    }

    private static func timeString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: Date())
    }
}
