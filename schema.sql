-- Government College for Women, Karnal Academic Office: normalized reference schema
-- Target: PostgreSQL 15+ (UUID, timestamptz, JSONB and row-level security ready)
-- Run migrations through the application's migration system; do not apply manually to production.

CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE roles (
  id UUID PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  resource VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  UNIQUE (resource, action)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES roles(id),
  department_id UUID REFERENCES departments(id), -- NULL only for college-wide roles
  employee_id VARCHAR(40) UNIQUE,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(180) NOT NULL,
  mobile VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','locked')),
  password_changed_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE academic_sessions (
  id UUID PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE, -- e.g. 2025-26
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL CHECK (ends_on > starts_on),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_active_session ON academic_sessions (is_active) WHERE is_active;

CREATE TABLE programs (
  id UUID PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES departments(id),
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('UG','PG','DIPLOMA','OTHER')),
  duration_semesters SMALLINT NOT NULL CHECK (duration_semesters BETWEEN 1 AND 12),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE sections (
  id UUID PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id),
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 12),
  code VARCHAR(20) NOT NULL,
  capacity SMALLINT CHECK (capacity > 0),
  UNIQUE (program_id, academic_session_id, semester_no, code)
);

CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  subject_type VARCHAR(20) NOT NULL CHECK (subject_type IN ('theory','practical','tutorial','project','other')),
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE program_subjects (
  id UUID PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES programs(id),
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 12),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  credits NUMERIC(4,1) NOT NULL CHECK (credits >= 0),
  maximum_internal NUMERIC(6,2) NOT NULL CHECK (maximum_internal >= 0),
  maximum_external NUMERIC(6,2) NOT NULL CHECK (maximum_external >= 0),
  maximum_practical NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (maximum_practical >= 0),
  UNIQUE (program_id, academic_session_id, semester_no, subject_id)
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  student_number VARCHAR(40) NOT NULL UNIQUE,
  enrollment_number VARCHAR(80) UNIQUE,
  roll_number VARCHAR(80),
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80),
  father_name VARCHAR(160),
  mother_name VARCHAR(160),
  date_of_birth DATE,
  gender VARCHAR(30),
  category VARCHAR(60),
  national_id_reference VARCHAR(100), -- encrypt/tokenize in the application, never expose in audit payloads
  blood_group VARCHAR(10),
  mobile VARCHAR(30),
  email CITEXT,
  address_line TEXT,
  city VARCHAR(80), district VARCHAR(80), state VARCHAR(80), pin_code VARCHAR(20),
  emergency_contact VARCHAR(30),
  lifecycle_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('active','graduated','left','transferred','alumni')),
  photo_document_id UUID,
  signature_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE admissions (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL UNIQUE REFERENCES students(id),
  admission_number VARCHAR(80) NOT NULL UNIQUE,
  admission_date DATE NOT NULL,
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  initial_section_id UUID REFERENCES sections(id),
  semester_at_admission SMALLINT NOT NULL CHECK (semester_at_admission BETWEEN 1 AND 12),
  admission_category VARCHAR(80), funding_type VARCHAR(60),
  previous_qualification VARCHAR(160), previous_institution VARCHAR(180), previous_score NUMERIC(6,2),
  eligibility_status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (eligibility_status IN ('pending','eligible','ineligible')),
  remarks TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_semesters (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  section_id UUID REFERENCES sections(id),
  semester_no SMALLINT NOT NULL CHECK (semester_no BETWEEN 1 AND 12),
  sgpa NUMERIC(4,2) CHECK (sgpa BETWEEN 0 AND 10),
  cgpa NUMERIC(4,2) CHECK (cgpa BETWEEN 0 AND 10),
  percentage NUMERIC(5,2) CHECK (percentage BETWEEN 0 AND 100),
  backlog_count SMALLINT NOT NULL DEFAULT 0 CHECK (backlog_count >= 0),
  result VARCHAR(20) CHECK (result IN ('pass','fail','promoted','withheld','pending')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','verified','locked')),
  UNIQUE (student_id, academic_session_id, semester_no)
);

CREATE TABLE teacher_assignments (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id),
  program_subject_id UUID NOT NULL REFERENCES program_subjects(id),
  section_id UUID NOT NULL REFERENCES sections(id),
  periods_assigned SMALLINT NOT NULL DEFAULT 0 CHECK (periods_assigned >= 0),
  practical_periods SMALLINT NOT NULL DEFAULT 0 CHECK (practical_periods >= 0),
  tutorial_periods SMALLINT NOT NULL DEFAULT 0 CHECK (tutorial_periods >= 0),
  mentor_for_section BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (teacher_id, program_subject_id, section_id)
);

CREATE TABLE assessment_schemes (
  id UUID PRIMARY KEY,
  program_subject_id UUID NOT NULL REFERENCES program_subjects(id),
  name VARCHAR(100) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  UNIQUE (program_subject_id, name)
);

CREATE TABLE assessment_components (
  id UUID PRIMARY KEY,
  scheme_id UUID NOT NULL REFERENCES assessment_schemes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(30) NOT NULL,
  maximum_marks NUMERIC(6,2) NOT NULL CHECK (maximum_marks > 0),
  weight_percent NUMERIC(5,2) NOT NULL CHECK (weight_percent > 0 AND weight_percent <= 100),
  display_order SMALLINT NOT NULL,
  UNIQUE (scheme_id, code)
);

CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  program_subject_id UUID NOT NULL REFERENCES program_subjects(id),
  section_id UUID NOT NULL REFERENCES sections(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  scheme_id UUID REFERENCES assessment_schemes(id),
  title VARCHAR(160) NOT NULL,
  assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN ('class_test','assignment','quiz','practical','presentation','internal_exam','other')),
  held_on DATE NOT NULL,
  maximum_marks NUMERIC(6,2) NOT NULL CHECK (maximum_marks > 0),
  topic TEXT,
  workflow_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (workflow_status IN ('draft','submitted','verified','locked')),
  submitted_at TIMESTAMPTZ, verified_by UUID REFERENCES users(id), verified_at TIMESTAMPTZ
);

