const students = [];

function studentRollNo(student) {
  return String(student.roll || student.enrollment || '').trim().toUpperCase();
}

const STUDENT_IMPORT_HEADERS = ['Student Name', 'Roll No', 'Program', 'Semester', 'College Email', 'Mobile', 'Attendance %', 'CGPA', 'Status'];
const STUDENT_STORAGE_KEY = 'gcw-karnal-student-directory-v1';
const rollNoCollator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
try {
  const savedStudents = JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY) || '[]');
  const knownRollNumbers = new Set(students.map(student => studentRollNo(student).toLowerCase()));
  if (Array.isArray(savedStudents)) {
    savedStudents.forEach(student => {
      const rollNo = student && student.local && student.enrollment ? String(student.enrollment).trim().toUpperCase() : studentRollNo(student);
      if (rollNo && !knownRollNumbers.has(rollNo.toLowerCase())) students.unshift({ ...student, enrollment: student.enrollment || rollNo, roll: rollNo, local: true });
    });
  }
} catch {
  localStorage.removeItem(STUDENT_STORAGE_KEY);
}

const departments = [
  { name: 'Computer Applications', students: 298, attendance: 86, score: 81.2 },
  { name: 'Commerce', students: 342, attendance: 83, score: 79.6 },
  { name: 'Business Administration', students: 216, attendance: 80, score: 78.8 },
  { name: 'Arts', students: 392, attendance: 79, score: 74.3 }
];

const workRows = [
  ['Computer Applications', '12 / 12', '100%', '96%', '91%', 'Complete', 'green'],
  ['Commerce', '14 / 16', '88%', '83%', '79%', 'In progress', 'amber'],
  ['Business Administration', '10 / 11', '91%', '90%', '82%', 'In progress', 'amber'],
  ['Arts', '8 / 11', '73%', '69%', '65%', 'Pending', 'red']
];

const assessments = [
  { id: 'ASM-204', title: 'Class Test 2', offering: 'BCA · Semester 4 · A', scheme: 'Internal / 30', heldOn: '11 Sep 2026', entries: '42 / 42', state: 'submitted' },
  { id: 'ASM-203', title: 'Database assignment', offering: 'BCA · Semester 4 · A', scheme: 'Assignment / 10', heldOn: '07 Sep 2026', entries: '40 / 42', state: 'draft' },
  { id: 'ASM-201', title: 'Web Technologies quiz', offering: 'BCA · Semester 4 · A', scheme: 'Quiz / 10', heldOn: '02 Sep 2026', entries: '42 / 42', state: 'verified' },
  { id: 'ASM-199', title: 'Practical record review', offering: 'B.Com · Semester 2 · B', scheme: 'Practical / 20', heldOn: '29 Aug 2026', entries: '38 / 38', state: 'locked' }
];

const documents = [
  { id: 'DOC-118', type: 'PDF', title: 'Semester 3 DMC', student: 'Isha Sharma', uploadedBy: 'Academic Office', age: '18 min ago', state: 'pending' },
  { id: 'DOC-117', type: 'PDF', title: 'Innovation challenge certificate', student: 'Raj Malhotra', uploadedBy: 'Prof. R. Mehta', age: '1 hr ago', state: 'pending' },
  { id: 'DOC-116', type: 'IMG', title: 'Admission form', student: 'Pooja Singh', uploadedBy: 'Academic Office', age: 'Yesterday', state: 'verified' }
];

const messages = [
  { id: 'MSG-043', subject: 'Internal assessment schedule published', audience: 'BCA Semester 4 · 42 students', channels: ['Email', 'In-app'], requestedBy: 'Academic Office', state: 'queued' },
  { id: 'MSG-042', subject: 'Attendance improvement advisory', audience: 'Low-attendance students · 43 students', channels: ['SMS', 'Email'], requestedBy: 'Dr. Vivek Range', state: 'sent' },
  { id: 'MSG-041', subject: 'University circular: examination form window', audience: 'All active students · 1,248 students', channels: ['SMS', 'Email', 'In-app'], requestedBy: 'Academic Office', state: 'sent' }
];

const reports = [
  ['student-directory', 'Student directory', 'Scoped master list with current roll numbers', '♙'],
  ['student-file', 'Student academic file', 'One connected student record', '▤'],
  ['admission-register', 'Admission register', 'Admissions, eligibility and missing evidence', '▦'],
  ['attendance-summary', 'Attendance summary', 'Department and semester-level coverage', '◷'],
  ['low-attendance', 'Low-attendance list', 'Students below the approved threshold', '!'],
  ['class-completion', 'Class completion', 'Expected vs marked attendance sessions', '◫'],
  ['assessment-register', 'Assessment register', 'Tests, assignments and submission status', '▤'],
  ['internal-marks', 'Internal marks', 'Component-level marks and verification state', '▤'],
  ['test-analytics', 'Test analytics', 'Score distribution and intervention view', '↗'],
  ['semester-results', 'Semester results', 'SGPA, CGPA and published outcome', '★'],
  ['backlog-summary', 'Backlog summary', 'Students and repeat-subject action list', '↺'],
  ['document-verification', 'Document verification', 'DMC and certificate review queue', '▣'],
  ['faculty-work', 'Faculty work', 'Workload, completion and pending tasks', '♧'],
  ['audit-history', 'Audit history', 'Who performed each controlled action', '◷']
];

const roleScopes = [
  ['Super Admin', 'College scope', 'Master data, named users, permissions, controlled imports and recovery.'],
  ['Principal', 'College-wide', 'Academic oversight, indicators, official records and correction requests.'],
  ['HOD', 'Granted department', 'Departmental review, scoped verification and pending-work follow-up.'],
  ['Teacher', 'Assigned offerings', 'Attendance, assessment, remarks and permitted student evidence only.']
];

let selectedStudent = null;
let adminProfile = { name: 'Dr. Vivek Range', position: 'Principal', office: 'Academic Office', email: '', photo: '' };
let filters = { query: '', program: 'all', semester: 'all' };
let pendingDocumentsOnly = true;
let showQueuedMessagesOnly = false;
let toastTimeout;
let lastActiveElement;
const auditEvents = [
  { time: '11 Sep 2026, 10:42', actor: 'Dr. Vivek Range', action: 'Opened dashboard', record: 'College overview', outcome: 'Allowed' },
  { time: '11 Sep 2026, 10:21', actor: 'Academic Office', action: 'Uploaded document', record: 'DOC-118 · DMC', outcome: 'Pending review' },
  { time: '11 Sep 2026, 09:54', actor: 'Prof. R. Mehta', action: 'Submitted assessment', record: 'ASM-204 · Class Test 2', outcome: 'Submitted' }
];

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function initialsFor(name) {
  return String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'ST';
}

let pendingAdminPhoto;

function renderAdminAvatar(node, photo = adminProfile.photo) {
  if (!node) return;
  node.replaceChildren();
  node.classList.toggle('has-admin-photo', Boolean(photo));
  if (photo) {
    const image = document.createElement('img');
    image.src = photo;
    image.alt = `${adminProfile.name} profile photo`;
    node.append(image);
  } else {
    node.textContent = initialsFor(adminProfile.name);
  }
}

function renderAdminProfile() {
  const office = adminProfile.office || 'Academic Office';
  const photo = pendingAdminPhoto === undefined ? adminProfile.photo : pendingAdminPhoto;
  $('#sidebarAdminName').textContent = adminProfile.name;
  $('#sidebarAdminPosition').textContent = adminProfile.position;
  $('#dashboardAdminName').textContent = adminProfile.name;
  $('#settingsAdminName').textContent = adminProfile.name;
  $('#settingsAdminPosition').textContent = `${adminProfile.position} · ${office}`;
  [$('#sidebarAdminAvatar'), $('#topbarAdminAvatar'), $('#settingsAdminAvatar')].forEach(node => renderAdminAvatar(node, photo));
  $('#adminSettingsName').value = adminProfile.name;
  $('#adminSettingsPosition').value = adminProfile.position;
  $('#adminSettingsOffice').value = adminProfile.office;
  $('#adminSettingsEmail').value = adminProfile.email;
  $('#removeAdminPhoto').hidden = !photo;
}

async function loadAdminProfile() {
  try {
    const response = await fetch('/api/admin-profile', { credentials: 'same-origin' });
    if (!response.ok) return;
    const profile = await response.json();
    adminProfile = { ...adminProfile, ...profile };
    renderAdminProfile();
  } catch {
    // The default profile remains visible when the server is unavailable.
  }
}

function readProfilePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(new Error('The selected photo could not be read.')));
    reader.readAsDataURL(file);
  });
}

async function saveAdminProfile(event) {
  event.preventDefault();
  const profile = {
    name: $('#adminSettingsName').value.trim(),
    position: $('#adminSettingsPosition').value.trim(),
    office: $('#adminSettingsOffice').value.trim(),
    email: $('#adminSettingsEmail').value.trim(),
    photo: pendingAdminPhoto === undefined ? adminProfile.photo : pendingAdminPhoto
  };
  try {
    const response = await fetch('/api/admin-profile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(profile)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The administrator profile could not be saved.');
    adminProfile = { ...adminProfile, ...payload };
    pendingAdminPhoto = undefined;
    renderAdminProfile();
    audit('Updated administrator profile', adminProfile.name, 'Updated');
    toast('Administrator profile saved.');
  } catch (error) {
    toast(error.message || 'The administrator profile could not be saved.');
  }
}

function localStudentCount() {
  return students.filter(student => student.local).length;
}

function directoryTotal() {
  return localStudentCount();
}

function persistStudents() {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students.filter(student => student.local)));
}

