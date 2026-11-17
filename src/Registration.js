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