CREATE TABLE assessment_marks (
  id UUID PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  obtained_marks NUMERIC(6,2) CHECK (obtained_marks >= 0),
  is_absent BOOLEAN NOT NULL DEFAULT false,
  remarks TEXT,
  UNIQUE (assessment_id, student_id),
  CHECK ((is_absent AND obtained_marks IS NULL) OR (NOT is_absent AND obtained_marks IS NOT NULL))
);

CREATE TABLE attendance_sessions (
  id UUID PRIMARY KEY,
  teacher_assignment_id UUID NOT NULL REFERENCES teacher_assignments(id),
  attendance_date DATE NOT NULL,
  period_no SMALLINT NOT NULL CHECK (period_no > 0),
  workflow_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (workflow_status IN ('draft','submitted','verified','locked')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_assignment_id, attendance_date, period_no)
);

CREATE TABLE attendance_entries (
  attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  attendance_status VARCHAR(15) NOT NULL CHECK (attendance_status IN ('present','absent','late','excused')),
  remarks TEXT,
  PRIMARY KEY (attendance_session_id, student_id)
);

CREATE TABLE documents (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  category VARCHAR(60) NOT NULL,
  document_number VARCHAR(120),
  title VARCHAR(180) NOT NULL,
  storage_key TEXT NOT NULL UNIQUE, -- private object-store key; never return directly
  content_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  sha256 CHAR(64) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','correction_required')),
  verified_by UUID REFERENCES users(id), verified_at TIMESTAMPTZ, verification_remarks TEXT
);
CREATE UNIQUE INDEX distinct_certificate_number ON documents (document_number) WHERE category = 'certificate' AND document_number IS NOT NULL;

CREATE TABLE achievements (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  student_semester_id UUID REFERENCES student_semesters(id),
  title VARCHAR(180) NOT NULL,
  category VARCHAR(60) NOT NULL,
  level VARCHAR(80), position VARCHAR(80), event_name VARCHAR(180), organizing_institution VARCHAR(180),
  achieved_on DATE NOT NULL, description TEXT,
  certificate_document_id UUID REFERENCES documents(id), proof_document_id UUID REFERENCES documents(id),
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected','correction_required')),
  verified_by UUID REFERENCES users(id), verified_at TIMESTAMPTZ
);

CREATE TABLE dmc_records (
  id UUID PRIMARY KEY,
  student_semester_id UUID NOT NULL UNIQUE REFERENCES student_semesters(id),
  examination_session VARCHAR(40) NOT NULL,
  dmc_status VARCHAR(30) NOT NULL DEFAULT 'not_received' CHECK (dmc_status IN ('not_received','received','uploaded','verified','correction_required')),
  received_on DATE, dmc_number VARCHAR(120), document_id UUID REFERENCES documents(id),
  verified_by UUID REFERENCES users(id), verified_at TIMESTAMPTZ, remarks TEXT
);