function createStudentRecord({ name, rollNo, program, semester, section = 'A', attendance = 0, cgpa = null, status = 'Active', email = '', mobile = '', sequence = localStudentCount() + 1 }) {
  const serial = String(100 + sequence).padStart(3, '0');
  const programCode = String(program).replace(/[^a-z0-9]/gi, '').toUpperCase();
  const colors = ['blue-avatar', 'green-avatar', 'purple-avatar', 'orange-avatar'];
  const normalizedRollNo = String(rollNo).trim().toUpperCase();
  return {
    id: `NC26${programCode}${serial}`,
    initials: initialsFor(name),
    name: String(name).trim(),
    enrollment: normalizedRollNo,
    roll: normalizedRollNo,
    program,
    semester,
    section: String(section).trim().toUpperCase(),
    attendance: Number(attendance) || 0,
    cgpa: cgpa === '' || cgpa === null || cgpa === undefined ? null : Number(cgpa),
    status,
    email,
    mobile,
    color: colors[localStudentCount() % colors.length],
    local: true
  };
}

function addStudents(records) {
  students.unshift(...records.slice().reverse());
  persistStudents();
  renderStudents();
}

function statusClass(status) {
  const normalized = String(status).toLowerCase();
  if (['verified', 'active', 'complete', 'locked', 'allowed', 'recorded', 'sent', 'delivered', 'imported'].includes(normalized)) return 'green';
  if (['pending', 'submitted', 'in progress', 'attention', 'pending review', 'queued'].includes(normalized)) return 'amber';
  return 'red';
}

function formatState(state) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

function audit(action, record, outcome = 'Recorded', actor = adminProfile.name) {
  auditEvents.unshift({ time: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()), actor, action, record, outcome });
  renderAudit();
}

function renderDepartments() {
  $('#departmentList').innerHTML = departments.map(dep => `<div class="department-row"><strong>${escapeHtml(dep.name)}</strong><span>${dep.students} students</span><div class="mini-progress"><i style="width:${dep.attendance}%"></i></div><b>${dep.score}% avg.</b></div>`).join('');
}

