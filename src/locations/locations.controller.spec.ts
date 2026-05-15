import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { StaffAssignment } from 'src/staff/entities/staff-assignment.entity';

describe('LocationsController', () => {
  let controller: LocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: {
            findAll: jest.fn(),
            findMyLocations: jest.fn(),
            findOne: jest.fn(),
            findNearby: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            getDashboardStatsByOwnerByStore: jest.fn(),
            getDashboardStatsByStoreId: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StaffAssignment),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
