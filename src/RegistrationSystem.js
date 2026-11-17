const Student = require('./Student');
const Course = require('./Course');
const Registration = require('./Registration');

class RegistrationSystem {
  constructor() {
    this.students = [];
    this.courses = [];
    this.registrations = [];
    this.maxCreditHours = 18;
  }

  findStudent(studentId) {
    return this.students.find((s) => s.getId() === studentId);
  }

  findCourse(courseCode) {
    return this.courses.find((c) => c.getCode() === courseCode);
  }

  isRegistered(studentId, courseCode) {
    return this.registrations.some(
      (r) => r.getStudent().getId() === studentId && r.getCourse().getCode() === courseCode
    );
  }

  addStudent(id, name, password) {
    if (!id || String(id).trim() === '') {
      return { success: false, message: 'Student ID cannot be empty.' };
    }
    if (!name || String(name).trim() === '') {
      return { success: false, message: 'Student name cannot be empty.' };
    }
    if (this.findStudent(id)) {
      return { success: false, message: `A student with ID ${id} already exists.` };
    }

    const student = new Student(id, name, password);
    this.students.push(student);
    return { success: true, message: `Student ${name} added.`, data: student };
  }

  authenticateStudent(studentId, password) {
    const student = this.findStudent(studentId);
    if (!student || !student.verifyPassword(password)) {
      return { success: false, message: 'Student ID or password is incorrect.' };
    }

    return { success: true, message: `Welcome, ${student.getName()}.`, data: student };
  }

  addCourse(code, title, creditHours, capacity) {
    if (!code || String(code).trim() === '') {
      return { success: false, message: 'Course code cannot be empty.' };
    }
    if (!title || String(title).trim() === '') {
      return { success: false, message: 'Course title cannot be empty.' };
    }
    if (!Number.isInteger(creditHours) || creditHours <= 0) {
      return { success: false, message: 'Credit hours must be a positive whole number.' };
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      return { success: false, message: 'Capacity must be a positive whole number.' };
    }
    if (this.findCourse(code)) {
      return { success: false, message: `A course with code ${code} already exists.` };
    }

    const course = new Course(code, title, creditHours, capacity);
    this.courses.push(course);
    return { success: true, message: `Course ${code} added.`, data: course };
  }

  listAvailableCourses() {
    return this.courses;
  }

  register(studentId, courseCode) {
    const student = this.findStudent(studentId);
    if (!student) {
      return { success: false, message: `No student found with ID ${studentId}.` };
    }

    const course = this.findCourse(courseCode);
    if (!course) {
      return { success: false, message: `No course found with code ${courseCode}.` };
    }

    if (this.isRegistered(studentId, courseCode)) {
      return { success: false, message: `${student.getName()} is already registered in ${courseCode}.` };
    }

    const enrolledCredits = this.registrations
      .filter((registration) => registration.getStudent().getId() === studentId)
      .reduce((sum, registration) => sum + registration.getCourse().getCreditHours(), 0);
    if (enrolledCredits + course.getCreditHours() > this.maxCreditHours) {
      return {
        success: false,
        message: `Enrolling in ${courseCode} would exceed the ${this.maxCreditHours}-credit maximum.`,
      };
    }

    if (!course.hasAvailableSeat()) {
      return { success: false, message: `Course ${courseCode} is full.` };
    }

    const registration = new Registration(student, course);
    this.registrations.push(registration);
    course.addRegisteredStudent();

    return {
      success: true,
      message: `${student.getName()} registered in ${courseCode}.`,
      data: registration,
    };
  }

  getStudentCourses(studentId) {
    const student = this.findStudent(studentId);
    if (!student) {
      return { success: false, message: `No student found with ID ${studentId}.` };
    }

    const courses = this.registrations
      .filter((r) => r.getStudent().getId() === studentId)
      .map((r) => r.getCourse());

    const totalCredits = courses.reduce((sum, c) => sum + c.getCreditHours(), 0);

    return {
      success: true,
      message: `${student.getName()} is registered in ${courses.length} course(s).`,
      data: { student, courses, totalCredits },
    };
  }

  exportData() {
    return {
      students: this.students.map((student) => ({
        id: student.getId(),
        name: student.getName(),
        password: student.password,
      })),
      courses: this.courses.map((course) => ({
        code: course.getCode(),
        title: course.getTitle(),
        creditHours: course.getCreditHours(),
        capacity: course.getCapacity(),
      })),
      registrations: this.registrations.map((registration) => ({
        studentId: registration.getStudent().getId(),
        courseCode: registration.getCourse().getCode(),
      })),
    };
  }

  importData(data) {
    if (
      !data ||
      !Array.isArray(data.students) ||
      !Array.isArray(data.courses) ||
      !Array.isArray(data.registrations)
    ) {
      throw new Error('Saved registration data has an invalid format.');
    }

    const restored = new RegistrationSystem();
    data.students.forEach(({ id, name, password }) => {
      if (typeof id !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
        throw new Error('Saved student account data is invalid.');
      }
      const result = restored.addStudent(id, name, password);
      if (!result.success) throw new Error(result.message);
    });

    data.courses.forEach(({ code, title, creditHours, capacity }) => {
      if (
        typeof code !== 'string' ||
        typeof title !== 'string' ||
        !Number.isInteger(creditHours) ||
        !Number.isInteger(capacity)
      ) {
        throw new Error('Saved course data is invalid.');
      }
      const result = restored.addCourse(code, title, creditHours, capacity);
      if (!result.success) throw new Error(result.message);
    });

    data.registrations.forEach(({ studentId, courseCode }) => {
      if (typeof studentId !== 'string' || typeof courseCode !== 'string') {
        throw new Error('Saved enrollment data is invalid.');
      }
      const result = restored.register(studentId, courseCode);
      if (!result.success) throw new Error(result.message);
    });

    this.students = restored.students;
    this.courses = restored.courses;
    this.registrations = restored.registrations;
  }
}

module.exports = RegistrationSystem;
