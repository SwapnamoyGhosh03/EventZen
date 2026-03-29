import { Preference, IPreference, IChannelPreference } from '../models/preference.model';

export async function getPreferences(userId: string): Promise<IPreference | null> {
  return Preference.findOne({ user_id: userId });
}

export async function upsertPreferences(
  userId: string,
  preferences: Record<string, IChannelPreference>
): Promise<IPreference> {
  const existing = await Preference.findOne({ user_id: userId });

  if (existing) {
    for (const [eventType, prefs] of Object.entries(preferences)) {
      existing.preferences.set(eventType, prefs);
    }
    existing.updated_at = new Date();
    return existing.save();
  }

  return Preference.create({
    user_id: userId,
    preferences,
    updated_at: new Date(),
  });
}

export function isChannelAllowed(
  prefs: IPreference | null,
  eventType: string,
  channel: string
): boolean {
  if (!prefs) return true; // No preferences set = allow all

  const eventPrefs = prefs.preferences.get(eventType);
  if (!eventPrefs) return true; // No preference for this event type = allow

  const channelKey = channel.toLowerCase() as keyof IChannelPreference;
  if (channelKey === 'email' || channelKey === 'sms' || channelKey === 'push') {
    return eventPrefs[channelKey];
  }

  return true; // IN_APP and WEBHOOK not controlled by preferences
}
