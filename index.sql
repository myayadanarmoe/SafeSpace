CREATE TABLE app_user (
    user_id           PRIMARY KEY,
    full_name         VARCHAR(150)      NOT NULL,
    email             VARCHAR(254)      UNIQUE NOT NULL,
    password_hash     TEXT              NOT NULL,
    role              VARCHAR(50)       NOT NULL,
    is_active         BOOLEAN           NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE TABLE patient (
    patient_id        PRIMARY KEY,
    name              VARCHAR(150)      NOT NULL,
    address           VARCHAR(300),
    phone             VARCHAR(40),
    dob               DATE,
    gender            VARCHAR(20),
    blood_group       VARCHAR(3),
    emergency_contact VARCHAR(150),
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patient_name ON patient (name);


CREATE TABLE therapist (
    therapistID      PRIMARY KEY,
    name              VARCHAR(150)      NOT NULL,
    field             VARCHAR(120),                                     -- specialty
    phone             VARCHAR(40),
    email             VARCHAR(254),
    notes             TEXT
);

-- Appointments

CREATE TABLE appointment (
    appointment_id    PRIMARY KEY,
    patient_id        BIGINT            NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
    user_id           BIGINT            REFERENCES app_user(user_id) ON DELETE SET NULL,  -- staff handling
    specialist_id     BIGINT            REFERENCES therapist(therapist_id) ON DELETE SET NULL,
    appt_date         DATE              NOT NULL,
    appt_time         TIME              NOT NULL,
    status            VARCHAR(30)       NOT NULL DEFAULT 'scheduled',  -- scheduled|completed|canceled|no_show
    reason            VARCHAR(300),
    notes             TEXT,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_appointment UNIQUE (patient_id, appt_date, appt_time)
);
CREATE INDEX idx_appt_patient ON appointment (patient_id, appt_date);
CREATE INDEX idx_appt_user ON appointment (user_id);


-- Medical records

CREATE TABLE medical_record (
    record_id         PRIMARY KEY,
    patient_id        BIGINT            NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
    appointment_id    BIGINT            REFERENCES appointment(appointment_id) ON DELETE SET NULL,
    visit_date        DATE              NOT NULL DEFAULT CURRENT_DATE,
    blood_pressure    VARCHAR(15),                                      -- e.g., '120/80'
    temperature_c     NUMERIC(4,1),                                     -- e.g., 37.5
    pulse_bpm         SMALLINT,
    respiration_rpm   SMALLINT,
    diagnosis         TEXT,
    notes             TEXT,
    created_by        BIGINT            REFERENCES app_user(user_id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_record_patient ON medical_record (patient_id, visit_date);


-- Problems / conditions

CREATE TABLE condition_problem (
    condition_id      BIGSERIAL PRIMARY KEY,
    medical_record_id BIGINT            NOT NULL REFERENCES medical_record(record_id) ON DELETE CASCADE,
    condition_name    VARCHAR(150)      NOT NULL,
    description       TEXT,
    status            VARCHAR(30)       DEFAULT 'active',               -- active|resolved|chronic
    onset_date        DATE,
    resolution_date   DATE
);
CREATE INDEX idx_condition_record ON condition_problem (medical_record_id);


-- Allergies (catalog + per-record links)

CREATE TABLE allergy (
    allergy_id        BIGSERIAL PRIMARY KEY,
    allergy_name      VARCHAR(150)      NOT NULL UNIQUE,
    synonyms          TEXT
);

-- Link table
CREATE TABLE medical_record_allergy (
    record_allergy_id BIGSERIAL PRIMARY KEY,
    medical_record_id BIGINT            NOT NULL REFERENCES medical_record(record_id) ON DELETE CASCADE,
    allergy_id        BIGINT            NOT NULL REFERENCES allergy(allergy_id) ON DELETE RESTRICT,
    reaction          VARCHAR(200),
    severity          VARCHAR(20),                                       -- mild|moderate|severe
    notes             TEXT,
    CONSTRAINT uq_record_allergy UNIQUE (medical_record_id, allergy_id)
);
CREATE INDEX idx_rec_allergy_record ON medical_record_allergy (medical_record_id);
CREATE INDEX idx_rec_allergy_allergy ON medical_record_allergy (allergy_id);


-- Medications & prescriptions

-- Catalog
CREATE TABLE medication (
    medication_id     BIGSERIAL PRIMARY KEY,
    generic_name      VARCHAR(150)      NOT NULL,
    brand_name        VARCHAR(150),
    form              VARCHAR(50),                                      -- tablet, capsule, syrup, etc.
    strength          VARCHAR(50),                                      -- '500 mg'
    atc_code          VARCHAR(20),                                      -- optional
    UNIQUE (generic_name, brand_name, strength, form)
);

-- Prescriptions issued out of a record/visit
CREATE TABLE prescription (
    prescription_id   BIGSERIAL PRIMARY KEY,
    medical_record_id BIGINT            NOT NULL REFERENCES medical_record(record_id) ON DELETE CASCADE,
    issued_at         DATE              NOT NULL DEFAULT CURRENT_DATE,
    prescriber_id     BIGINT            REFERENCES app_user(user_id) ON DELETE SET NULL,
    notes             TEXT
);
CREATE INDEX idx_prescription_record ON prescription (medical_record_id);

-- Items within a prescription
CREATE TABLE prescription_medication (
    prescription_medication_id BIGSERIAL PRIMARY KEY,
    prescription_id   BIGINT            NOT NULL REFERENCES prescription(prescription_id) ON DELETE CASCADE,
    medication_id     BIGINT            NOT NULL REFERENCES medication(medication_id) ON DELETE RESTRICT,
    dosage            VARCHAR(120)      NOT NULL,                       -- e.g., '500 mg'
    frequency         VARCHAR(120)      NOT NULL,                       -- e.g., '1 tablet twice daily'
    route             VARCHAR(60),                                     -- oral, IM, IV, etc.
    duration_days     SMALLINT,
    instructions      TEXT
);
CREATE INDEX idx_presc_item_presc ON prescription_medication (prescription_id);
CREATE INDEX idx_presc_item_med   ON prescription_medication (medication_id);


-- Optional: medications administered during the encounter (not necessarily prescribed)

CREATE TABLE medical_record_medication (
    record_medication_id BIGSERIAL PRIMARY KEY,
    medical_record_id BIGINT            NOT NULL REFERENCES medical_record(record_id) ON DELETE CASCADE,
    medication_id     BIGINT            NOT NULL REFERENCES medication(medication_id) ON DELETE RESTRICT,
    indication        VARCHAR(200),
    administered      BOOLEAN           NOT NULL DEFAULT FALSE,
    notes             TEXT
);
CREATE INDEX idx_record_med_record ON medical_record_medication (medical_record_id);

