# Mobile Store Readiness Review

**Reviewed:** 2026-08-15

Space Planner Studio is currently a web application. A native iOS or Android wrapper should request no sensitive platform permission by default because selecting a document through the platform picker does not require broad photo-library or storage access. Camera access should be added only if a future in-app scan feature needs it, immediately before that user action, with a clear explanation of its purpose.

| Requirement | Current application status | Native release action |
| --- | --- | --- |
| In-app account deletion | Implemented through **ACCOUNT** controls with a 30-day cancellation period | Include the same control in the native navigation structure. |
| Web account-deletion resource | Implemented at `/delete-account`; users can authenticate and continue to the in-app account controls | Use the production `/delete-account` URL in Play Console. |
| Data export | Implemented for authenticated users through **ACCOUNT** | Retain this control in native account settings. |
| Analytics and crash consent | Implemented as separate opt-in controls and enforced server-side | Keep default disclosures and native privacy manifest/Data Safety declarations aligned. |
| Camera and media permissions | Not requested by the web app | Use document picker APIs first. Request `CAMERA`/iOS camera access only when the user starts scanning. Do not request location, contacts, microphone, or broad media access. |
| Store privacy disclosure | Application data flows are documented, but store-console forms are not yet submitted | Complete Apple App Privacy Details and Google Play Data Safety based on the released native build and any incorporated SDKs. |

Apple’s current review guidance requires complete and accurate metadata, accessible backend services during review, and a functioning build without crashes. Apple also requires apps that support account creation to offer account deletion inside the app. Google Play requires both an in-app deletion path and a web resource for deletion when an app supports accounts; it also requires corresponding Data Safety answers. Android recommends requesting the minimum necessary permissions and associating runtime permission prompts with a specific action.

## Sources

1. [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
2. [Google Play account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
3. [Android permission overview](https://developer.android.com/guide/topics/permissions/overview)
