import { synthesizeStudentEmail } from '@eureka-lab/shared-types';

describe('synthesizeStudentEmail', () => {
  it('builds a lowercased non-routable email from code + username', () => {
    expect(synthesizeStudentEmail('AB12CD', 'jsmith')).toBe('jsmith@ab12cd.students.local');
  });

  it('lowercases mixed-case username and code', () => {
    expect(synthesizeStudentEmail('Ab12Cd', 'JSmith')).toBe('jsmith@ab12cd.students.local');
  });

  it('produces correct email structure for already-lowercase inputs', () => {
    expect(synthesizeStudentEmail('ab12cd', 'jsmith')).toBe('jsmith@ab12cd.students.local');
  });
});