function renderWork() {
  $('#workTableBody').innerHTML = workRows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td><span class="completion ${+row[2].slice(0, -1) < 80 ? 'warning-text' : ''}">${row[2]}</span></td><td><span class="completion ${+row[3].slice(0, -1) < 80 ? 'warning-text' : ''}">${row[3]}</span></td><td><span class="completion ${+row[4].slice(0, -1) < 80 ? 'warning-text' : ''}">${row[4]}</span></td><td><span class="status-pill ${row[6]}">${row[5]}</span></td></tr>`).join('');
}

function directoryProgramGroup(student) {
  const program = normalizeColumn(student.program);
  if (program === 'ba' || program.startsWith('ba ')) return 0;
  if (program === 'b com') return 1;
  return 2;
}

function directorySemesterNumber(student) {
  const match = String(student.semester || '').match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function directoryStudentOrder(left, right) {
  const groupDifference = directoryProgramGroup(left) - directoryProgramGroup(right);
  if (groupDifference) return groupDifference;
  const leftProgram = String(left.program || '');
  const rightProgram = String(right.program || '');
  if (directoryProgramGroup(left) === 2) {
    const programDifference = rollNoCollator.compare(leftProgram, rightProgram);
    if (programDifference) return programDifference;
  }
  const semesterDifference = directorySemesterNumber(left) - directorySemesterNumber(right);
  if (semesterDifference) return semesterDifference;
  const programDifference = rollNoCollator.compare(leftProgram, rightProgram);
  if (programDifference) return programDifference;
  return rollNoCollator.compare(studentRollNo(left), studentRollNo(right));
}

function filteredStudents() {
  return students.filter(student => {
    const text = `${student.name} ${studentRollNo(student)} ${student.id}`.toLowerCase();
    return text.includes(filters.query.toLowerCase()) && (filters.program === 'all' || student.program === filters.program) && (filters.semester === 'all' || student.semester === filters.semester);
  }).sort(directoryStudentOrder);
}

function renderStudents() {
  const list = filteredStudents();
  const filtered = Boolean(filters.query || filters.program !== 'all' || filters.semester !== 'all');
  const total = directoryTotal();
  const emptyMessage = students.length ? 'No students match these filters.' : 'No student records yet. Import a CSV, Excel, or PDF list to begin.';
  $('#studentTableBody').innerHTML = list.map(student => `<tr><td><button class="student-row-trigger" data-id="${student.id}"><span class="avatar small-avatar ${student.color}">${escapeHtml(student.initials)}</span><span><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.id)} · Sec ${escapeHtml(student.section)}</small></span></button></td><td>${escapeHtml(studentRollNo(student))}</td><td><strong>${escapeHtml(student.program)}</strong></td><td>${escapeHtml(student.semester.replace('Semester ', 'Sem '))}</td><td class="attendance-cell ${student.attendance < 75 ? 'red-text' : ''}">${student.attendance.toFixed(1)}%</td><td>${student.cgpa ? student.cgpa.toFixed(2) : '—'}</td><td><span class="status-pill ${statusClass(student.status)}">${escapeHtml(student.status)}</span></td><td><button class="record-action" aria-label="View ${escapeHtml(student.name)}" data-id="${student.id}">›</button></td></tr>`).join('') || `<tr><td colspan="8" class="empty-table">${emptyMessage}</td></tr>`;
  $('#directoryCount').textContent = filtered ? list.length : total.toLocaleString('en-IN');
  $('#tablePageInfo').textContent = `Showing ${list.length ? 1 : 0} to ${list.length} of ${(filtered ? list.length : total).toLocaleString('en-IN')}`;
  $('#studentCount').textContent = total.toLocaleString('en-IN');
  const sidebarCount = document.querySelector('[data-view="students"] b');
  if (sidebarCount) sidebarCount.textContent = total.toLocaleString('en-IN');
  $$('.student-row-trigger, .record-action').forEach(button => button.addEventListener('click', () => openStudent(button.dataset.id)));
}

function openStudent(id) {
  const found = students.find(student => student.id === id);
  if (!found) { toast('Import a student list before opening a student record.'); return; }
  selectedStudent = found;
  $('#profileAvatar').textContent = selectedStudent.initials;
  $('#profileAvatar').className = `avatar student-avatar ${selectedStudent.color}`;
  $('#profileId').textContent = selectedStudent.id;
  $('#profileName').textContent = selectedStudent.name;
  $('#profileInfo').textContent = `${selectedStudent.program} · ${selectedStudent.semester} · Section ${selectedStudent.section}`;
  $('#profileRoll').textContent = studentRollNo(selectedStudent);
  $('#profileAttendance').textContent = `${selectedStudent.attendance.toFixed(1)}%`;
  $('#profileCgpa').textContent = selectedStudent.cgpa ? selectedStudent.cgpa.toFixed(2) : '—';
  $('#personalStudentId').textContent = selectedStudent.id;
  $('#enrollmentProgram').textContent = selectedStudent.program;
  $('#enrollmentSection').textContent = `${selectedStudent.semester} · ${selectedStudent.section}`;
  $('#resultCgpa').textContent = selectedStudent.cgpa ? selectedStudent.cgpa.toFixed(2) : '—';
  switchView('profile');
}

function switchView(view) {
  const panel = document.querySelector(`[data-view-panel="${view}"]`);
  if (!panel) return;
  $$('.view').forEach(item => item.classList.remove('active'));
  panel.classList.add('active');
  $$('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view || (view === 'profile' && link.dataset.view === 'students')));
  const labels = { dashboard: 'Overview', students: 'Students', profile: 'Student record', attendance: 'Attendance', assessments: 'Assessment', documents: 'Documents', faculty: 'Faculty', reports: 'Reports', communications: 'Communications', administration: 'Administration', settings: 'Settings' };
  $('#breadcrumb').textContent = labels[view] || 'Overview';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('#sidebar').classList.remove('open');
}

function showModal(content) {
  lastActiveElement = document.activeElement;
  $('#modalContent').innerHTML = content;
  $('#modalBackdrop').classList.add('open');
  $('#modalBackdrop').setAttribute('aria-hidden', 'false');
  const focusTarget = $('#modalContent').querySelector('input, select, button');
  if (focusTarget) focusTarget.focus();
}

function closeModal() {
  $('#modalBackdrop').classList.remove('open');
  $('#modalBackdrop').setAttribute('aria-hidden', 'true');
  if (lastActiveElement && typeof lastActiveElement.focus === 'function') lastActiveElement.focus();
}

function toast(message) {
  const node = $('#toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => node.classList.remove('show'), 3200);
}

async function signOut() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  } finally {
    window.location.replace('/login.html');
  }
}

function accountMenuModal() {
  showModal(`<h2>Signed in account</h2><p>${escapeHtml(adminProfile.name)} · ${escapeHtml(adminProfile.position)}</p><div class="review-details"><div><small>Office</small><strong>${escapeHtml(adminProfile.office || 'Academic Office')}</strong></div><div><small>Session</small><strong>Local protected session</strong></div></div><div class="modal-actions"><button class="button secondary" id="openAccountSettings">Settings</button><button class="button secondary" id="closeAccountMenu">Close</button><button class="button primary" id="signOutButton">Sign out</button></div>`);
  $('#closeAccountMenu').addEventListener('click', closeModal);
  $('#openAccountSettings').addEventListener('click', () => { closeModal(); switchView('settings'); });
  $('#signOutButton').addEventListener('click', signOut);
}

function quickActions() {
  showModal(`<h2>Quick action</h2><p>Start a common academic-office task.</p><div class="quick-list"><button data-action="attendance">◷ &nbsp; Mark today’s attendance</button><button data-action="student">♙ &nbsp; Add a new student record</button><button data-action="document">▣ &nbsp; Upload and verify a document</button><button data-action="assessment">▤ &nbsp; Create an internal assessment</button></div>`);
  $$('[data-action]').forEach(button => button.addEventListener('click', () => {
    closeModal();
    const action = button.dataset.action;
    if (action === 'attendance') attendanceModal();
    else if (action === 'student') addStudentModal();
    else if (action === 'document') { switchView('documents'); uploadDocumentModal(); }
    else { switchView('assessments'); assessmentModal(); }
  }));
}

function addStudentModal() {
  showModal(`<h2>Add student</h2><p>Create one student record, or import many students from an Excel workbook.</p><div class="student-import-cta"><div><strong>Have a student list?</strong><small>Upload an Excel workbook to add all valid students at once.</small></div><button type="button" class="button secondary" id="openStudentExcelImport">Import Excel</button></div><form id="studentForm"><div class="field-grid"><label>Student name<input required id="newStudentName" maxlength="120" placeholder="e.g. Nikhil Kapoor" /></label><label>Roll no.<input required id="newStudentRollNo" maxlength="80" placeholder="e.g. BCA-26-201" /></label><label>Program<select id="newProgram"><option>BCA</option><option>B.Com</option><option>BBA</option><option>BA</option></select></label><label>Semester<select id="newSemester"><option>Semester 1</option><option>Semester 2</option><option>Semester 3</option><option>Semester 4</option><option>Semester 5</option><option>Semester 6</option></select></label></div><div class="modal-actions"><button type="button" class="button secondary" id="cancelForm">Cancel</button><button class="button primary">Create student</button></div></form>`);
  $('#cancelForm').addEventListener('click', closeModal);
  $('#openStudentExcelImport').addEventListener('click', studentExcelImportModal);
  $('#studentForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#newStudentName').value.trim();
    const rollNo = $('#newStudentRollNo').value.trim().toUpperCase();
    const program = $('#newProgram').value;
    const semester = $('#newSemester').value;
    if (students.some(student => studentRollNo(student).toLowerCase() === rollNo.toLowerCase())) {
      toast('A student with that roll number already exists. Review the existing student first.');
      $('#newStudentRollNo').focus();
      return;
    }
    if (!name) { toast('Enter the student name before creating a record.'); $('#newStudentName').focus(); return; }
    const student = createStudentRecord({ name, rollNo, program, semester });
    addStudents([student]);
    audit('Created student draft', `${student.id} · ${student.name}`, 'Draft created', 'Academic Office');
    closeModal();
    toast(`${name} was added as a draft student record.`);
  });
}

function attendanceModal() {
  showModal(`<h2>Mark attendance</h2><p>Start an attendance session for an assigned class. A production API requires a revision and idempotency key.</p><form id="attendanceForm"><div class="field-grid"><label>Department<select><option>BCA</option><option>B.Com</option><option>BBA</option></select></label><label>Class / semester<select><option>Semester 4 · Section A</option><option>Semester 3 · Section B</option></select></label><label>Subject<select id="attendanceSubject"><option>Data Structures</option><option>Web Technologies</option><option>Database Management</option></select></label><label>Date<input id="attendanceDate" type="date" value="2026-09-11" /></label></div><div class="modal-actions"><button type="button" class="button secondary" id="cancelAttendance">Cancel</button><button class="button primary">Continue to roster</button></div></form>`);
  $('#cancelAttendance').addEventListener('click', closeModal);
  $('#attendanceForm').addEventListener('submit', event => {
    event.preventDefault();
    const subject = $('#attendanceSubject').value;
    const date = $('#attendanceDate').value;
    closeModal();
    attendanceRosterModal(subject, date);
  });
}

function attendanceRosterModal(subject, date) {
  const roster = students.filter(student => student.program === 'BCA').slice(0, 3);
  showModal(`<h2>Attendance roster</h2><p>${escapeHtml(subject)} · ${escapeHtml(date)} · BCA Semester 4, Section A</p><form id="rosterForm"><div class="roster-list">${roster.map(student => `<label><span><strong>${escapeHtml(student.name)}</strong><small>${escapeHtml(student.roll)}</small></span><select name="${student.id}"><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="excused">Excused</option></select></label>`).join('')}</div><p class="form-note">This demo stores no personal attendance data after the browser session. Server-side validation must confirm roster membership before save.</p><div class="modal-actions"><button type="button" class="button secondary" id="backAttendance">Back</button><button class="button primary">Save ${roster.length} entries</button></div></form>`);
  $('#backAttendance').addEventListener('click', attendanceModal);
  $('#rosterForm').addEventListener('submit', event => {
    event.preventDefault();
    audit('Recorded attendance session', `${subject} · ${date}`, `${roster.length} entries recorded`, 'Prof. R. Mehta');
    closeModal();
    toast(`Attendance saved for ${roster.length} roster entries.`);
  });
}

function nextAssessmentAction(state) {
  return ({ draft: ['Submit', 'submitted'], submitted: ['Verify', 'verified'], verified: ['Lock', 'locked'] })[state] || null;
}

function renderAssessments() {
  $('#assessmentTableBody').innerHTML = assessments.map(assessment => {
    const next = nextAssessmentAction(assessment.state);
    return `<tr><td><strong>${escapeHtml(assessment.title)}</strong><small class="table-subtext">${assessment.id}</small></td><td>${escapeHtml(assessment.offering)}</td><td>${escapeHtml(assessment.scheme)}</td><td>${escapeHtml(assessment.heldOn)}</td><td>${escapeHtml(assessment.entries)}</td><td><span class="status-pill ${statusClass(assessment.state)}">${formatState(assessment.state)}</span></td><td>${next ? `<button class="button secondary small-button" data-assessment-id="${assessment.id}">${next[0]}</button>` : '<span class="locked-label">Locked</span>'}</td></tr>`;
  }).join('');
  $$('[data-assessment-id]').forEach(button => button.addEventListener('click', () => transitionAssessment(button.dataset.assessmentId)));
}

function transitionAssessment(id) {
  const assessment = assessments.find(item => item.id === id);
  if (!assessment) return;
  const next = nextAssessmentAction(assessment.state);
  if (!next) return;
  const previous = assessment.state;
  assessment.state = next[1];
  renderAssessments();
  audit(`Moved assessment from ${formatState(previous)} to ${formatState(assessment.state)}`, `${assessment.id} · ${assessment.title}`, formatState(assessment.state), assessment.state === 'verified' ? 'Dr. Vivek Range' : 'Prof. R. Mehta');
  toast(`${assessment.title} is now ${assessment.state}.`);
}

function assessmentModal() {
  showModal(`<h2>Create assessment</h2><p>Create a draft using a configured component. The approved scheme and maximum belong to the offering, not a hard-coded screen value.</p><form id="assessmentForm"><div class="field-grid"><label>Title<input required id="assessmentTitle" maxlength="120" placeholder="e.g. Class Test 3" /></label><label>Offering<select id="assessmentOffering"><option>BCA · Semester 4 · A</option><option>B.Com · Semester 2 · B</option></select></label><label>Component<select id="assessmentScheme"><option>Class test / 30</option><option>Assignment / 10</option><option>Quiz / 10</option></select></label><label>Held on<input required id="assessmentDate" type="date" value="2026-09-11" /></label></div><div class="modal-actions"><button type="button" class="button secondary" id="cancelAssessment">Cancel</button><button class="button primary">Create draft</button></div></form>`);
  $('#cancelAssessment').addEventListener('click', closeModal);
  $('#assessmentForm').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('#assessmentTitle').value.trim();
    if (!title) { toast('Enter an assessment title before creating a draft.'); $('#assessmentTitle').focus(); return; }
    const id = `ASM-${205 + assessments.length}`;
    assessments.unshift({ id, title, offering: $('#assessmentOffering').value, scheme: $('#assessmentScheme').value, heldOn: $('#assessmentDate').value, entries: '0 / 42', state: 'draft' });
    renderAssessments();
    audit('Created assessment draft', `${id} · ${title}`, 'Draft created', 'Prof. R. Mehta');
    closeModal();
    toast(`${title} is ready for score entry.`);
  });
}

function renderDocuments() {
  const visible = documents.filter(documentItem => !pendingDocumentsOnly || documentItem.state === 'pending');
  const pendingCount = documents.filter(documentItem => documentItem.state === 'pending').length;
  $('#documentQueueSummary').textContent = `${pendingCount} document${pendingCount === 1 ? '' : 's'} require reviewer action.`;
  $('#documentFilterButton').textContent = pendingDocumentsOnly ? 'Show all' : 'Pending only';
  $('#documentQueue').innerHTML = visible.map(documentItem => `<div class="verification-row"><span class="doc-icon ${documentItem.type === 'IMG' ? 'img' : 'pdf'}">${documentItem.type}</span><div><strong>${escapeHtml(documentItem.title)} · ${escapeHtml(documentItem.student)}</strong><small>Uploaded by ${escapeHtml(documentItem.uploadedBy)} · ${escapeHtml(documentItem.age)}</small></div><span class="status-pill ${statusClass(documentItem.state)}">${formatState(documentItem.state)}</span><button class="button primary small-button" data-document-id="${documentItem.id}">${documentItem.state === 'pending' ? 'Review' : 'View history'}</button></div>`).join('') || '<div class="queue-empty">No documents match this queue filter.</div>';
  $$('[data-document-id]').forEach(button => button.addEventListener('click', () => reviewDocument(button.dataset.documentId)));
}

function reviewDocument(id) {
  const documentItem = documents.find(item => item.id === id);
  if (!documentItem) return;
  const canVerify = documentItem.state === 'pending';
  showModal(`<h2>Document review</h2><p>${escapeHtml(documentItem.title)} · ${escapeHtml(documentItem.student)}</p><div class="review-details"><div><small>Document reference</small><strong>${documentItem.id}</strong></div><div><small>Uploaded by</small><strong>${escapeHtml(documentItem.uploadedBy)}</strong></div><div><small>Current state</small><strong>${formatState(documentItem.state)}</strong></div><div><small>Storage</small><strong>Metadata-only demo</strong></div></div><p class="form-note">A real preview is re-authorized on every request, recorded in file access history and served from private storage only.</p><div class="modal-actions"><button type="button" class="button secondary" id="closeReview">Close</button>${canVerify ? '<button class="button primary" id="verifyDocument">Verify document</button>' : ''}</div>`);
  $('#closeReview').addEventListener('click', closeModal);
  if (canVerify) $('#verifyDocument').addEventListener('click', () => {
    documentItem.state = 'verified';
    renderDocuments();
    audit('Verified document', `${documentItem.id} · ${documentItem.title}`, 'Verified');
    closeModal();
    toast(`${documentItem.title} has been verified.`);
  });
}

function uploadDocumentModal(preselectedStudentId = '') {
  if (!students.length) { toast('Import a student list before registering a document.'); return; }
  showModal(`<h2>Register document</h2><p>Add a document to the review queue. This demo intentionally does not accept or retain file bytes.</p><form id="uploadDocumentForm"><div class="field-grid"><label>Document title<input required id="documentTitle" maxlength="180" placeholder="e.g. Semester 4 DMC" /></label><label>Student<select id="documentStudent">${students.map(student => `<option value="${student.id}">${escapeHtml(student.name)} · ${student.id}</option>`).join('')}</select></label><label>Category<select><option>DMC / marksheet</option><option>Certificate</option><option>Admission evidence</option></select></label><label>File type<select id="documentType"><option>PDF</option><option>IMG</option></select></label></div><p class="form-note">Production upload controls: allow-listed types, size limits, malware scan, checksum and private object storage.</p><div class="modal-actions"><button type="button" class="button secondary" id="cancelDocument">Cancel</button><button class="button primary">Add to queue</button></div></form>`);
  if (preselectedStudentId && students.some(student => student.id === preselectedStudentId)) $('#documentStudent').value = preselectedStudentId;
  $('#cancelDocument').addEventListener('click', closeModal);
  $('#uploadDocumentForm').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('#documentTitle').value.trim();
    if (!title) { toast('Enter a document title before adding it to the queue.'); $('#documentTitle').focus(); return; }
    const student = students.find(item => item.id === $('#documentStudent').value);
    const documentItem = { id: `DOC-${119 + documents.length}`, type: $('#documentType').value, title, student: student.name, uploadedBy: 'Academic Office', age: 'Just now', state: 'pending' };
    documents.unshift(documentItem);
    pendingDocumentsOnly = true;
    renderDocuments();
    audit('Registered document for review', `${documentItem.id} · ${documentItem.title}`, 'Pending review', 'Academic Office');
    closeModal();
    toast(`${documentItem.title} was added to the verification queue.`);
  });
}

const importConfigs = {
  admission: {
    label: 'Admission sheet',
    required: ['Student Name', 'Roll No', 'Program', 'Semester'],
    template: [
      ['Student Name', 'Roll No', 'Program', 'Semester'],
      ['Kavya Nair', 'BCA-26-201', 'BCA', 'Semester 1'],
      ['Aditi Mehta', 'BCM-26-142', 'B.Com', 'Semester 1']
    ]
  },
  result: {
    label: 'Result sheet',
    required: ['Roll No', 'Semester', 'SGPA', 'CGPA', 'Percentage', 'Result'],
    template: [
      ['Roll No', 'Semester', 'SGPA', 'CGPA', 'Percentage', 'Result'],
      ['BCA-23-041', 'Semester 4', '8.60', '8.46', '86.0', 'Pass'],
      ['BBA-23-088', 'Semester 4', '7.80', '7.75', '78.0', 'Pass']
    ]
  }
};

function csvDelimiter(text) {
  const firstRow = String(text || '').split(/\r?\n/).find(row => row.trim()) || '';
  return [',', ';', '\t', '|'].map(delimiter => ({ delimiter, count: firstRow.split(delimiter).length - 1 }))
    .sort((left, right) => right.count - left.count)[0].delimiter;
}

function parseCsv(text) {
  const delimiter = csvDelimiter(text);
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim()); cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(value => value !== '')) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== '')) rows.push(row);
  return rows;
}

function readSpreadsheetFile(file, onLoaded) {
  const extension = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      if (extension === 'csv') return onLoaded(parseCsv(String(reader.result)));
      if (!window.XLSX) throw new Error('The Excel reader did not load. Refresh the page and try again.');
      const workbook = XLSX.read(reader.result, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!firstSheet) throw new Error('The workbook does not contain a worksheet.');
      onLoaded(XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '', raw: false, blankrows: false }));
    } catch (error) {
      toast(error.message || 'The spreadsheet could not be read.');
    }
  });
  if (extension === 'csv') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function parseStudentPdfRows(text) {
  const lines = String(text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const headerIndex = lines.findIndex(line => {
    const normalized = normalizeColumn(line);
    return normalized.includes('student name') && normalized.includes('roll no') && normalized.includes('program') && normalized.includes('semester');
  });
  if (headerIndex < 0) throw new Error('The PDF needs a text table with Student Name, Roll No, Program and Semester headers.');
  const headerLine = lines[headerIndex];
  const delimiter = ['|', ',', '\t'].find(value => headerLine.includes(value));
  if (!delimiter) throw new Error('Use a PDF table with comma-, tab-, or | separated columns. Scanned PDFs need OCR before import.');
  const rows = [headerLine.split(delimiter).map(spreadsheetCell)];
  lines.slice(headerIndex + 1).forEach(line => {
    if (!line.includes(delimiter)) return;
    const row = line.split(delimiter).map(spreadsheetCell);
    if (row.length >= 4) rows.push(row);
  });
  if (rows.length < 2) throw new Error('No student rows were found after the PDF header.');
  return rows;
}

async function readStudentImportFile(file, onLoaded) {
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension !== 'pdf') return readSpreadsheetFile(file, onLoaded);
  try {
    const response = await fetch('/api/parse-student-pdf', { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'The PDF could not be read.');
    onLoaded(parseStudentPdfRows(payload.text));
  } catch (error) {
    toast(error.message || 'The PDF could not be read.');
  }
}

function normalizeColumn(value) {
  return String(value || '').replace(/^\uFEFF/, '').trim().toLowerCase().replace(/[._-]+/g, ' ').replace(/\s+/g, ' ');
}

function spreadsheetCell(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

const STUDENT_HEADER_ALIASES = {
  'Student Name': ['student name', 'name', 'student', 'student full name', 'full name'],
  'Roll No': ['roll no', 'roll no.', 'roll number', 'roll', 'id', 'student id', 'enrollment no', 'enrolment no'],
  Program: ['program', 'course', 'course name', 'department'],
  Semester: ['semester', 'sem', 'sem.', 'class semester'],
  'College Email': ['college email', 'email', 'email id', 'e-mail'],
  Mobile: ['mobile', 'mobile no', 'mobile number', 'phone', 'phone no', 'contact number'],
  'Attendance %': ['attendance', 'attendance %', 'attendance percentage'],
  CGPA: ['cgpa'],
  Status: ['status', 'record status']
};

function studentHeaderMap(headers) {
  const normalizedHeaders = headers.map(normalizeColumn);
  return new Map(STUDENT_IMPORT_HEADERS.map(header => {
    const aliases = [header, ...(STUDENT_HEADER_ALIASES[header] || [])].map(normalizeColumn);
    return [header, normalizedHeaders.findIndex(value => aliases.includes(value))];
  }));
}

function timetableSemester(value) {
  const source = spreadsheetCell(value).replace(/\s+/g, ' ');
  const match = source.match(/^(.*?)\s+([1-6])(?:st|nd|rd|th)?\s*sem(?:ester)?\.?$/i);
  if (!match) return null;
  const program = match[1].trim().replace(/\s+/g, ' ');
  return program ? { program, semester: `Semester ${match[2]}` } : null;
}

function studentImportSummary(rawRows) {
  const required = STUDENT_IMPORT_HEADERS.slice(0, 4);
  if (rawRows.length < 2) return { error: 'The workbook must include a header row and at least one student row.' };
  const headerMap = studentHeaderMap(rawRows[0]);
  const timetableFormat = headerMap.get('Student Name') >= 0 && headerMap.get('Roll No') >= 0 && headerMap.get('Semester') >= 0 && headerMap.get('Program') < 0;
  const missing = required.filter(header => header === 'Program' && timetableFormat ? false : headerMap.get(header) < 0);
  if (missing.length) return { error: `Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}. This importer also accepts timetable CSV columns id, name and sem.` };
  const existing = new Set(students.map(student => studentRollNo(student).toLowerCase()));
  const encountered = new Set();
  const valid = [];
  const errors = [];
  rawRows.slice(1).forEach((source, index) => {
    const line = index + 2;
    const item = {};
    required.forEach(header => { item[header] = spreadsheetCell(source[headerMap.get(header)]); });
    STUDENT_IMPORT_HEADERS.slice(4).forEach(header => { item[header] = spreadsheetCell(source[headerMap.get(header)]); });
    if (timetableFormat) {
      const derived = timetableSemester(item.Semester);
      item.Program = derived ? derived.program : '';
      item.Semester = derived ? derived.semester : item.Semester;
    }
    if (!Object.values(item).some(Boolean)) return;
    const blank = required.find(header => !item[header]);
    const rollNoKey = item['Roll No'].toLowerCase();
    const attendance = item['Attendance %'] ? Number(item['Attendance %']) : 0;
    const cgpa = item.CGPA ? Number(item.CGPA) : null;
    const status = item.Status ? item.Status.charAt(0).toUpperCase() + item.Status.slice(1).toLowerCase() : 'Active';
    if (blank) errors.push({ line, message: `${blank} is required.` });
    else if (item.Program.length > 80) errors.push({ line, message: 'Program is too long.' });
    else if (!/^Semester [1-6]$/i.test(item.Semester)) errors.push({ line, message: 'Semester must be between Semester 1 and Semester 6.' });
    else if (existing.has(rollNoKey) || encountered.has(rollNoKey)) errors.push({ line, message: 'Roll number already exists or is duplicated in this workbook.' });
    else if (item['College Email'] && !item['College Email'].includes('@')) errors.push({ line, message: 'College Email must contain an @ symbol.' });
    else if (!Number.isFinite(attendance) || attendance < 0 || attendance > 100) errors.push({ line, message: 'Attendance % must be a number from 0 to 100.' });
    else if (cgpa !== null && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) errors.push({ line, message: 'CGPA must be a number from 0 to 10.' });
    else if (!['Active', 'Verified', 'Pending', 'Attention'].includes(status)) errors.push({ line, message: 'Status must be Active, Verified, Pending or Attention.' });
    else {
      encountered.add(rollNoKey);
      valid.push({ line, item: { ...item, 'Attendance %': attendance, CGPA: cgpa, Status: status } });
    }
  });
  return { valid, errors, total: valid.length + errors.length };
}

function downloadStudentTemplate() {
  xlsxDownload('gcw-karnal-student-import-template.xlsx', 'Student import', STUDENT_IMPORT_HEADERS, [
    ['Kavya Nair', 'BCA-26-201', 'BCA', 'Semester 1', 'kavya.nair@gcwkarnal.ac.in', '+919000000201', 0, '', 'Active'],
    ['Aditi Mehta', 'BCM-26-142', 'B.Com', 'Semester 1', 'aditi.mehta@gcwkarnal.ac.in', '+919000000142', 0, '', 'Active']
  ]);
  toast('Excel import template downloaded. Replace the sample rows before importing.');
}

function studentExcelImportModal() {
  showModal(`<h2>Import students</h2><p>Upload an Excel, CSV, or PDF student list to create all valid directory records.</p><form id="studentExcelImportForm"><label class="file-field">Student list<input required id="studentExcelFile" type="file" accept=".xlsx,.csv,.pdf,text/csv,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" /><span>Choose .xlsx, .csv, or text-based .pdf</span></label><div class="import-columns"><strong>Accepted columns</strong><p>Student Name · Roll No · Program · Semester</p><small>CSV and Excel timetable exports with id · name · sem are also supported. Program and Semester are read from sem automatically.</small></div><p class="form-note">Optional: College Email, Mobile, Attendance %, CGPA and Status. PDFs must be text-based with comma-, tab-, or | separated columns. Duplicate roll numbers are blocked.</p><div class="modal-actions"><button type="button" class="button secondary" id="downloadStudentTemplate">Download template</button><button type="button" class="button secondary" id="cancelStudentExcelImport">Cancel</button><button class="button primary">Validate list</button></div></form>`);
  $('#downloadStudentTemplate').addEventListener('click', downloadStudentTemplate);
  $('#cancelStudentExcelImport').addEventListener('click', closeModal);
  $('#studentExcelImportForm').addEventListener('submit', event => {
    event.preventDefault();
    const file = $('#studentExcelFile').files[0];
    if (!file) return;
    if (!/\.(xlsx|csv|pdf)$/i.test(file.name)) { toast('Choose an .xlsx, .csv, or .pdf student list.'); return; }
    readStudentImportFile(file, rows => previewStudentExcelImport(file.name, studentImportSummary(rows)));
  });
}

function previewStudentExcelImport(filename, summary) {
  if (summary.error) { toast(summary.error); return; }
  const rows = summary.valid.slice(0, 5).map(({ line, item }) => `<tr><td>${line}</td><td>${escapeHtml(item['Student Name'])}</td><td>${escapeHtml(item['Roll No'])}</td><td>${escapeHtml(item.Program)}</td><td>${escapeHtml(item.Semester)}</td></tr>`).join('') || '<tr><td colspan="5">No valid student rows are ready to import.</td></tr>';
  const errors = summary.errors.slice(0, 5).map(error => `<li>Row ${error.line}: ${escapeHtml(error.message)}</li>`).join('');
  showModal(`<h2>Validate student workbook</h2><p><strong>${escapeHtml(filename)}</strong> contains ${summary.total} student row${summary.total === 1 ? '' : 's'}: <strong>${summary.valid.length} valid</strong> and <strong>${summary.errors.length} requiring attention</strong>.</p><div class="import-preview"><div class="preview-header"><span>Students ready to import</span><small>First five valid rows</small></div><div class="preview-table-wrap"><table><thead><tr><th>Row</th><th>Student</th><th>Roll no.</th><th>Program</th><th>Semester</th></tr></thead><tbody>${rows}</tbody></table></div></div>${errors ? `<div class="import-errors"><strong>Rows not imported</strong><ul>${errors}</ul></div>` : ''}<div class="modal-actions"><button class="button secondary" id="backToStudentExcelImport">Choose another file</button><button class="button primary" id="confirmStudentExcelImport" ${summary.valid.length ? '' : 'disabled'}>Import ${summary.valid.length} student${summary.valid.length === 1 ? '' : 's'}</button></div>`);
  $('#backToStudentExcelImport').addEventListener('click', studentExcelImportModal);
  if (summary.valid.length) $('#confirmStudentExcelImport').addEventListener('click', () => {
    const firstSequence = localStudentCount();
    const newStudents = summary.valid.map(({ item }, index) => createStudentRecord({
      name: item['Student Name'], rollNo: item['Roll No'], program: item.Program,
      semester: item.Semester, attendance: item['Attendance %'], sequence: firstSequence + index + 1,
      cgpa: item.CGPA, status: item.Status, email: item['College Email'], mobile: item.Mobile
    }));
    addStudents(newStudents);
    audit('Imported student workbook', `${newStudents.length} student record${newStudents.length === 1 ? '' : 's'}`, 'Imported', 'Academic Office');
    closeModal();
    toast(`${newStudents.length} student record${newStudents.length === 1 ? '' : 's'} added to the directory.`);
  });
}

function readImportRows(type, rawRows) {
  const config = importConfigs[type];
  if (rawRows.length < 2) return { error: 'The file must contain a header row and at least one data row.' };
  const headerMap = new Map(rawRows[0].map((header, index) => [normalizeColumn(header), index]));
  const missing = config.required.filter(header => !headerMap.has(normalizeColumn(header)));
  if (missing.length) return { error: `Missing required column${missing.length === 1 ? '' : 's'}: ${missing.join(', ')}.` };
  const dataRows = rawRows.slice(1).map((row, index) => {
    const item = {};
    config.required.forEach(header => { item[header] = (row[headerMap.get(normalizeColumn(header))] || '').trim(); });
    return { line: index + 2, item };
  }).filter(entry => Object.values(entry.item).some(Boolean));
  const existingRollNumbers = new Set(students.map(student => studentRollNo(student).toLowerCase()));
  const encountered = new Set();
  const valid = [];
  const errors = [];
  dataRows.forEach(entry => {
    const values = entry.item;
    const blank = config.required.find(header => !values[header]);
    if (blank) { errors.push({ line: entry.line, message: `${blank} is required.` }); return; }
    if (type === 'admission') {
      const rollNoKey = values['Roll No'].toLowerCase();
      if (existingRollNumbers.has(rollNoKey) || encountered.has(rollNoKey)) { errors.push({ line: entry.line, message: 'Roll number already exists or is duplicated in this file.' }); return; }
      if (!['BCA', 'B.Com', 'BBA', 'BA'].includes(values.Program)) { errors.push({ line: entry.line, message: 'Program must be BCA, B.Com, BBA or BA.' }); return; }
      if (!/^Semester\s+[1-9][0-2]?$/i.test(values.Semester)) { errors.push({ line: entry.line, message: 'Semester must use the format “Semester 1”.' }); return; }
      encountered.add(rollNoKey);
      valid.push(entry);
    } else {
      const student = students.find(item => studentRollNo(item).toLowerCase() === values['Roll No'].toLowerCase());
      const sgpa = Number(values.SGPA);
      const cgpa = Number(values.CGPA);
      const percentage = Number(values.Percentage);
      if (!student) { errors.push({ line: entry.line, message: 'No active student matches this roll number.' }); return; }
      if (![sgpa, cgpa].every(value => Number.isFinite(value) && value >= 0 && value <= 10) || !Number.isFinite(percentage) || percentage < 0 || percentage > 100) { errors.push({ line: entry.line, message: 'SGPA/CGPA must be 0–10 and Percentage must be 0–100.' }); return; }
      valid.push({ ...entry, student, sgpa, cgpa, percentage });
    }
  });
  return { valid, errors, total: dataRows.length };
}

function downloadImportTemplate(type) {
  const config = importConfigs[type];
  xlsxDownload(`gcw-karnal-${type}-import-template.xlsx`, `${type} import`, config.template[0], config.template.slice(1));
  toast(`${config.label} template downloaded.`);
}

function importSheetModal(type) {
  const config = importConfigs[type];
  showModal(`<h2>Import ${config.label.toLowerCase()}</h2><p>Choose a CSV or Excel sheet, then validate a preview before importing. Existing records are never silently overwritten.</p><form id="importSheetForm"><label class="file-field">Spreadsheet<input required id="importSheetFile" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" /><span>Choose .csv or .xlsx file</span></label><div class="import-columns"><strong>Required columns</strong><p>${config.required.map(escapeHtml).join(' · ')}</p></div><p class="form-note">The first worksheet is read and every row is validated before the import confirmation appears.</p><div class="modal-actions"><button type="button" class="button secondary" id="downloadImportTemplate">Download template</button><button type="button" class="button secondary" id="cancelImport">Cancel</button><button class="button primary">Validate preview</button></div></form>`);
  $('#cancelImport').addEventListener('click', closeModal);
  $('#downloadImportTemplate').addEventListener('click', () => downloadImportTemplate(type));
  $('#importSheetForm').addEventListener('submit', event => {
    event.preventDefault();
    const file = $('#importSheetFile').files[0];
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) { toast('Choose a .csv or .xlsx spreadsheet.'); return; }
    readSpreadsheetFile(file, rows => previewImport(type, file.name, readImportRows(type, rows)));
  });
}

