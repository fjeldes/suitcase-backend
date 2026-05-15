const Expo = jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue(undefined),
}));
Expo.isExpoPushToken = jest.fn().mockReturnValue(true);

module.exports = { Expo };
