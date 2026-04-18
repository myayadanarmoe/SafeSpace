# Installation Guidelines

## Step 1: Install Node.js
- Download from: https://nodejs.org/
- Choose LTS version (20.x or higher)
- Run installer (check "Add to PATH")
- Verify: `node --version` and `npm --version`

## Step 2: Install MySQL Database
- Download: https://dev.mysql.com/downloads/installer/
- Choose "Developer Default"
- Set root password

## Step 3: Install Git
- Download: https://git-scm.com/
- For cloning the repository

## Step 4: Clone or Download Project
```bash
git clone https://github.com/myayadanarmoe/SafeSpace.git
cd safespace
```

## Step 5: Install Dependencies
```bash
npm install express
npm install bcrypt
npm install jsonwebtoken
npm install mysql2
npm install multer
npm install dotenv
npm install cors
npm install nodemon
npm install react
npm install react-router-dom
npm install axios
```

## Step 6: Creating Database and tables
> **Note:** Open MySQL command line client, enter your password and run these.

```sql
-- Database setup
CREATE DATABASE safespace;
USE safespace;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(500) UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_pic VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    type ENUM('Standard User','Premium User','Youth User','Staff','Admin','Psychiatrist','Psychologist','Therapist') NOT NULL DEFAULT 'Standard User'
);

-- Patients table
CREATE TABLE patients (
    patient_id INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    date_of_birth DATE,
    gender VARCHAR(10),
    address VARCHAR(100),
    phNo VARCHAR(20),
    emergencyContact VARCHAR(100),
    FOREIGN KEY (userID) REFERENCES users(id)
);

-- Branches table
CREATE TABLE branches (
    branch_id INT PRIMARY KEY AUTO_INCREMENT,
    city VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    mobile VARCHAR(20),
    email VARCHAR(100),
    hours TEXT,
    parking TEXT,
    public_transport TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clinicians table
CREATE TABLE clinicians (
    clinicianID INT PRIMARY KEY AUTO_INCREMENT,
    licenseNumber VARCHAR(50),
    phone VARCHAR(20),
    address VARCHAR(255),
    userID INT,
    primary_branch_id INT,
    about TEXT,
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (primary_branch_id) REFERENCES branches(branch_id)
);

-- Clinician Availability
CREATE TABLE clinicianavailability (
    availabilityID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT,
    day_of_the_week VARCHAR(20),
    startTime TIME,
    endTime TIME,
    FOREIGN KEY (userID) REFERENCES users(id)
);

-- Rooms table
CREATE TABLE rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    branch_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    room_type ENUM('consultation','therapy','group','conference') NOT NULL DEFAULT 'consultation',
    capacity INT DEFAULT 1,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
);

-- Appointments table
CREATE TABLE appointments (
    appointmentID INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    clinicianID INT,
    scheduled_date DATE,
    scheduled_time TIME,
    appointment_type ENUM('online','offline') DEFAULT 'offline',
    status ENUM('scheduled','completed','cancelled','no-show') NOT NULL DEFAULT 'scheduled',
    meeting_link VARCHAR(255),
    token_number VARCHAR(50),
    room_id INT,
    rescheduled_from DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (clinicianID) REFERENCES clinicians(clinicianID),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);

-- Medical Record table
CREATE TABLE medicalrecord (
    recordID INT PRIMARY KEY AUTO_INCREMENT,
    appointmentID INT,
    patientID INT,
    clinicianID INT,
    symptoms VARCHAR(255),
    date DATE,
    riskAssessment ENUM('Low','Moderate','High'),
    treatmentPlan VARCHAR(255),
    FOREIGN KEY (appointmentID) REFERENCES appointments(appointmentID),
    FOREIGN KEY (patientID) REFERENCES patients(patient_id),
    FOREIGN KEY (clinicianID) REFERENCES clinicians(clinicianID)
);

-- Diagnosis table
CREATE TABLE diagnosis (
    diagnosisID INT PRIMARY KEY AUTO_INCREMENT,
    diagnosisName VARCHAR(100)
);

-- Medical Record Diagnosis (junction)
CREATE TABLE medicalrecorddiagnosis (
    medicalRecordID INT,
    diagnosisID INT,
    PRIMARY KEY (medicalRecordID, diagnosisID),
    FOREIGN KEY (medicalRecordID) REFERENCES medicalrecord(recordID),
    FOREIGN KEY (diagnosisID) REFERENCES diagnosis(diagnosisID)
);

-- Medication table
CREATE TABLE medication (
    medicationID INT PRIMARY KEY AUTO_INCREMENT,
    medicationName VARCHAR(100),
    dosageForm VARCHAR(50),
    standardDose VARCHAR(20)
);

-- Medical Record Medication (junction)
CREATE TABLE medicalrecordmedication (
    medicalRecordID INT,
    medicationID INT,
    frequency VARCHAR(50),
    prescribed_dose VARCHAR(50),
    duration VARCHAR(50),
    PRIMARY KEY (medicalRecordID, medicationID),
    FOREIGN KEY (medicalRecordID) REFERENCES medicalrecord(recordID),
    FOREIGN KEY (medicationID) REFERENCES medication(medicationID)
);

-- Mood table
CREATE TABLE mood (
    moodID INT PRIMARY KEY AUTO_INCREMENT,
    moodName VARCHAR(50)
);

-- Medical Record Mood (junction)
CREATE TABLE medicalrecordmood (
    medicalRecordID INT,
    moodID INT,
    PRIMARY KEY (medicalRecordID, moodID),
    FOREIGN KEY (medicalRecordID) REFERENCES medicalrecord(recordID),
    FOREIGN KEY (moodID) REFERENCES mood(moodID)
);

-- Therapy table
CREATE TABLE therapy (
    therapyID INT PRIMARY KEY AUTO_INCREMENT,
    therapyName VARCHAR(100)
);

-- Medical Record Therapy (junction)
CREATE TABLE medicalrecordtherapy (
    medicalRecordID INT,
    therapyID INT,
    PRIMARY KEY (medicalRecordID, therapyID),
    FOREIGN KEY (medicalRecordID) REFERENCES medicalrecord(recordID),
    FOREIGN KEY (therapyID) REFERENCES therapy(therapyID)
);

-- Payments table
CREATE TABLE payments (
    paymentID INT PRIMARY KEY AUTO_INCREMENT,
    userID INT NOT NULL,
    appointmentID INT,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    plan_type ENUM('premium','youth','pay_per_session','additional_session') NOT NULL,
    payment_method ENUM('card','bank_transfer','mobile_payment','cash') DEFAULT 'card',
    transaction_id VARCHAR(100) UNIQUE,
    card_last4 VARCHAR(4),
    status ENUM('pending','completed','failed','refunded','cancelled') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (appointmentID) REFERENCES appointments(appointmentID)
);

-- Monthly Appointment Limits table
CREATE TABLE monthly_appointment_limits (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userID INT NOT NULL,
    month_year DATE NOT NULL,
    appointments_used INT DEFAULT 0,
    max_allowed INT DEFAULT 2,
    free_used INT DEFAULT 0,
    paid_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userID) REFERENCES users(id)
);

-- Youth Verifications table
CREATE TABLE youth_verifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    userID INT NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    dateOfBirth DATE NOT NULL,
    idType ENUM('student','nrc','passport') DEFAULT 'student',
    idNumber VARCHAR(100) NOT NULL,
    school VARCHAR(200),
    grade VARCHAR(50),
    parentName VARCHAR(100),
    parentPhone VARCHAR(20),
    parentEmail VARCHAR(100),
    studentIdImage VARCHAR(500),
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INT,
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- User Diagnosis (junction for pre-existing conditions)
CREATE TABLE user_diagnosis (
    userID INT,
    diagnosisID INT,
    PRIMARY KEY (userID, diagnosisID),
    FOREIGN KEY (userID) REFERENCES users(id),
    FOREIGN KEY (diagnosisID) REFERENCES diagnosis(diagnosisID)
);

-- Allergies table
CREATE TABLE allergy (
    allergyID INT PRIMARY KEY AUTO_INCREMENT,
    allergyName VARCHAR(100) UNIQUE NOT NULL
);
```

