const readline = require('readline');
const RegistrationSystem = require('./RegistrationSystem');

const system = new RegistrationSystem();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) => new Promise((resolve) => rl.question(question, resolve));

function showMenu() {
  console.log('\n===== Student Course Registration System =====');
  console.log('1. Add a student');
  console.log('2. Add a course');
  console.log('3. Display available courses');
  console.log('4. Register a student in a course');
  console.log('5. Display a student\'s registered courses');
  console.log('0. Exit');
}

function report(result) {
  console.log(result.success ? `\nOK: ${result.message}` : `\nError: ${result.message}`);
}

async function addStudent() {
  const id = await ask('Student ID: ');
  const name = await ask('Full name: ');
  report(system.addStudent(id.trim(), name.trim()));
}

async function addCourse() {
  const code = await ask('Course code: ');
  const title = await ask('Course title: ');
  const hours = await ask('Credit hours: ');
  const capacity = await ask('Capacity: ');
  report(system.addCourse(
    code.trim(),
    title.trim(),
    Number(hours),
    Number(capacity)
  ));
}

function listCourses() {
  const courses = system.listAvailableCourses();

  if (courses.length === 0) {
    console.log('\nNo courses have been added yet.');
    return;
  }

  console.log('\nCode    Title                     Hours  Capacity  Seats left');
  console.log('-'.repeat(64));
  courses.forEach((c) => {
    const seats = c.hasAvailableSeat() ? String(c.getRemainingSeats()) : 'FULL';
    console.log(
      c.getCode().padEnd(8) +
      c.getTitle().padEnd(26) +
      String(c.getCreditHours()).padEnd(7) +
      String(c.getCapacity()).padEnd(10) +
      seats
    );
  });
}

async function register() {
  const studentId = await ask('Student ID: ');
  const courseCode = await ask('Course code: ');
  report(system.register(studentId.trim(), courseCode.trim()));
}

async function showStudentCourses() {
  const studentId = await ask('Student ID: ');
  const result = system.getStudentCourses(studentId.trim());

  if (!result.success) {
    report(result);
    return;
  }

  const { student, courses, totalCredits } = result.data;

  if (courses.length === 0) {
    console.log(`\n${student.getName()} is not registered in any course.`);
    return;
  }

  console.log(`\nCourses for ${student.getName()} (${student.getId()}):`);
  courses.forEach((c) => {
    console.log(`  ${c.getCode()}  ${c.getTitle()}  (${c.getCreditHours()} hours)`);
  });
  console.log(`  Total credit hours: ${totalCredits}`);
}

async function run() {
  let running = true;

  while (running) {
    showMenu();
    const choice = (await ask('\nChoose an option: ')).trim();

    switch (choice) {
      case '1': await addStudent(); break;
      case '2': await addCourse(); break;
      case '3': listCourses(); break;
      case '4': await register(); break;
      case '5': await showStudentCourses(); break;
      case '0':
        running = false;
        break;
      default:
        console.log('\nInvalid option. Please choose a number from the menu.');
    }
  }

  console.log('\nGoodbye.');
  rl.close();
}

run();
