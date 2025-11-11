# Swaddle — Maintenance Manual

## 1. Information

- **Application Name:** Swaddle
- **Team Name:** Polis Group
- **Team Members:** Jeff Hummel, Timmy Khan, Michael Gomez, Adam Standeven, Siah Naisbitt
- **Date:** October 19, 2025

---

## 2. Table of Contents

1. Information
2. Table of Contents
3. Introduction
4. System Overview
   - Description
   - Architecture
   - Components
   - Technologies Used
5. Installation and Setup
   - Prerequisites
   - Installation Instructions
   - Configuration
6. Maintenance Tasks
   - Routine Maintenance
     - Daily Tasks
     - Weekly Tasks
     - Monthly Tasks
   - Preventive Maintenance
     - Quarterly Tasks
     - Annual Tasks
   - Corrective Maintenance
7. Troubleshooting
   - Common Issues
   - Error Messages
   - Contact Information
8. Security & Backup Procedures
9. Change Management Process
10. Tools and Resources
11. Logs and Records
12. Appendices

- Diagrams and Flowcharts
- Glossary

---

## 3. Introduction

- **Purpose:**
  This maintenance manual provides step-by-step instructions for maintaining, monitoring, and troubleshooting the Swaddle application. It ensures smooth operation, performance, and data protection across all environments.

- **Audience:**
  Developers, system administrators, and support personnel responsible for maintaining the Swaddle application.

---

## 4. System Overview

- **Description:**
  Swaddle is a mobile application for tracking baby care activities, health metrics, and caregiver insights.

- **Architecture:**
  High-level architecture: Expo React Native client communicates with Firebase backend services (Auth, Firestore, Storage).

- **Components:**

  - **React Native App (TypeScript):** Mobile client and UI layer.
  - **Expo Router:** Handles navigation between screens.
  - **Firebase Services:**
    - Authentication
    - Firestore database
    - Storage

- **Technologies Used:**
  - Expo / React Native
  - TypeScript
  - Firebase (Auth, Firestore, Storage)

---

## 5. Installation and Setup

- **Prerequisites:**

  - Node.js 20+
  - Expo CLI
  - Android Studio (Android) / Xcode (iOS)
  - Git with repository access
  - Firebase project with appropriate IAM roles

- **Installation Instructions:**

  1. Clone the repository:
     ```bash
     git clone https://github.com/khantimmy/swaddle
     cd swaddle
     npm install
     ```
  2. Configure environment variables:
     - Create `.env` for runtime keys if required
     - Populate Firebase configuration in `firebase.config.ts`
  3. Run the application:
     ```bash
     npm run start
     npm run android
     npm run ios
     ```

- **Configuration:**
  - Firebase credentials set in `firebase.config.ts` or `.env`
  - Expo project settings in `app.config.js`

---

## 6. Maintenance Tasks

### 6.1 Routine Maintenance

**Daily Tasks:**

1. Check crash/error dashboards.
2. Review Firebase quotas and active alerts.

**Weekly Tasks:**

1. Conduct security scans.
2. Review logs for unusual activity.

**Monthly Tasks:**

1. Apply software updates and patches:

   ```bash
   npm audit --production
   npm outdated
   ```

2. Update documentation to reflect configuration or procedure changes.
3. Verify backup exports and perform restore test.
4. Validate Firebase Rules and database indexes.

---

### 6.2 Preventive Maintenance

**Quarterly Tasks:**

1. Upgrade to a supported Expo SDK and test on iOS/Android.
2. Conduct performance profiling and bundle analysis.

**Annual Tasks:**

1. Conduct full system audit including security and performance review.
2. Rotate credentials and review architecture roadmap for improvements.

---

### 6.3 Corrective Maintenance

**Incidents / Hotfixes:**

1. Create hotfix branch from latest release tag.
2. Implement fixes, add tests, run regression tests.
3. Produce internal QA build; submit to stores after approval.
4. Document root cause and preventive actions.

---

## 7. Troubleshooting

- **Common Issues:**

  - App fails to start (development environment)
  - Firebase connection errors
  - OTA or store build issues

- **Error Messages:**

```text
Error: Firebase: Error (auth/invalid-api-key)
Solution: Verify API key and Firebase project configuration.
```

- **Contact Information:**
  - Support Email: [support@swaddleapp.com](mailto:support@swaddleapp.com)
  - Phone: 1-800-555-1234

---

## 8. Security & Backup Procedures

- **Security:** Least-privilege IAM, monthly Firebase Rules review, dependency vulnerability scans, annual credential rotation.
- **Backups:** Daily Firestore/Storage exports to separate buckets with versioning.
- **Restore Testing:** Quarterly restore to staging project to verify integrity:

```bash
gcloud firestore import gs://<backup-bucket>/<export-folder>
```

- Document results in **Backup Verification Log**.

---

## 9. Change Management Process

- **Branching & Versioning:** Feature/hotfix branches from release tags; semantic versioning; maintain `CHANGELOG.md`.
- **Review & Approval:** PR review required; CI/CD must pass; QA verification for critical changes.
- **Release Checklist:** Tests pass, metadata/labels updated, crash-free baseline verified; document changes and logs.

---

## 10. Tools and Resources

- **Tools:**

  - Expo CLI: Build, test, and publish app
  - Firebase Console: Manage Auth, Firestore, Storage
  - GitHub: Source control and CI/CD

- **Resource Links:**
  - [Expo Documentation](https://docs.expo.dev)
  - [Firebase Documentation](https://firebase.google.com/docs)
  - [Node.js Documentation](https://nodejs.org/en/docs)

---

## 11. Logs and Records

- **Log Templates:**

  - **Maintenance Action Log:** date, actor, action, result, links
  - **Backup Verification Log:** export ID, checksum, restore test
  - **Latency Log:** tracks API or app response times for performance monitoring
  - **Read Log:** tracks database read operations for auditing and optimization
  - **Monitoring Log:** collects system metrics, error reports, and crash data

- **Sample Logs:**
  - Latency Log: `LatencyLogs.jpg`
  - Monitoring Log: `MonitoringLogs.jpg`
  - Read Log: `ReadLogs.jpg`

---

## 12. Appendices

- **Diagrams and Flowcharts:**

  - Architecture Diagram: `DataFlowDiagram.pdf`
  - State Transition Diagram: `StateTransitionDiagram.pdf`

- **Glossary:**
  - **Expo SDK:** Framework for building React Native apps.
  - **Firebase Rules:** Security rules controlling Firestore/Storage access.
  - **CI/CD:** Continuous Integration / Continuous Deployment pipeline.
  - **Firestore:** Cloud-hosted NoSQL database provided by Firebase.
  - **Firebase Storage:** Cloud storage for user-generated content (images, files).
  - **Hotfix Branch:** A branch created to fix critical bugs without affecting main development.
  - **Expo Router:** Navigation library for handling routes/screens in Expo/React Native apps.
  - **Latency Log:** Records the time taken for API calls or application processes.
  - **Monitoring Log:** Captures metrics, errors, and crash reports for analysis.
  - **Read Log:** Tracks database read operations for auditing or performance purposes.