function previewImport(type, filename, summary) {
  const config = importConfigs[type];
  if (summary.error) {
    toast(summary.error);
    return;
  }
  const preview = summary.valid.slice(0, 4).map(entry => `<tr><td>${entry.line}</td>${config.required.map(header => `<td>${escapeHtml(entry.item[header])}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${config.required.length + 1}">No valid rows available for import.</td></tr>`;
  const errorPreview = summary.errors.slice(0, 3).map(entry => `<li>Row ${entry.line}: ${escapeHtml(entry.message)}</li>`).join('');
  showModal(`<h2>Validate ${config.label.toLowerCase()}</h2><p><strong>${escapeHtml(filename)}</strong> contains ${summary.total} data row${summary.total === 1 ? '' : 's'}: <strong>${summary.valid.length} valid</strong> and <strong>${summary.errors.length} requiring attention</strong>.</p><div class="import-preview"><div class="preview-header"><span>Valid-row preview</span><small>Only the first four rows are shown</small></div><div class="preview-table-wrap"><table><thead><tr><th>Row</th>${config.required.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${preview}</tbody></table></div></div>${summary.errors.length ? `<div class="import-errors"><strong>Rows not imported</strong><ul>${errorPreview}</ul></div>` : ''}<p class="form-note">Confirming creates drafts for admission rows or a new result revision for each matched student. A production import requires Super Admin scope, optimistic revision checks and one transaction per approved batch.</p><div class="modal-actions"><button class="button secondary" id="backToImport">Choose another file</button><button class="button primary" id="confirmImport" ${summary.valid.length ? '' : 'disabled'}>Import ${summary.valid.length} valid row${summary.valid.length === 1 ? '' : 's'}</button></div>`);
  $('#backToImport').addEventListener('click', () => importSheetModal(type));
  if (summary.valid.length) $('#confirmImport').addEventListener('click', () => commitImport(type, summary.valid));
}

function commitImport(type, validRows) {
  if (type === 'admission') {
    addStudents(validRows.map(({ item }) => createStudentRecord({ name: item['Student Name'], rollNo: item['Roll No'], program: item.Program, semester: item.Semester })));
    audit('Imported admission batch', `${validRows.length} student draft${validRows.length === 1 ? '' : 's'}`, 'Imported', 'Academic Office');
  } else {
    validRows.forEach(entry => {
      entry.student.cgpa = entry.cgpa;
      entry.student.status = entry.item.Result.toLowerCase() === 'pass' ? 'Verified' : 'Attention';
    });
    renderStudents();
    audit('Imported result batch', `${validRows.length} student result revision${validRows.length === 1 ? '' : 's'}`, 'Imported', 'Academic Office');
  }
  closeModal();
  toast(`${validRows.length} ${type === 'admission' ? 'admission draft' : 'result'} row${validRows.length === 1 ? '' : 's'} imported for this demo session.`);
}

function renderMessages() {
  const visible = messages.filter(message => !showQueuedMessagesOnly || message.state === 'queued');
  $('#messageFilterButton').textContent = showQueuedMessagesOnly ? 'Show all' : 'Queued only';
  $('#messageTableBody').innerHTML = visible.map(message => `<tr><td><strong>${escapeHtml(message.subject)}</strong><small class="table-subtext">${message.id}</small></td><td>${escapeHtml(message.audience)}</td><td><div class="channel-list">${message.channels.map(channel => `<span>${escapeHtml(channel)}</span>`).join('')}</div></td><td>${escapeHtml(message.requestedBy)}</td><td><span class="status-pill ${statusClass(message.state)}">${formatState(message.state)}</span></td><td><button class="button secondary small-button" data-message-id="${message.id}">View</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty-table">No queued notices.</td></tr>';
  $$('[data-message-id]').forEach(button => button.addEventListener('click', () => viewMessage(button.dataset.messageId)));
}

function composeMessageModal() {
  showModal(`<h2>Compose notice or circular</h2><p>Select the approved audience and channels. Each recipient is checked again by the delivery worker in production.</p><form id="messageForm"><div class="field-grid"><label>Subject<input required id="messageSubject" maxlength="160" placeholder="e.g. Examination form deadline" /></label><label>Audience<select id="messageAudience"><option value="All active students · 1,248 students">All active students · 1,248 students</option><option value="Low-attendance students · 43 students">Low-attendance students · 43 students</option><option value="BCA Semester 4 · 42 students">BCA Semester 4 · 42 students</option><option value="B.Com Semester 2 · 38 students">B.Com Semester 2 · 38 students</option></select></label></div><label class="message-body-label">Notice text<textarea required id="messageBody" maxlength="1200" placeholder="Write a clear, approved notice for the selected audience."></textarea></label><fieldset class="channel-picker"><legend>Delivery channels</legend><label><input type="checkbox" name="channel" value="SMS" /> SMS</label><label><input type="checkbox" name="channel" value="Email" checked /> Email</label><label><input type="checkbox" name="channel" value="In-app" checked /> In-app notice</label></fieldset><p class="form-note">SMS/email are queued only in this MVP. Production requires consent/preference checks, approved templates, provider credentials held server-side, rate limits and delivery status handling.</p><div class="modal-actions"><button type="button" class="button secondary" id="cancelMessage">Cancel</button><button class="button primary">Queue notice</button></div></form>`);
  $('#cancelMessage').addEventListener('click', closeModal);
  $('#messageForm').addEventListener('submit', event => {
    event.preventDefault();
    const subject = $('#messageSubject').value.trim();
    const body = $('#messageBody').value.trim();
    const channels = $$('input[name="channel"]:checked').map(input => input.value);
    if (!subject || !body) { toast('Enter both a subject and notice text before queuing the message.'); return; }
    if (!channels.length) { toast('Choose at least one delivery channel.'); return; }
    const message = { id: `MSG-${44 + messages.length}`, subject, audience: $('#messageAudience').value, channels, requestedBy: 'Dr. Vivek Range', state: 'queued', body };
    messages.unshift(message);
    renderMessages();
    audit('Queued student communication', `${message.id} · ${message.subject}`, 'Queued');
    closeModal();
    toast(`Notice queued for ${channels.join(', ')} delivery.`);
  });
}

function viewMessage(id) {
  const message = messages.find(item => item.id === id);
  if (!message) return;
  showModal(`<h2>${escapeHtml(message.subject)}</h2><p>${escapeHtml(message.audience)}</p><div class="review-details"><div><small>Message ID</small><strong>${message.id}</strong></div><div><small>Requested by</small><strong>${escapeHtml(message.requestedBy)}</strong></div><div><small>Channels</small><strong>${escapeHtml(message.channels.join(', '))}</strong></div><div><small>Status</small><strong>${formatState(message.state)}</strong></div></div>${message.body ? `<div class="message-preview">${escapeHtml(message.body)}</div>` : '<p class="form-note">The seeded demo notice does not retain a message body.</p>'}<div class="modal-actions"><button class="button primary" id="closeMessage">Close</button></div>`);
  $('#closeMessage').addEventListener('click', closeModal);
}

function renderReports() {
  $('#reportGrid').innerHTML = reports.map(([id, title, description, icon]) => `<button class="report-card" data-report-id="${id}"><span>${icon}</span><strong>${title}</strong><small>${description}</small><i>→</i></button>`).join('');
  $$('[data-report-id]').forEach(button => button.addEventListener('click', () => requestReport(button.dataset.reportId)));
}

function requestReport(id) {
  const report = reports.find(item => item[0] === id);
  if (!report) return;
  showModal(`<h2>${escapeHtml(report[1])}</h2><p>${escapeHtml(report[2])}</p><div class="report-request"><span>Scoped request</span><p>Filters, requesting actor and permission scope are captured before generation. Download access is rechecked when the job completes.</p></div><div class="modal-actions"><button class="button secondary" id="cancelReport">Cancel</button><button class="button primary" id="queueReport">Queue report</button></div>`);
  $('#cancelReport').addEventListener('click', closeModal);
  $('#queueReport').addEventListener('click', () => {
    audit('Requested report export', report[1], 'Queued');
    closeModal();
    toast(`${report[1]} was added to the export queue.`);
  });
}

function renderRoles() {
  $('#roleGrid').innerHTML = roleScopes.map(([role, scope, description]) => `<article><span>${escapeHtml(role)}</span><strong>${escapeHtml(scope)}</strong><p>${escapeHtml(description)}</p></article>`).join('');
}

function renderAudit() {
  const body = $('#auditTableBody');
  if (!body) return;
  body.innerHTML = auditEvents.slice(0, 8).map(event => `<tr><td>${escapeHtml(event.time)}</td><td>${escapeHtml(event.actor)}</td><td>${escapeHtml(event.action)}</td><td>${escapeHtml(event.record)}</td><td><span class="status-pill ${statusClass(event.outcome)}">${escapeHtml(event.outcome)}</span></td></tr>`).join('');
}

function csvDownload(filename, headers, rows) {
  const csv = [headers, ...rows].map(row => row.map(item => `"${String(item).replaceAll('"', '""')}"`).join(',')).join('\n');
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(anchor.href);
}

function xlsxDownload(filename, sheetName, headers, rows) {
  if (!window.XLSX) { toast('The Excel library did not load. Refresh the page and try again.'); return; }
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet['!cols'] = headers.map((header, index) => ({ wch: Math.min(Math.max(String(header).length + 2, ...rows.slice(0, 100).map(row => String(row[index] ?? '').length + 2), 12), 28) }));
  worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: Math.max(headers.length - 1, 0) } }) };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
  XLSX.writeFile(workbook, filename, { compression: true });
}

