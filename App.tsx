import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Student = {
  getId: () => string;
  getName: () => string;
};

type Course = {
  getCode: () => string;
  getTitle: () => string;
  getCreditHours: () => number;
  getRemainingSeats: () => number;
};

type Result<T> = { success: boolean; message: string; data?: T };

type RegistrationSystemApi = {
  students: Student[];
  courses: Course[];
  maxCreditHours: number;
  addStudent: (id: string, name: string, password: string) => Result<Student>;
  addCourse: (code: string, title: string, hours: number, capacity: number) => Result<Course>;
  authenticateStudent: (id: string, password: string) => Result<Student>;
  listAvailableCourses: () => Course[];
  register: (id: string, code: string) => Result<unknown>;
  getStudentCourses: (id: string) => Result<{ student: Student; courses: Course[]; totalCredits: number }>;
  exportData: () => unknown;
  importData: (data: unknown) => void;
};

const RegistrationSystem = require('./src/RegistrationSystem') as new () => RegistrationSystemApi;
const STORAGE_KEY = 'student-course-registration-data-v1';
type Portal = 'admin' | 'student';
type AdminTab = 'students' | 'courses';

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  return Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

function nextStudentId(students: Student[]) {
  const highestId = students.reduce((highest, student) => {
    const match = student.getId().match(/^STU-(\d+)$/);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 1000);
  return `STU-${highestId + 1}`;
}

export default function App() {
  const [system] = useState(() => new RegistrationSystem());
  const [portal, setPortal] = useState<Portal>('student');
  const [adminTab, setAdminTab] = useState<AdminTab>('students');
  const [revision, setRevision] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState<{ id: string; password: string } | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [creditHours, setCreditHours] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const refresh = () => setRevision((value) => value + 1);
  void revision;

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData !== null) system.importData(JSON.parse(savedData));
        if (active) {
          setStorageError(null);
          setStorageReady(true);
          setRevision((value) => value + 1);
        }
      } catch (error) {
        if (active) {
          setStorageError(error instanceof Error ? error.message : 'Could not load saved data.');
        }
      }
    };
    void restore();
    return () => {
      active = false;
    };
  }, [system]);

  useEffect(() => {
    if (!storageReady) return;
    let active = true;
    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(system.exportData()));
        if (active) setStorageError(null);
      } catch (error) {
        if (active) {
          setStorageError(error instanceof Error ? error.message : 'Could not save your data.');
        }
      }
    };
    void persist();
    return () => {
      active = false;
    };
  }, [revision, storageReady, system]);

  if (!storageReady) {
    return (
      <View style={styles.app}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.kicker}>UNIVERSITY PORTAL</Text>
          <Text style={styles.title}>Course Registration</Text>
        </View>
        <View style={styles.content}>
          <Text style={storageError ? styles.storageError : styles.helper}>
            {storageError
              ? `Could not load saved data: ${storageError}`
              : 'Loading saved accounts, courses, and enrollments...'}
          </Text>
        </View>
      </View>
    );
  }

  const createStudent = () => {
    const name = studentName.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter the student’s full name.');
      return;
    }
    const id = nextStudentId(system.students);
    const password = generatePassword();
    const result = system.addStudent(id, name, password);
    if (!result.success) {
      Alert.alert('Could not create account', result.message);
      return;
    }
    setCreatedCredentials({ id, password });
    setStudentName('');
    refresh();
  };

  const createCourse = () => {
    const result = system.addCourse(
      courseCode.trim(),
      courseTitle.trim(),
      Number(creditHours),
      Number(capacity)
    );
    if (!result.success) {
      Alert.alert('Could not add course', result.message);
      return;
    }
    setCourseCode('');
    setCourseTitle('');
    setCreditHours('');
    setCapacity('');
    refresh();
  };

  const signIn = () => {
    const result = system.authenticateStudent(loginId.trim(), loginPassword);
    if (!result.success || !result.data) {
      Alert.alert('Sign-in failed', result.message);
      return;
    }
    setCurrentStudent(result.data);
    setLoginPassword('');
    refresh();
  };

  const enroll = (course: Course) => {
    if (!currentStudent) return;
    const result = system.register(currentStudent.getId(), course.getCode());
    if (!result.success) {
      Alert.alert('Could not enroll', result.message);
      return;
    }
    refresh();
  };

  const signOut = () => {
    setCurrentStudent(null);
    setLoginId('');
    setLoginPassword('');
  };

  const studentCourses = currentStudent
    ? system.getStudentCourses(currentStudent.getId())
    : null;
  const enrolledCodes = new Set(studentCourses?.data?.courses.map((course) => course.getCode()) ?? []);
  const totalCredits = studentCourses?.data?.totalCredits ?? 0;
  const remainingCredits = system.maxCreditHours - totalCredits;

  return (
    <KeyboardAvoidingView
      style={styles.app}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.kicker}>UNIVERSITY PORTAL</Text>
        <Text style={styles.title}>Course Registration</Text>
        <Text style={styles.subtitle}>Manage student accounts and course enrollment</Text>
      </View>

      <View style={styles.portalSwitch}>
        <TouchableOpacity
          style={[styles.portalButton, portal === 'student' && styles.portalButtonActive]}
          onPress={() => setPortal('student')}
        >
          <Text style={[styles.portalButtonText, portal === 'student' && styles.portalButtonTextActive]}>
            Student
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.portalButton, portal === 'admin' && styles.portalButtonActive]}
          onPress={() => setPortal('admin')}
        >
          <Text style={[styles.portalButtonText, portal === 'admin' && styles.portalButtonTextActive]}>
            Admin dashboard
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {storageError && (
          <Text style={styles.storageError}>
            Could not save data on this device: {storageError}
          </Text>
        )}
        {portal === 'admin' && (
          <View>
            <Text style={styles.sectionTitle}>Admin dashboard</Text>
            <Text style={styles.helper}>Create student accounts and manage the courses available for enrollment.</Text>
            <View style={styles.tabs}>
              {(['students', 'courses'] as AdminTab[]).map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.tab, adminTab === item && styles.activeTab]}
                  onPress={() => setAdminTab(item)}
                >
                  <Text style={[styles.tabText, adminTab === item && styles.activeTabText]}>
                    {item === 'students' ? 'Student accounts' : 'Courses'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {adminTab === 'students' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Create student account</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Student full name"
                    value={studentName}
                    onChangeText={setStudentName}
                    autoCapitalize="words"
                    autoComplete="off"
                    accessibilityLabel="Student full name"
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={createStudent}>
                    <Text style={styles.primaryButtonText}>Create account and credentials</Text>
                  </TouchableOpacity>
                </View>

                {createdCredentials && (
                  <View style={styles.credentialCard}>
                    <Text style={styles.credentialTitle}>Give these sign-in details to the student</Text>
                    <Text style={styles.credentialLine}>Student ID: <Text style={styles.credentialValue}>{createdCredentials.id}</Text></Text>
                    <Text style={styles.credentialLine}>Password: <Text style={styles.credentialValue}>{createdCredentials.password}</Text></Text>
                    <Text style={styles.helper}>This password is shown only here. Save or share it before creating another account.</Text>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Student accounts ({system.students.length})</Text>
                {system.students.length === 0 ? (
                  <Text style={styles.empty}>No student accounts yet.</Text>
                ) : system.students.map((student) => (
                  <View key={student.getId()} style={styles.listCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{student.getName().charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.courseInfo}>
                      <Text style={styles.itemTitle}>{student.getName()}</Text>
                      <Text style={styles.itemMeta}>Student ID: {student.getId()}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {adminTab === 'courses' && (
              <View>
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Add a course</Text>
                  <TextInput style={styles.input} placeholder="Course code" value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" />
                  <TextInput style={styles.input} placeholder="Course title" value={courseTitle} onChangeText={setCourseTitle} />
                  <View style={styles.inputRow}>
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="Credit hours" keyboardType="number-pad" value={creditHours} onChangeText={setCreditHours} />
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="Capacity" keyboardType="number-pad" value={capacity} onChangeText={setCapacity} />
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={createCourse}>
                    <Text style={styles.primaryButtonText}>Add course</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionTitle}>Available courses ({system.courses.length})</Text>
                {system.courses.length === 0 ? (
                  <Text style={styles.empty}>No courses have been added.</Text>
                ) : system.listAvailableCourses().map((course) => (
                  <CourseCard key={course.getCode()} course={course} />
                ))}
              </View>
            )}
          </View>
        )}

        {portal === 'student' && !currentStudent && (
          <View>
            <Text style={styles.sectionTitle}>Student sign in</Text>
            <Text style={styles.helper}>Use the student ID and password provided by your administrator.</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                placeholder="Student ID"
                value={loginId}
                onChangeText={setLoginId}
                autoCapitalize="characters"
                autoCorrect={false}
                autoComplete="off"
                accessibilityLabel="Student ID"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="off"
                accessibilityLabel="Password"
              />
              <TouchableOpacity style={styles.primaryButton} onPress={signIn}>
                <Text style={styles.primaryButtonText}>Sign in</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>New student?</Text>
              <Text style={styles.helper}>Ask your administrator to create an account and provide your sign-in details.</Text>
            </View>
          </View>
        )}

        {portal === 'student' && currentStudent && (
          <View>
            <View style={styles.welcomeRow}>
              <View>
                <Text style={styles.sectionTitle}>Available courses</Text>
                <Text style={styles.helper}>Signed in as {currentStudent.getName()} · {currentStudent.getId()}</Text>
              </View>
              <TouchableOpacity onPress={signOut}>
                <Text style={styles.signOut}>Sign out</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.creditLimit}>
              Credit limit: {totalCredits}/{system.maxCreditHours} used · {remainingCredits} remaining
            </Text>
            {system.listAvailableCourses().length === 0 ? (
              <Text style={styles.empty}>There are no courses available yet.</Text>
            ) : system.listAvailableCourses().map((course) => {
              const isEnrolled = enrolledCodes.has(course.getCode());
              const isFull = course.getRemainingSeats() === 0;
              const overLimit = course.getCreditHours() > remainingCredits;
              const disabled = isEnrolled || isFull || overLimit;
              return (
                <View key={course.getCode()} style={styles.courseCard}>
                  <View style={styles.courseBadge}>
                    <Text style={styles.courseBadgeText}>{course.getCode()}</Text>
                  </View>
                  <View style={styles.courseInfo}>
                    <Text style={styles.itemTitle}>{course.getTitle()}</Text>
                    <Text style={styles.itemMeta}>{course.getCreditHours()} credit hours · {course.getRemainingSeats()} seats left</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.enrollButton, disabled && styles.disabledButton]}
                    onPress={() => enroll(course)}
                    disabled={disabled}
                  >
                    <Text style={[styles.enrollText, disabled && styles.disabledButtonText]}>
                      {isEnrolled ? 'Added' : isFull ? 'Full' : overLimit ? 'Over limit' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            <Text style={[styles.sectionTitle, styles.myCoursesTitle]}>My courses</Text>
            {studentCourses?.data?.courses.length === 0 ? (
              <Text style={styles.empty}>You have not enrolled in any courses.</Text>
            ) : studentCourses?.data?.courses.map((course) => (
              <View key={course.getCode()} style={styles.myCourseRow}>
                <Text style={styles.itemTitle}>{course.getCode()} · {course.getTitle()}</Text>
                <Text style={styles.itemMeta}>{course.getCreditHours()} credit hours</Text>
              </View>
            ))}
            {studentCourses?.data && (
              <Text style={styles.totalCredits}>Total credits: {studentCourses.data.totalCredits}/{system.maxCreditHours}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <View style={styles.courseCard}>
      <View style={styles.courseBadge}>
        <Text style={styles.courseBadgeText}>{course.getCode()}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.itemTitle}>{course.getTitle()}</Text>
        <Text style={styles.itemMeta}>{course.getCreditHours()} credit hours · {course.getRemainingSeats()} seats left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { backgroundColor: '#102A43', paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  kicker: { color: '#63B3ED', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#BCCCDC', marginTop: 5, fontSize: 13 },
  portalSwitch: { flexDirection: 'row', backgroundColor: '#fff', padding: 6, borderBottomWidth: 1, borderBottomColor: '#E6EDF3' },
  portalButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 9 },
  portalButtonActive: { backgroundColor: '#DBEAFE' },
  portalButtonText: { color: '#64748B', fontWeight: '700' },
  portalButtonTextActive: { color: '#1D4ED8' },
  content: { padding: 16, paddingBottom: 40 },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E6EDF3', marginBottom: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#2563EB' },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  activeTabText: { color: '#2563EB' },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: '#183B56', marginBottom: 8, marginTop: 4 },
  helper: { color: '#627D98', lineHeight: 20, marginBottom: 14 },
  storageError: { color: '#B91C1C', backgroundColor: '#FEF2F2', borderRadius: 9, padding: 10, marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 18, borderWidth: 1, borderColor: '#E6EDF3' },
  cardTitle: { color: '#183B56', fontSize: 15, fontWeight: '800', marginBottom: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D8E2EC', borderRadius: 9, paddingHorizontal: 12, height: 48, marginBottom: 10, color: '#102A43' },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  primaryButton: { backgroundColor: '#2563EB', minHeight: 48, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '800' },
  empty: { color: '#829AB1', textAlign: 'center', paddingVertical: 20 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E6EDF3' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#2563EB', fontSize: 17, fontWeight: '800' },
  itemTitle: { color: '#243B53', fontWeight: '800', fontSize: 14 },
  itemMeta: { color: '#829AB1', marginTop: 3, fontSize: 12 },
  courseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E6EDF3' },
  courseBadge: { width: 54, height: 50, borderRadius: 10, backgroundColor: '#102A43', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  courseBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  courseInfo: { flex: 1 },
  credentialCard: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12, padding: 14, marginBottom: 18 },
  credentialTitle: { color: '#065F46', fontWeight: '800', marginBottom: 10 },
  credentialLine: { color: '#166534', marginVertical: 3 },
  credentialValue: { fontWeight: '900', letterSpacing: 0.4 },
  infoCard: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14 },
  infoTitle: { color: '#1E40AF', fontWeight: '800', marginBottom: 4 },
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  signOut: { color: '#2563EB', fontWeight: '800', padding: 8 },
  creditLimit: { color: '#1E40AF', backgroundColor: '#DBEAFE', borderRadius: 9, padding: 10, marginBottom: 10, fontWeight: '700' },
  enrollButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#2563EB', borderRadius: 8, marginLeft: 8 },
  enrollText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  disabledButton: { backgroundColor: '#E2E8F0' },
  disabledButtonText: { color: '#64748B' },
  myCoursesTitle: { marginTop: 22 },
  myCourseRow: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E6EDF3' },
  totalCredits: { color: '#183B56', textAlign: 'right', fontWeight: '800', marginTop: 4 },
});