## Step 7: Creating Admin Account
> Go to signup page, create admin account. Then, run this command in MySQL
``` sql
-- Changing the role
UPDATE users 
SET type = 'Admin' 
WHERE id = 1;
```

## Step 8: Adding basic information

```sql
-- Allergy
INSERT INTO allergy (allergyID, allergyName) VALUES
(1, 'Latex'),
(2, 'Penicillin'),
(3, 'Sulfa Drugs'),
(4, 'Codeine'),
(5, 'SSRI - Sertraline'),
(6, 'SSRI - Fluoxetine'),
(7, 'Benzodiazepines'),
(8, 'Pollen'),
(9, 'Dust Mites'),
(10, 'Peanuts'),
(11, 'Shellfish'),
(12, 'Gluten');

-- Branches
INSERT INTO branches (branch_id, city, location, address, phone, mobile, email, hours, parking, public_transport, latitude, longitude, is_active) VALUES
(1, 'Yangon', 'Downtown', 'No. 123, Sule Pagoda Road, Kyauktada Township', '01-234-567', '09-123-456-789', 'yangon.downtown@safespace.com', 'Mon-Fri: 9:00 AM - 8:00 PM, Sat: 10:00 AM - 4:00 PM', 'Paid parking available', 'Near Sule Pagoda Bus Stop', 16.77450000, 96.15870000, 1),
(2, 'Yangon', 'Hlaing', 'No. 45, Inya Road, Hlaing Township', '01-876-5432', '09-987-654-321', 'yangon.hlaing@safespace.com', 'Mon-Fri: 8:00 AM - 9:00 PM, Sat: 9:00 AM - 5:00 PM', 'Free parking available', 'Near Hlaing Bus Stop', 16.82310000, 96.13420000, 1),
(3, 'Mandalay', 'Central', 'No. 78, 35th Street, Chanayethazan Township', '01-345-678', '09-555-123-456', 'mandalay@safespace.com', 'Mon-Fri: 9:00 AM - 7:00 PM, Sat: 9:00 AM - 3:00 PM', 'Street parking available', 'Near Mandalay Bus Terminal', 21.97560000, 96.08390000, 1),
(4, 'Naypyidaw', 'South Oakkar', 'No. 10, Hotel Zone, Dekhina Thiri Township', '01-657-123', '09-777-888-999', 'naypyidaw@safespace.com', 'Mon-Fri: 9:00 AM - 6:00 PM, Sat: 10:00 AM - 2:00 PM', 'Free parking available', 'Near Naypyidaw Bus Station', 19.76330000, 96.07850000, 1);

-- Diagnosis
INSERT INTO diagnosis (diagnosisID, diagnosisName) VALUES
(1, 'Generalized Anxiety Disorder (GAD)'),
(2, 'Major Depressive Disorder (MDD)'),
(3, 'Panic Disorder'),
(4, 'Social Anxiety Disorder'),
(5, 'Post-Traumatic Stress Disorder (PTSD)'),
(6, 'Obsessive-Compulsive Disorder (OCD)'),
(7, 'Bipolar Disorder Type I'),
(8, 'Bipolar Disorder Type II'),
(9, 'Attention-Deficit/Hyperactivity Disorder (ADHD)'),
(10, 'Insomnia Disorder'),
(11, 'Borderline Personality Disorder (BPD)'),
(12, 'Eating Disorder - Anorexia Nervosa'),
(13, 'Eating Disorder - Bulimia Nervosa'),
(14, 'Substance Use Disorder'),
(15, 'Adjustment Disorder');

-- Medications
INSERT INTO medication (medicationID, medicationName, dosageForm, standardDose) VALUES
(1, 'Sertraline (Zoloft)', 'Tablet', '50mg'),
(2, 'Escitalopram (Lexapro)', 'Tablet', '10mg'),
(3, 'Fluoxetine (Prozac)', 'Capsule', '20mg'),
(4, 'Paroxetine (Paxil)', 'Tablet', '20mg'),
(5, 'Citalopram (Celexa)', 'Tablet', '20mg'),
(6, 'Venlafaxine (Effexor XR)', 'Capsule', '75mg'),
(7, 'Duloxetine (Cymbalta)', 'Capsule', '30mg'),
(8, 'Bupropion (Wellbutrin)', 'Tablet', '150mg'),
(9, 'Mirtazapine (Remeron)', 'Tablet', '15mg'),
(10, 'Trazodone', 'Tablet', '50mg'),
(11, 'Alprazolam (Xanax)', 'Tablet', '0.5mg'),
(12, 'Lorazepam (Ativan)', 'Tablet', '1mg'),
(13, 'Clonazepam (Klonopin)', 'Tablet', '0.5mg'),
(14, 'Diazepam (Valium)', 'Tablet', '5mg'),
(15, 'Lamotrigine (Lamictal)', 'Tablet', '100mg'),
(16, 'Lithium Carbonate', 'Capsule', '300mg'),
(17, 'Quetiapine (Seroquel)', 'Tablet', '100mg'),
(18, 'Olanzapine (Zyprexa)', 'Tablet', '5mg'),
(19, 'Risperidone (Risperdal)', 'Tablet', '2mg'),
(20, 'Aripiprazole (Abilify)', 'Tablet', '10mg'),
(21, 'Methylphenidate (Ritalin)', 'Tablet', '10mg'),
(22, 'Lisdexamfetamine (Vyvanse)', 'Capsule', '30mg'),
(23, 'Zolpidem (Ambien)', 'Tablet', '10mg'),
(24, 'Eszopiclone (Lunesta)', 'Tablet', '2mg'),
(25, 'Hydroxyzine', 'Tablet', '25mg'),
(26, 'Propranolol', 'Tablet', '20mg'),
(27, 'Naltrexone', 'Tablet', '50mg'),
(28, 'Disulfiram (Antabuse)', 'Tablet', '250mg');

-- Mood
INSERT INTO mood (moodID, moodName) VALUES
(1, 'Excellent'),
(2, 'Good'),
(3, 'Neutral'),
(4, 'Low'),
(5, 'Very Low'),
(6, 'Anxious'),
(7, 'Irritable'),
(8, 'Hopeful'),
(9, 'Tired'),
(10, 'Calm'),
(11, 'Pessimistic');

-- Rooms
INSERT INTO rooms (room_id, branch_id, room_number, room_type, capacity, is_active) VALUES
(1, 1, '101', 'consultation', 1, 1),
(2, 1, '102', 'consultation', 1, 1),
(3, 1, '103', 'consultation', 1, 1),
(4, 1, '104', 'therapy', 4, 1),
(5, 1, '105', 'group', 8, 1),
(6, 1, '106', 'conference', 10, 1),
(7, 2, '201', 'consultation', 1, 1),
(8, 2, '202', 'consultation', 1, 1),
(9, 2, '203', 'consultation', 1, 1),
(10, 2, '204', 'therapy', 4, 1),
(11, 2, '205', 'group', 8, 1),
(12, 3, '301', 'consultation', 1, 1),
(13, 3, '302', 'consultation', 1, 1),
(14, 3, '303', 'therapy', 4, 1),
(15, 3, '304', 'group', 6, 1),
(16, 4, '401', 'consultation', 1, 1),
(17, 4, '402', 'consultation', 1, 1),
(18, 4, '403', 'therapy', 4, 1);

-- Therapy options
INSERT INTO therapy (therapyID, therapyName) VALUES
(1, 'Cognitive Behavioral Therapy (CBT)'),
(2, 'Dialectical Behavior Therapy (DBT)'),
(3, 'Eye Movement Desensitization and Reprocessing (EMDR)'),
(4, 'Acceptance and Commitment Therapy (ACT)'),
(5, 'Mindfulness-Based Stress Reduction (MBSR)'),
(6, 'Psychodynamic Therapy'),
(7, 'Interpersonal Therapy (IPT)'),
(8, 'Exposure and Response Prevention (ERP)'),
(9, 'Couples Therapy'),
(10, 'Family Therapy'),
(11, 'Group Therapy'),
(12, 'Art Therapy'),
(13, 'Music Therapy'),
(14, 'Trauma-Focused CBT');
```

## Step 9: Run the program
> **Note:** Open 2 terminal (Run npm in 1st terminal, server in 2nd terminal)
``` bash
npm run dev

cd backend
node server.js
```