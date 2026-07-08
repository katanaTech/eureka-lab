import { Test } from '@nestjs/testing';
import { SchoolAnalyticsService } from './school-analytics.service';
import { SchoolsRepository } from '../schools/schools.repository';
import { UsersRepository } from '../users/users.repository';
import { ClassroomsService } from '../classrooms/classrooms.service';

const mkSchool = (over: Record<string, unknown> = {}) => ({
  id: 's1', name: 'A', status: 'active', seatLimit: 30, seatsUsed: 10, adminUids: [],
  subscription: { tier: 'standard', status: 'active', stripeSubscriptionId: 'sub_1' },
  secretKeys: { enrollmentSecret: 'sek_x' }, createdAt: 1, createdBy: 'sa', ...over,
});

const mockSchools = { listAll: jest.fn() };
const mockUsers = { countTeachersBySchool: jest.fn(), countActiveStudents: jest.fn() };
const mockClassrooms = { countBySchool: jest.fn() };

describe('SchoolAnalyticsService', () => {
  let service: SchoolAnalyticsService;
  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchoolAnalyticsService,
        { provide: SchoolsRepository, useValue: mockSchools },
        { provide: UsersRepository, useValue: mockUsers },
        { provide: ClassroomsService, useValue: mockClassrooms },
      ],
    }).compile();
    service = moduleRef.get(SchoolAnalyticsService);
  });

  describe('getSchoolRows', () => {
    it('builds a row with utilization/activeRate and billing status', async () => {
      mockSchools.listAll.mockResolvedValue([mkSchool()]);
      mockUsers.countTeachersBySchool.mockResolvedValue(2);
      mockClassrooms.countBySchool.mockResolvedValue(4);
      mockUsers.countActiveStudents.mockResolvedValue(5);
      const rows = await service.getSchoolRows();
      expect(rows[0]).toEqual(expect.objectContaining({
        schoolId: 's1', seatLimit: 30, seatsUsed: 10, teacherCount: 2, classroomCount: 4,
        activeStudents: 5, billingStatus: 'active',
      }));
      expect(rows[0].utilization).toBeCloseTo(10 / 30);
      expect(rows[0].activeRate).toBeCloseTo(5 / 10);
    });

    it('guards divide-by-zero for a school with no seats', async () => {
      mockSchools.listAll.mockResolvedValue([mkSchool({ seatLimit: 0, seatsUsed: 0, subscription: { tier: 'trial', status: 'none' } })]);
      mockUsers.countTeachersBySchool.mockResolvedValue(0);
      mockClassrooms.countBySchool.mockResolvedValue(0);
      mockUsers.countActiveStudents.mockResolvedValue(0);
      const rows = await service.getSchoolRows();
      expect(rows[0].utilization).toBe(0);
      expect(rows[0].activeRate).toBe(0);
      expect(rows[0].billingStatus).toBe('none');
    });

    it('passes a 30-day YYYY-MM-DD cutoff to countActiveStudents', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-04T12:00:00Z'));
      mockSchools.listAll.mockResolvedValue([mkSchool()]);
      mockUsers.countTeachersBySchool.mockResolvedValue(0);
      mockClassrooms.countBySchool.mockResolvedValue(0);
      mockUsers.countActiveStudents.mockResolvedValue(0);
      await service.getSchoolRows();
      expect(mockUsers.countActiveStudents).toHaveBeenCalledWith('s1', '2026-05-05');
      jest.useRealTimers();
    });
  });

  describe('getOverview', () => {
    it('aggregates totals, status counts, and billing mix', async () => {
      mockSchools.listAll.mockResolvedValue([
        mkSchool({ id: 's1', status: 'active', seatLimit: 30, seatsUsed: 10, subscription: { tier: 't', status: 'active' } }),
        mkSchool({ id: 's2', status: 'suspended', seatLimit: 20, seatsUsed: 20, subscription: { tier: 't', status: 'past_due' } }),
      ]);
      mockUsers.countTeachersBySchool.mockResolvedValue(1);
      mockClassrooms.countBySchool.mockResolvedValue(1);
      mockUsers.countActiveStudents.mockResolvedValueOnce(4).mockResolvedValueOnce(8);
      const o = await service.getOverview();
      expect(o.totalSchools).toBe(2);
      expect(o.schoolsByStatus).toEqual({ active: 1, suspended: 1 });
      expect(o.totalSeatLimit).toBe(50);
      expect(o.totalSeatsUsed).toBe(30);
      expect(o.totalStudents).toBe(30);
      expect(o.totalActiveStudents).toBe(12);
      expect(o.seatUtilization).toBeCloseTo(30 / 50);
      expect(o.billingStatusMix).toEqual(expect.objectContaining({ active: 1, past_due: 1 }));
      // no-double-query invariant: overview derives from a single listAll pass
      expect(mockSchools.listAll).toHaveBeenCalledTimes(1);
    });

    it('returns zeros for an empty platform', async () => {
      mockSchools.listAll.mockResolvedValue([]);
      const o = await service.getOverview();
      expect(o).toEqual(expect.objectContaining({ totalSchools: 0, totalSeatLimit: 0, totalSeatsUsed: 0, seatUtilization: 0, totalActiveStudents: 0 }));
    });
  });
});
