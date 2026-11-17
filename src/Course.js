class Course {
  constructor(code, title, creditHours, capacity) {
    this.code = code;
    this.title = title;
    this.creditHours = creditHours;
    this.capacity = capacity;
    this.registeredCount = 0;
  }

  getCode() {
    return this.code;
  }

  getTitle() {
    return this.title;
  }

  getCreditHours() {
    return this.creditHours;
  }

  getCapacity() {
    return this.capacity;
  }

  getRemainingSeats() {
    return this.capacity - this.registeredCount;
  }

  hasAvailableSeat() {
    return this.getRemainingSeats() > 0;
  }

  addRegisteredStudent() {
    this.registeredCount += 1;
  }
}

module.exports = Course;
