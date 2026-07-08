import { Injectable } from '@nestjs/common';
import type {
  School,
  SchoolUsageRow,
  PlatformUsageOverview,
} from '@eureka-lab/shared-types';
import { SchoolsRepository } from '../schools/schools.repository';
import { UsersRepository } from '../users/users.repository';
import { ClassroomsService } from '../classrooms/classrooms.service';

/** How recently a student must have been active to count as "active". */
const ACTIVE_WINDOW_DAYS = 30;

/**
 * On-demand super-admin usage analytics. Aggregates current-state metrics
 * from existing data (no time-series, no stored counters). Read-only.
 */
@Injectable()
export class SchoolAnalyticsService {
  constructor(
    private readonly schools: SchoolsRepository,
    private readonly users: UsersRepository,
    private readonly classrooms: ClassroomsService,
  ) {}

  /**
   * Per-school usage rows for the enriched super-admin table.
   * @returns One row per school; bounded to ≤500 by SchoolsRepository.listAll.
   */
  async getSchoolRows(): Promise<SchoolUsageRow[]> {
    const schools = await this.schools.listAll();
    const since = this.activeCutoff();
    return Promise.all(schools.map((s) => this.toRow(s, since)));
  }

  /**
   * Platform-wide usage aggregate for the overview tiles.
   * @returns The aggregate.
   */
  async getOverview(): Promise<PlatformUsageOverview> {
    const rows = await this.getSchoolRows();
    const overview: PlatformUsageOverview = {
      totalSchools: rows.length,
      schoolsByStatus: { active: 0, suspended: 0 },
      totalSeatLimit: 0,
      totalSeatsUsed: 0,
      seatUtilization: 0,
      totalStudents: 0,
      totalActiveStudents: 0,
      billingStatusMix: {},
    };
    for (const r of rows) {
      if (r.status === 'active') overview.schoolsByStatus.active += 1;
      else overview.schoolsByStatus.suspended += 1;
      overview.totalSeatLimit += r.seatLimit;
      overview.totalSeatsUsed += r.seatsUsed;
      /* By design totalStudents == totalSeatsUsed: a consumed seat is a student
         (4a meters only child enrollments). Kept as a distinct "people" view. */
      overview.totalStudents += r.seatsUsed;
      overview.totalActiveStudents += r.activeStudents;
      overview.billingStatusMix[r.billingStatus] =
        (overview.billingStatusMix[r.billingStatus] ?? 0) + 1;
    }
    overview.seatUtilization = this.ratio(overview.totalSeatsUsed, overview.totalSeatLimit);
    return overview;
  }

  /**
   * Build one usage row for a school (3 count queries, fanned out by caller).
   * @param school - The school doc.
   * @param since - Active-student cutoff (YYYY-MM-DD).
   * @returns The usage row.
   */
  private async toRow(school: School, since: string): Promise<SchoolUsageRow> {
    const [teacherCount, classroomCount, activeStudents] = await Promise.all([
      this.users.countTeachersBySchool(school.id),
      this.classrooms.countBySchool(school.id),
      this.users.countActiveStudents(school.id, since),
    ]);
    return {
      schoolId: school.id,
      name: school.name,
      status: school.status,
      seatLimit: school.seatLimit,
      seatsUsed: school.seatsUsed,
      utilization: this.ratio(school.seatsUsed, school.seatLimit),
      teacherCount,
      classroomCount,
      activeStudents,
      activeRate: this.ratio(activeStudents, school.seatsUsed),
      billingStatus: school.subscription.status,
    };
  }

  /**
   * Safe ratio, 0 when the denominator is 0.
   * @param num - Numerator.
   * @param den - Denominator.
   * @returns num/den, or 0.
   */
  private ratio(num: number, den: number): number {
    return den > 0 ? num / den : 0;
  }

  /**
   * Active-student cutoff as a YYYY-MM-DD string (today - ACTIVE_WINDOW_DAYS).
   * @returns The cutoff date string.
   */
  private activeCutoff(): string {
    const ms = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }
}