function csvExport() {
  const list = filteredStudents();
  xlsxDownload('gcw-karnal-student-directory.xlsx', 'Students', STUDENT_IMPORT_HEADERS, list.map(student => [student.name, studentRollNo(student), student.program, student.semester, student.email || '', student.mobile || '', student.attendance, student.cgpa ?? '', student.status]));
  audit('Exported student directory', `${list.length} visible record${list.length === 1 ? '' : 's'}`, 'Queued');
  toast('Visible student-directory rows exported as Excel.');
}

function exportAudit() {
  xlsxDownload('gcw-karnal-demo-audit-history.xlsx', 'Audit history', ['Time', 'Actor', 'Action', 'Record', 'Outcome'], auditEvents.map(event => [event.time, event.actor, event.action, event.record, event.outcome]));
  toast('Demo audit activity exported as Excel.');
}

function exportCurrentProfile() {
  const student = selectedStudent;
  xlsxDownload(`${studentRollNo(student)}-student-record.xlsx`, 'Student record', STUDENT_IMPORT_HEADERS, [[student.name, studentRollNo(student), student.program, student.semester, student.email || '', student.mobile || '', student.attendance, student.cgpa ?? '', student.status]]);
  audit('Exported student record', `${student.id} · ${student.name}`, 'Exported');
  toast(`${student.name}'s record was exported as Excel.`);
}

