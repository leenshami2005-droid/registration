# Student Course Registration System

React Native app for managing student accounts, courses, and course registration.

## Group members
- Rahaf AlHadidi
- Jood Kloub
- Leen Shami

## Running the application
```bash
npm install
npm start
```

For the browser version:
```bash
npm run web
```

Choose **Admin dashboard** to create student accounts and add courses. The app
generates a student ID (`STU-1001`, etc.) and a temporary password when an
account is created; share the displayed credentials with the student. Students
sign in with those credentials and can enroll in courses with open seats, up to
18 total credit hours.

## Data storage and prototype limitations
Accounts, courses, and enrollments are saved on the current device and restored
when the app is reopened or refreshed. Browser data is local to that browser;
it is not synchronized to other devices. Clearing the app/browser storage will
remove the saved records. The admin dashboard is not protected by an admin
sign-in, and student passwords are stored locally. Use server-side storage and
authentication before using this app with real student accounts.

## Running the tests
```bash
npm test
```

## Checking code quality
```bash
npm run lint
```

## Project structure
| File | Responsibility |
|---|---|
| `App.tsx` | Admin dashboard and student sign-in/enrollment screens |
| `src/Student.js` | Holds a student's identity and verifies credentials |
| `src/Course.js` | Holds a course's details and reports remaining seats |
| `src/Registration.js` | Links one student to one course, with the date |
| `src/RegistrationSystem.js` | Holds the collections and enforces every business rule |
| `src/main.js` | Legacy console entry point |
| `docs/StudentCourseRegistration.puml` | PlantUML source of the class diagram |

The business rules live in `RegistrationSystem`, which never reads input and never
prints. That separation is what allows the rules to be tested automatically.
# registration
