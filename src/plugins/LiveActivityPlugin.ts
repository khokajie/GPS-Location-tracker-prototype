import { registerPlugin } from '@capacitor/core';

export interface LiveActivityPlugin {
  startLiveActivity(): Promise<{ activityId: string }>;
  updateLiveActivity(options: { locationCount: number }): Promise<void>;
  stopLiveActivity(options?: { locationCount: number }): Promise<void>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');

export default LiveActivity;