CREATE TABLE transport_records (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  bus_required BOOLEAN NOT NULL DEFAULT false, pass_number VARCHAR(80), route VARCHAR(100), stop_name VARCHAR(100),
  issued_on DATE, expires_on DATE, renewed_on DATE, status VARCHAR(20) NOT NULL CHECK (status IN ('active','expired','applied','not_required','pending')),
  remarks TEXT, UNIQUE (student_id, academic_session_id)
);

CREATE TABLE teacher_remarks (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id),
  student_semester_id UUID REFERENCES student_semesters(id),
  teacher_id UUID NOT NULL REFERENCES users(id),
  subject_id UUID REFERENCES subjects(id),
  remark_type VARCHAR(40) NOT NULL, body TEXT NOT NULL,
  visibility VARCHAR(30) NOT NULL CHECK (visibility IN ('teacher_hod_principal','hod_principal','principal_only')),
  workflow_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (workflow_status IN ('draft','submitted','verified','locked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faculty_activities (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES users(id),
  academic_session_id UUID NOT NULL REFERENCES academic_sessions(id),
  activity_type VARCHAR(50) NOT NULL, title VARCHAR(180) NOT NULL, held_on DATE, description TEXT,
  evidence_document_id UUID REFERENCES documents(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(180) NOT NULL, body TEXT, action_url TEXT,
  read_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  actor_role_code VARCHAR(40),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  request_id UUID,
  ip_hash CHAR(64), -- hash, do not retain raw IP unless policy permits it
  user_agent TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id, occurred_at DESC);

-- Application invariants to enforce in service-layer transactions:
-- 1. Score writes verify `obtained_marks <= assessments.maximum_marks` and that student belongs to the session/section.
-- 2. A locked record is immutable; correction is a new revision/workflow event, not an UPDATE bypass.
-- 3. Every state-changing endpoint writes an audit_logs record in the same transaction.
-- 4. Role and department predicates are always applied server-side; UI hiding is never authorization.

-- Controlled imports and communications. The API creates a batch, validates every staging row,
-- then performs approved writes transactionally while recording the audit and outbox events.
CREATE TABLE import_batches (
  id UUID PRIMARY KEY,
  import_type VARCHAR(30) NOT NULL CHECK (import_type IN ('admission','result')),
  source_filename VARCHAR(255) NOT NULL,
  source_sha256 CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','validating','needs_review','approved','importing','completed','failed','cancelled')),
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  valid_rows INTEGER NOT NULL DEFAULT 0 CHECK (valid_rows >= 0),
  invalid_rows INTEGER NOT NULL DEFAULT 0 CHECK (invalid_rows >= 0),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CHECK ((status NOT IN ('approved','importing','completed')) OR approved_by IS NOT NULL)
);

CREATE TABLE import_rows (
  id UUID PRIMARY KEY,
  import_batch_id UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  raw_data JSONB NOT NULL,
  normalized_data JSONB,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  resolution_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending','valid','invalid','imported','skipped')),
  target_student_id UUID REFERENCES students(id),
  target_student_semester_id UUID REFERENCES student_semesters(id),
  imported_at TIMESTAMPTZ,
  UNIQUE (import_batch_id, row_number)
);
CREATE INDEX import_rows_batch_status_idx ON import_rows (import_batch_id, resolution_status, row_number);

CREATE TABLE communication_messages (
  id UUID PRIMARY KEY,
  created_by UUID NOT NULL REFERENCES users(id),
  subject VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  audience_rule JSONB NOT NULL, -- approved scoped filter snapshot, never a client-provided authority claim
  requested_channels JSONB NOT NULL CHECK (jsonb_typeof(requested_channels) = 'array'),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','processing','completed','cancelled','failed')),
  scheduled_for TIMESTAMPTZ,
  queued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE communication_deliveries (
  id UUID PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES communication_messages(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms','email','in_app')),
  destination_reference TEXT, -- encrypted/tokenized where policy requires; do not duplicate raw contacts unnecessarily
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','suppressed','queued','sent','delivered','failed')),
  provider_message_id VARCHAR(180),
  provider_response JSONB,
  attempted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failure_reason VARCHAR(240),
  UNIQUE (message_id, student_id, channel)
);
CREATE INDEX communication_deliveries_status_idx ON communication_deliveries (status, attempted_at);

CREATE TABLE outbox_events (
  id UUID PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  aggregate_type VARCHAR(80) NOT NULL,
  aggregate_id UUID NOT NULL,
  payload JSONB NOT NULL,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX outbox_events_ready_idx ON outbox_events (available_at) WHERE processed_at IS NULL;
