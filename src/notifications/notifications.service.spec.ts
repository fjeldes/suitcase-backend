const mockSendPushNotificationsAsync = jest.fn().mockResolvedValue(undefined);

jest.mock('expo-server-sdk', () => {
    const Expo = jest.fn().mockImplementation(() => ({
        chunkPushNotifications: jest.fn().mockReturnValue([]),
        sendPushNotificationsAsync: mockSendPushNotificationsAsync,
    }));
    Expo.isExpoPushToken = jest.fn().mockReturnValue(true);
    return { Expo };
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { DeviceToken } from './entities/device-token.entity';

describe('NotificationsService', () => {
    let service: NotificationsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: getRepositoryToken(DeviceToken),
                    useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() },
                },
                {
                    provide: getRepositoryToken(Notification),
                    useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), count: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