function editProfileModal() {
  const student = selectedStudent;
  const programOptions = Array.from(new Set(['BCA', 'B.Com', 'BBA', 'BA', student.program])).map(value => `<option ${value === student.program ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('');
  const semesterOptions = Array.from({ length: 6 }, (_, index) => `Semester ${index + 1}`).map(value => `<option ${value === student.semester ? 'selected' : ''}>${value}</option>`).join('');
  showModal(`<h2>Edit student profile</h2><p>Update the current student directory record.</p><form id="editProfileForm"><div class="field-grid"><label>Student name<input required id="editStudentName" value="${escapeHtml(student.name)}" maxlength="120" /></label><label>Roll no.<input value="${escapeHtml(studentRollNo(student))}" disabled /></label><label>Program<select id="editStudentProgram">${programOptions}</select></label><label>Semester<select id="editStudentSemester">${semesterOptions}</select></label><label>Section<input required id="editStudentSection" value="${escapeHtml(student.section)}" maxlength="10" /></label><label>College email<input id="editStudentEmail" value="${escapeHtml(student.email || '')}" maxlength="160" /></label></div><div class="modal-actions"><button type="button" class="button secondary" id="cancelProfileEdit">Cancel</button><button class="button primary">Save changes</button></div></form>`);
  $('#cancelProfileEdit').addEventListener('click', closeModal);
  $('#editProfileForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#editStudentName').value.trim();
    const section = $('#editStudentSection').value.trim();
    const email = $('#editStudentEmail').value.trim();
    if (!name || !section) { toast('Student name and section are required.'); return; }
    if (email && !email.includes('@')) { toast('Enter a valid college email address.'); return; }
    Object.assign(student, { name, initials: initialsFor(name), program: $('#editStudentProgram').value, semester: $('#editStudentSemester').value, section: section.toUpperCase(), email });
    if (student.local) persistStudents();
    renderStudents();
    openStudent(student.id);
    audit('Updated student profile', `${student.id} · ${student.name}`, 'Updated');
    closeModal();
    toast('Student profile updated.');
  });
}

function profileMoreModal() {
  showModal(`<h2>Student record actions</h2><p>Choose an action for ${escapeHtml(selectedStudent.name)}.</p><div class="quick-list"><button id="moreExportProfile">Export current record</button><button id="moreOpenAudit">Open audit history</button></div><div class="modal-actions"><button class="button secondary" id="closeProfileMore">Close</button></div>`);
  $('#moreExportProfile').addEventListener('click', () => { exportCurrentProfile(); closeModal(); });
  $('#moreOpenAudit').addEventListener('click', () => { closeModal(); switchView('administration'); $('#auditTableBody').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#closeProfileMore').addEventListener('click', closeModal);
}

function addAchievementModal() {
  showModal(`<h2>Add achievement</h2><p>Record a verified achievement for ${escapeHtml(selectedStudent.name)}.</p><form id="achievementForm"><label>Achievement title<input required id="achievementTitle" maxlength="160" placeholder="e.g. Inter-college coding competition" /></label><label>Details<input required id="achievementDetails" maxlength="180" placeholder="e.g. 2nd place · University event" /></label><div class="modal-actions"><button type="button" class="button secondary" id="cancelAchievement">Cancel</button><button class="button primary">Add achievement</button></div></form>`);
  $('#cancelAchievement').addEventListener('click', closeModal);
  $('#achievementForm').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('#achievementTitle').value.trim();
    const details = $('#achievementDetails').value.trim();
    if (!title || !details) { toast('Enter both achievement title and details.'); return; }
    $('#achievementList').insertAdjacentHTML('afterbegin', `<div class="achievement-card"><span class="achievement-badge">★</span><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(details)}</p><small>Recorded today · Pending verification</small></div><span class="status-pill amber">Pending</span></div>`);
    audit('Added student achievement', `${selectedStudent.id} · ${title}`, 'Pending review');
    closeModal();
    toast('Achievement added for verification.');
  });
}

function addRemarkModal() {
  showModal(`<h2>Add teacher remark</h2><p>Add an academic observation to ${escapeHtml(selectedStudent.name)}'s record.</p><form id="remarkForm"><label>Remark<textarea required id="remarkText" maxlength="600" placeholder="Write an academic or mentoring observation."></textarea></label><div class="modal-actions"><button type="button" class="button secondary" id="cancelRemark">Cancel</button><button class="button primary">Add remark</button></div></form>`);
  $('#cancelRemark').addEventListener('click', closeModal);
  $('#remarkForm').addEventListener('submit', event => {
    event.preventDefault();
    const remark = $('#remarkText').value.trim();
    if (!remark) { toast('Enter a remark before saving.'); return; }
    $('#remarksList').insertAdjacentHTML('afterbegin', `<div class="remark"><div class="avatar small-avatar">VR</div><div><strong>Dr. Vivek Range <span>· Principal</span></strong><p>${escapeHtml(remark)}</p><small>Today · Visible to HOD and Principal</small></div></div>`);
    audit('Added teacher remark', selectedStudent.id, 'Recorded');
    closeModal();
    toast('Teacher remark added.');
  });
}

