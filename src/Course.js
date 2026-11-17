/**
 * A course offered for registration.
 * Knows its own details and how many seats are left (FR-3).
 */
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

  /** How many seats are still free. */
  getRemainingSeats() {
    return this.capacity - this.registeredCount;
  }

  /** True while the course has not reached its capacity (BR-4). */
  hasAvailableSeat() {
    return this.getRemainingSeats() > 0;
  }

  /** Called by RegistrationSystem after a successful registration. */
  addRegisteredStudent() {
    this.registeredCount += 1;
  }
}

module.exports = Course;
