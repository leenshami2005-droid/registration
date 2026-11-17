const RegistrationSystem = require('../src/RegistrationSystem');

describe('student accounts and course enrollment', () => {
  let system;

  beforeEach(() => {
    system = new RegistrationSystem();
  });

  test('authenticates a student with the account password', () => {
    system.addStudent('STU-1001', 'Avery Student', 'Temp#1234');

    expect(system.authenticateStudent('STU-1001', 'Temp#1234')).toMatchObject({
      success: true,
      data: { id: 'STU-1001', name: 'Avery Student' },
    });
    expect(system.authenticateStudent('STU-1001', 'wrong')).toMatchObject({
      success: false,
      message: 'Student ID or password is incorrect.',
    });
    expect(system.authenticateStudent('unknown', 'Temp#1234').success).toBe(false);
  });

  test('allows an authenticated student to enroll in an available course', () => {
    system.addStudent('STU-1001', 'Avery Student', 'Temp#1234');
    system.addCourse('CS101', 'Introduction to Computing', 3, 1);
    const account = system.authenticateStudent('STU-1001', 'Temp#1234');

    expect(account.success).toBe(true);
    expect(system.register(account.data.getId(), 'CS101').success).toBe(true);
    expect(system.getStudentCourses('STU-1001').data.totalCredits).toBe(3);
    expect(system.register('STU-1001', 'CS101').success).toBe(false);
  });

  test('allows enrollment up to 18 credits and rejects enrollment above the limit', () => {
    system.addStudent('STU-1001', 'Avery Student', 'Temp#1234');
    system.addCourse('CS101', 'Computing', 6, 10);
    system.addCourse('MATH101', 'Mathematics', 6, 10);
    system.addCourse('BIO101', 'Biology', 6, 10);
    system.addCourse('ART101', 'Art', 1, 10);

    expect(system.register('STU-1001', 'CS101').success).toBe(true);
    expect(system.register('STU-1001', 'MATH101').success).toBe(true);
    expect(system.register('STU-1001', 'BIO101').success).toBe(true);
    expect(system.getStudentCourses('STU-1001').data.totalCredits).toBe(18);

    expect(system.register('STU-1001', 'ART101')).toMatchObject({
      success: false,
      message: 'Enrolling in ART101 would exceed the 18-credit maximum.',
    });
    expect(system.getStudentCourses('STU-1001').data.totalCredits).toBe(18);
  });

  test('restores student accounts, courses, and enrollments from saved data', () => {
    system.addStudent('STU-1001', 'Avery Student', 'Temp#1234');
    system.addCourse('CS101', 'Computing', 3, 2);
    system.register('STU-1001', 'CS101');

    const restored = new RegistrationSystem();
    restored.importData(system.exportData());

    expect(restored.authenticateStudent('STU-1001', 'Temp#1234').success).toBe(true);
    expect(restored.getStudentCourses('STU-1001').data.totalCredits).toBe(3);
    expect(restored.findCourse('CS101').getRemainingSeats()).toBe(1);
  });
});