function exportAttendanceReport() {
  const rows = students.map(student => [student.name, studentRollNo(student), student.program, student.semester, student.attendance]);
  xlsxDownload('gcw-karnal-attendance-report.xlsx', 'Attendance', ['Student Name', 'Roll No', 'Program', 'Semester', 'Attendance %'], rows);
  audit('Exported attendance report', `${rows.length} directory records`, 'Exported');
  toast('Attendance report exported as Excel.');
}

function exportMonthlyAttendance() {
  xlsxDownload(`${studentRollNo(selectedStudent)}-attendance.xlsx`, 'Attendance', ['Subject', 'Attendance %'], [['Data Structures', 91], ['Database Management', 86], ['Web Technologies', 89], ['Computer Networks', 76]]);
  toast('Monthly attendance report exported as Excel.');
}

function exportFacultyReport() {
  const rows = [...document.querySelectorAll('.faculty-table tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.innerText.replace(/\s+/g, ' ').trim()));
  xlsxDownload('gcw-karnal-faculty-workload.xlsx', 'Faculty workload', ['Faculty member', 'Department', 'Assigned classes', 'Attendance', 'Assessment', 'Student remarks', 'Status'], rows);
  toast('Faculty workload exported as Excel.');
}

function addFacultyModal() {
  showModal(`<h2>Add faculty member</h2><p>Create a faculty-directory entry for this demo workspace.</p><form id="facultyForm"><div class="field-grid"><label>Faculty name<input required id="facultyName" maxlength="120" placeholder="e.g. Prof. N. Verma" /></label><label>Department<select id="facultyDepartment"><option>BCA</option><option>B.Com</option><option>BBA</option><option>BA</option></select></label><label>Assigned classes<input required id="facultyClasses" type="number" min="0" max="20" value="1" /></label><label>Status<select id="facultyStatus"><option>Complete</option><option>In progress</option><option>Pending</option></select></label></div><div class="modal-actions"><button type="button" class="button secondary" id="cancelFaculty">Cancel</button><button class="button primary">Add faculty</button></div></form>`);
  $('#cancelFaculty').addEventListener('click', closeModal);
  $('#facultyForm').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('#facultyName').value.trim();
    if (!name) { toast('Enter the faculty member name.'); return; }
    const status = $('#facultyStatus').value;
    const statusClassName = status === 'Complete' ? 'green' : status === 'Pending' ? 'amber' : 'amber';
    document.querySelector('.faculty-table tbody').insertAdjacentHTML('afterbegin', `<tr><td><div class="user-cell"><span class="avatar small-avatar blue-avatar">${escapeHtml(initialsFor(name))}</span><span><strong>${escapeHtml(name)}</strong><small>EMP-${100 + document.querySelectorAll('.faculty-table tbody tr').length}</small></span></div></td><td>${escapeHtml($('#facultyDepartment').value)}</td><td>${escapeHtml($('#facultyClasses').value)}</td><td><span class="completion">0%</span></td><td><span class="completion">0%</span></td><td><span class="completion">0%</span></td><td><span class="status-pill ${statusClassName}">${escapeHtml(status)}</span></td></tr>`);
    audit('Added faculty directory record', name, 'Recorded');
    closeModal();
    toast('Faculty member added to the workload list.');
  });
}

const PROFILE_TAB_DETAILS = {
  assessments: ['Assessment record', 'No assessment entries have been added for this student yet.'],
  results: ['Result record', 'No additional result revisions have been added for this student yet.'],
  dmc: ['DMC record', 'No additional DMC entries have been added for this student yet.']
};

function ensureProfileTab(tabName) {
  let panel = document.querySelector(`[data-tab-panel="${tabName}"]`);
  if (panel) return panel;
  const [title, description] = PROFILE_TAB_DETAILS[tabName] || [`${tabName} record`, 'No entries are available yet.'];
  panel = document.createElement('div');
  panel.className = 'profile-tab';
  panel.dataset.tabPanel = tabName;
  panel.innerHTML = `<article class="panel"><div class="empty-state"><span>＋</span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p><button class="button primary" data-empty-profile-action="${escapeHtml(tabName)}">Add entry</button></div></article>`;
  $('#profileTabs').insertAdjacentElement('afterend', panel);
  panel.querySelector('[data-empty-profile-action]').addEventListener('click', () => addProfileEntryModal(tabName, panel));
  return panel;
}

