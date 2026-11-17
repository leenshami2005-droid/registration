/**
 * Links one student to one course, with the date of registration.
 * This class is what makes the many-to-many relationship between
 * students and courses explicit, and gives it somewhere to store the date.
 */
class Registration {
  constructor(student, course, date = new Date()) {
    this.student = student;
    this.course = course;
    this.date = date;
  }

  getStudent() {
    return this.student;
  }

  getCourse() {
    return this.course;
  }

  getDate() {
    return this.date;
  }
}

module.exports = Registration;
