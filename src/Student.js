class Student {
  constructor(id, name, password) {
    this.id = id;
    this.name = name;
    this.password = password;
  }

  getId() {
    return this.id;
  }

  getName() {
    return this.name;
  }

  verifyPassword(password) {
    return this.password === password;
  }
}

module.exports = Student;