function addProfileEntryModal(tabName, panel) {
  const [title] = PROFILE_TAB_DETAILS[tabName] || [`${tabName} record`];
  showModal(`<h2>Add ${escapeHtml(title.toLowerCase())}</h2><p>Add a short entry for ${escapeHtml(selectedStudent.name)}.</p><form id="profileEntryForm"><label>Entry details<textarea required id="profileEntryText" maxlength="600" placeholder="Enter the record details."></textarea></label><div class="modal-actions"><button type="button" class="button secondary" id="cancelProfileEntry">Cancel</button><button class="button primary">Save entry</button></div></form>`);
  $('#cancelProfileEntry').addEventListener('click', closeModal);
  $('#profileEntryForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = $('#profileEntryText').value.trim();
    if (!text) { toast('Enter record details before saving.'); return; }
    panel.innerHTML = `<article class="panel record-summary"><div class="panel-header"><div><h2>${escapeHtml(title)}</h2><p>Student record entry</p></div><button class="button primary" data-empty-profile-action="${escapeHtml(tabName)}">Add another</button></div><div class="record-grid"><div><small>Recorded for</small><strong>${escapeHtml(selectedStudent.name)}</strong></div><div><small>Status</small><strong>Recorded</strong></div></div><p class="profile-entry-note">${escapeHtml(text)}</p></article>`;
    panel.querySelector('[data-empty-profile-action]').addEventListener('click', () => addProfileEntryModal(tabName, panel));
    audit(`Added ${title.toLowerCase()}`, selectedStudent.id, 'Recorded');
    closeModal();
    toast('Student record entry added.');
  });
}

function activateProfileTab(tab) {
  const panel = ensureProfileTab(tab.dataset.tab);
  $$('#profileTabs button').forEach(item => item.classList.toggle('active', item === tab));
  $$('.profile-tab').forEach(item => item.classList.toggle('active', item === panel));
}

function init() {
  renderDepartments(); renderWork(); renderStudents(); renderAssessments(); renderDocuments(); renderMessages(); renderReports(); renderRoles(); renderAudit(); renderAdminProfile(); loadAdminProfile();
  $$('.nav-link').forEach(link => link.addEventListener('click', () => switchView(link.dataset.view)));
  $$('[data-go]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.go)));
  $('#backToStudents').addEventListener('click', () => switchView('students'));
  $('#menuToggle').addEventListener('click', () => $('#sidebar').classList.add('open'));
  $('#sidebarClose').addEventListener('click', () => $('#sidebar').classList.remove('open'));
  $('#notificationButton').addEventListener('click', () => $('#notificationsPopover').classList.toggle('open'));
  $('#profileButton').addEventListener('click', accountMenuModal);
  $('#adminSettingsForm').addEventListener('submit', saveAdminProfile);
  $('#adminSettingsPhoto').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 750 * 1024) {
      event.target.value = '';
      toast('Choose a PNG, JPG, or WebP photo smaller than 750 KB.');
      return;
    }
    try {
      pendingAdminPhoto = await readProfilePhoto(file);
      [$('#sidebarAdminAvatar'), $('#topbarAdminAvatar'), $('#settingsAdminAvatar')].forEach(node => renderAdminAvatar(node, pendingAdminPhoto));
      $('#removeAdminPhoto').hidden = false;
    } catch (error) {
      event.target.value = '';
      toast(error.message || 'The selected photo could not be read.');
    }
  });
  $('#removeAdminPhoto').addEventListener('click', () => {
    pendingAdminPhoto = '';
    $('#adminSettingsPhoto').value = '';
    [$('#sidebarAdminAvatar'), $('#topbarAdminAvatar'), $('#settingsAdminAvatar')].forEach(node => renderAdminAvatar(node, ''));
    $('#removeAdminPhoto').hidden = true;
  });
  $('#markAllNotificationsRead').addEventListener('click', () => {
    $('#notificationButton i').style.display = 'none';
    $('#notificationsPopover').classList.remove('open');
    toast('Notifications marked as read.');
  });
  $('#quickAction').addEventListener('click', quickActions);
  $('#addStudentButton').addEventListener('click', addStudentModal);
  $('#importStudentsButton').addEventListener('click', studentExcelImportModal);
  $('#markAttendanceButton').addEventListener('click', attendanceModal);
  $('#createAssessmentButton').addEventListener('click', assessmentModal);
  $('#uploadDocumentButton').addEventListener('click', uploadDocumentModal);
  $('#documentFilterButton').addEventListener('click', () => { pendingDocumentsOnly = !pendingDocumentsOnly; renderDocuments(); });
  $('#composeMessageButton').addEventListener('click', composeMessageModal);
  $('#messageFilterButton').addEventListener('click', () => { showQueuedMessagesOnly = !showQueuedMessagesOnly; renderMessages(); });
  $('#exportStudents').addEventListener('click', csvExport);
  $('#exportAuditButton').addEventListener('click', exportAudit);
  $('#assessmentFilter').addEventListener('click', () => toast('Showing the current academic term.'));
  $$('.import-option').forEach(button => button.addEventListener('click', () => importSheetModal(button.dataset.importType)));
  $$('.admin-grid [data-admin-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.adminAction;
    if (action === 'audit') $('#auditTableBody').scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (action === 'roles') $('#roleGrid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    else toast('Configuration changes require a named Super Admin and recent re-authentication.');
  }));
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
  $('#studentSearch').addEventListener('input', event => { filters.query = event.target.value; renderStudents(); });
  $('#departmentFilter').addEventListener('change', event => { filters.program = event.target.value; renderStudents(); });
  $('#semesterFilter').addEventListener('change', event => { filters.semester = event.target.value; renderStudents(); });
  $('#resetStudentFilters').addEventListener('click', () => { filters = { query: '', program: 'all', semester: 'all' }; $('#studentSearch').value = ''; $('#departmentFilter').value = 'all'; $('#semesterFilter').value = 'all'; renderStudents(); });
  $('#globalSearch').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.value.trim()) { filters.query = event.target.value; $('#studentSearch').value = filters.query; switchView('students'); renderStudents(); } });
  window.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#globalSearch').focus(); } if (event.key === 'Escape') { closeModal(); $('#notificationsPopover').classList.remove('open'); } });
  $$('#profileTabs button').forEach(tab => tab.addEventListener('click', () => activateProfileTab(tab)));
  $$('.low-list button').forEach(button => button.addEventListener('click', () => { const student = students.find(item => item.name === button.dataset.student); if (student) openStudent(student.id); else toast('This student is not present in the prototype directory.'); }));
  $('#editProfile').addEventListener('click', editProfileModal);
  $('#profileMoreButton').addEventListener('click', profileMoreModal);
  $('#exportProfileRecord').addEventListener('click', exportCurrentProfile);
  $('#exportMonthlyAttendance').addEventListener('click', exportMonthlyAttendance);
  $('#addAchievementButton').addEventListener('click', addAchievementModal);
  $('#uploadProfileDocument').addEventListener('click', () => uploadDocumentModal(selectedStudent.id));
  $$('.document-tile').forEach(button => button.addEventListener('click', () => {
    const title = button.dataset.profileDocument;
    showModal(`<h2>${escapeHtml(title)}</h2><p>This document is registered in ${escapeHtml(selectedStudent.name)}'s academic file.</p><div class="review-details"><div><small>Access</small><strong>Authorized academic roles</strong></div><div><small>Status</small><strong>Verified</strong></div></div><div class="modal-actions"><button class="button primary" id="closeProfileDocument">Close</button></div>`);
    $('#closeProfileDocument').addEventListener('click', closeModal);
  }));
  $('#addRemarkButton').addEventListener('click', addRemarkModal);
  $('#exportAttendanceReport').addEventListener('click', exportAttendanceReport);
  $('#exportFacultyReport').addEventListener('click', exportFacultyReport);
  $('#addFacultyButton').addEventListener('click', addFacultyModal);
  $('#sessionButton').addEventListener('click', () => toast('Academic session: 2025–26 (active).'));
  $('#viewFacultyWorkload').addEventListener('click', () => {
    showModal(`<h2>Faculty workload</h2><p>Review the current workload completion table, then use the Export button to download the visible data.</p><div class="modal-actions"><button class="button primary" id="closeFacultyWorkload">Close</button></div>`);
    $('#closeFacultyWorkload').addEventListener('click', closeModal);
  });
  $('#facultyDepartmentButton').addEventListener('click', event => {
    const choices = ['All departments', 'BCA', 'B.Com', 'BBA', 'BA'];
    const current = choices.indexOf(event.currentTarget.childNodes[0].textContent.trim());
    const next = choices[(current + 1) % choices.length];
    event.currentTarget.childNodes[0].textContent = `${next} `;
    toast(`Faculty workload filter: ${next}.`);
  });
  const timelineButton = document.querySelector('.timeline-panel .link-button');
  if (timelineButton) timelineButton.addEventListener('click', () => activateProfileTab(document.querySelector('[data-tab="academics"]')));
  const dashboardPeriodButton = document.querySelector('.chart-panel .select-button');
  if (dashboardPeriodButton) dashboardPeriodButton.addEventListener('click', event => { event.currentTarget.innerHTML = event.currentTarget.textContent.includes('This semester') ? 'Previous semester <span>⌄</span>' : 'This semester <span>⌄</span>'; });
  $$('#attendanceView .select-button').forEach(button => button.addEventListener('click', event => { event.currentTarget.innerHTML = event.currentTarget.textContent.includes('Monthly') ? 'Weekly <span>⌄</span>' : 'Monthly <span>⌄</span>'; }));
  $$('.table-footer button:not([disabled])').forEach(button => button.addEventListener('click', () => toast('All loaded student records are shown on this page.')));
}

init();
