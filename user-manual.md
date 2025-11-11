# Swaddle – User Manual
**Version:** 1.0.1  
**Team Name:** Polis Group  
**Date:** 10/26/2025  

---

## 1. Introduction
Swaddle is a comprehensive baby tracking application designed to help parents and caregivers monitor their baby's daily activities, growth, and development. The app provides a safe, COPPA-compliant platform for tracking essential baby care activities including sleep patterns, feeding schedules, diaper changes, activities, developmental milestones, and weight measurements.

Swaddle helps you:
- **Track Daily Activities**: Monitor sleep, feeding, diaper changes, and activities
- **Record Milestones**: Document important developmental achievements
- **Monitor Growth**: Track weight measurements over time
- **Generate Insights**: Get AI-powered insights about your baby's patterns
- **Create Reports**: Generate detailed PDF reports for healthcare providers
- **Share Data**: Securely share information with family members and caregivers

The app features an intuitive interface with cloud-themed animations and supports both light and dark themes.

---

## 2. System Requirements
- **Hardware:** 
  - iOS: iPhone or iPad running iOS 13.0 or later
  - Android: Device running Android 6.0 (API level 23) or later
  - Minimum 2GB RAM recommended
  - At least 100MB free storage space
- **Software:** 
  - Expo Go app (for development/testing)
  - React Native framework
  - Internet connection for data synchronization
- **Other Dependencies:** 
  - Firebase authentication
  - Email client for report sharing
  - Camera access (optional, for future photo features)

---

## 3. Installation Guide
1. **Download Expo Go**:
   - Visit the App Store (iOS) or Google Play Store (Android)
   - Search for "Expo Go" and install the app

2. **Install Swaddle**:
   - Open Expo Go on your device
   - Scan the QR code provided by the development team
   - Wait for the app to download and install

3. **Alternative Installation** (for developers):
   - Clone the repository from GitHub
   - Install Node.js and npm
   - Run `npm install` to install dependencies
   - Run `expo start` to launch the development server
   - Scan the QR code with Expo Go

4. **First Launch**:
   - Open Swaddle from your device's app list
   - The app will display the welcome screen with the Swaddle logo
   - You're ready to create your account!

---

## 4. Getting Started
1. **Create Your Account**:
   - Tap "Create Account" on the welcome screen
   - Enter your email address and create a secure password
   - Confirm your password
   - Tap "Create Account" to proceed

2. **Sign In** (if you already have an account):
   - Enter your email and password
   - Tap "Sign In"

3. **Add Your First Child**:
   - After signing in, you'll be prompted to add a child
   - Enter your baby's first name, last name, and date of birth
   - Select the baby's sex
   - Optionally enter birth weight
   - Tap "Add Child" to save

4. **Start Tracking**:
   - You'll be taken to the Home screen
   - Tap any of the activity buttons (Sleep, Feed, Diaper, Activity, Milestone, Weight)
   - Fill in the required information
   - Tap "Save" to record the entry

---

## 5. Features & Functions

### Feature 1: Activity Tracking
**Sleep Tracking**
- Record sleep start and end times
- Rate sleep quality (Poor to Excellent)
- View sleep patterns and duration
- Edit or delete previous entries

**Feeding Tracking**
- Track different feeding types: Nursing, Bottle, Solid food
- Record feeding amounts and duration
- Add notes and descriptions
- Track nursing side (left/right)

**Diaper Tracking**
- Log diaper type: Pee, Poo, Mixed, or Dry
- Record amounts and characteristics
- Track diaper rash occurrences
- Monitor patterns and frequency

**Activity Tracking**
- Record various baby activities
- Track playtime and engagement
- Monitor developmental activities

### Feature 2: Milestone Recording
- Document important developmental milestones
- Track achievement dates
- View milestone history
- Share milestone progress with family

### Feature 3: Weight Monitoring
- Record weight measurements in pounds and ounces
- Track growth over time
- View weight trends and charts
- Export weight data for healthcare providers

### Feature 4: Data Visualization & Reports
**Insights Tab**
- View AI-generated insights about your baby's patterns
- Select specific data types to analyze
- Choose time ranges (7, 14, 30, or 90 days)
- Get personalized recommendations

**Reports Tab**
- Generate comprehensive PDF reports
- Include selected data types and time ranges
- Email reports to healthcare providers
- Share reports with family members

### Feature 5: Multi-Child Support
- Add multiple children to your account
- Switch between children using corner indicators
- Individual tracking for each child
- Separate reports and insights per child

### Feature 6: Caregiver Access
- Add authorized caregivers to your account
- Share child data with family members
- Grant access permissions
- Manage caregiver permissions

### Feature 7: Settings & Customization
- Choose between Light, Dark, or System theme
- Access COPPA compliance information
- View privacy policy
- Export or delete all data
- Accessibility features support

---

## 6. Troubleshooting
| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| App won't start | Network connection issues | Check internet connection and try again |
| Can't sign in | Incorrect credentials | Verify email and password, use "Forgot Password" if needed |
| Data not syncing | Firebase connection error | Check internet connection, restart app |
| Reports not generating | Insufficient data | Ensure you have at least one entry for selected data types |
| App crashes on startup | Device compatibility | Update device OS, reinstall Expo Go |
| Can't add child | Missing required fields | Fill in all required fields (name, DOB, sex) |
| Theme not changing | App cache issue | Restart the app completely |
| PDF reports blank | Data formatting error | Check that all entries have valid dates and times |
| Email sharing fails | Email client not configured | Set up email client on device, try sharing PDF instead |

---

## 7. FAQ
**Q:** Is my baby's data secure?  
**A:** Yes! Swaddle is COPPA-compliant and uses industry-standard encryption. All data is stored securely and we never share personal information with third parties.

**Q:** Can I use the app offline?  
**A:** The app requires an internet connection for data synchronization and AI insights. However, you can record entries offline and they will sync when you reconnect.

**Q:** How do I share data with my pediatrician?  
**A:** Use the Reports feature to generate a PDF report with your selected data types and time range, then email it directly to your healthcare provider.

**Q:** Can multiple caregivers access the same child's data?  
**A:** Yes! Use the "Add Caregiver" feature to grant access to family members or other caregivers.

**Q:** What if I forget my password?  
**A:** Use the "Forgot Password" option on the sign-in screen. You'll receive an email with instructions to reset your password.

**Q:** Can I export all my data?  
**A:** Unfortunately not at the moment! While the feature is in our planned updates, It was not part of our original scope for the project.
**Q:** How accurate are the AI insights?  
**A:** The AI insights are generated using advanced language models and are based on your actual data patterns. However, they should NEVER replace professional medical advice.

---

## 8. Contact Information

- **Other Support Channels:** 
  - Help & Support section in app Settings
  - GitHub Issues (for developers)

For technical support, bug reports, or feature requests, please contact our support team. We're committed to providing excellent customer service and continuously improving the Swaddle experience for all families.
