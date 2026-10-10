# Security Policy — JalRakshak

The JalRakshak engineering and open-source team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose findings and are committed to working with security researchers and contributors to resolve verified vulnerabilities swiftly.

---

## 🛡️ Supported Versions

We provide security updates and patches for the following versions:

| Version | Supported | Status |
| :--- | :---: | :--- |
| `1.0.x` (Current / `main`) | :white_check_mark: | Actively supported for all security patches |
| `< 1.0.0` | :x: | End of Life (Upgrade to `main` branch) |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability or sensitive data exposure in JalRakshak, **please DO NOT file a public issue on GitHub**. Publicly disclosing flaws before a fix is released puts production instances and downstream deployments at risk.

### Preferred Reporting Method

1. **GitHub Security Advisory (Private)**:
   - Navigate to the GitHub repository: [anotherhalf004/Seedlings-Jalrakshak](https://github.com/anotherhalf004/Seedlings-Jalrakshak)
   - Go to the **Security** tab > **Advisories** > **Report a vulnerability**.
   - Provide a complete description and proof of concept.

2. **Security Contact Email**:
   - Alternatively, report directly via email to the project maintainers with the subject line:  
     `[SECURITY] JalRakshak Vulnerability Report`

### Information to Include in Your Report

To help us triage and resolve the issue quickly, please provide:

- **Component**: Affected module (e.g., `backend/main.py`, `frontend/`, `ml/predict.py`, dependencies, or cloud config).
- **Type of Vulnerability**: (e.g., Injection, SSRF, Deserialization, CORS misconfiguration, Exposure of Sensitive Data).
- **Proof of Concept**: Step-by-step reproduction steps or minimal script.
- **Impact Assessment**: What an attacker could achieve by exploiting this vulnerability.
- **Proposed Mitigation**: Suggested fix, patch, or configuration adjustment (if known).

---

## ⏱️ Response SLA & Coordinated Disclosure

We adhere to standard coordinated disclosure timelines:

- **Initial Acknowledgment**: Within **48 hours** of report receipt.
- **Triage & Assessment**: Within **5 business days** with confirmation of validity and assigned severity.
- **Resolution & Release**: Critical vulnerabilities will be patched within **14 days**.
- **Public Disclosure**: Coordinated after the patch has been published to the `main` branch and verified.

---

## 🔒 Security Best Practices & Architectural Scope

When running or contributing to JalRakshak, adhere to these key baseline practices:

### 1. Model Deserialization (`joblib` / `pickle`)
- The ML engine serializes and loads pre-trained models (`models/*.joblib`).
- **Never load untrusted `.joblib` files** from unverified third-party sources or public file shares, as arbitrary Python code execution can occur during deserialization.
- In production cloud pipelines (e.g., Amazon S3), restrict model bucket permissions to read-only IAM roles with integrity checksum verification.

### 2. Secret & Credential Management
- Never commit `.env`, AWS access keys, API tokens, or database passwords to version control.
- Ensure `.gitignore` continues to exclude local secrets and environment manifests.
- For AWS deployments (App Runner, Lambda, EC2), use AWS IAM Roles and AWS Secrets Manager / Parameter Store instead of hardcoded environment keys.

### 3. API Security & CORS Configuration
- In production deployments of `backend/main.py`, restrict `allow_origins` in FastAPI's `CORSMiddleware` from wildcard (`*`) to the explicit frontend domain URL (e.g., your AWS Amplify or CloudFront origin).
- Rate limiting should be enabled on inference endpoints (`/api/v1/predict`, `/api/v1/simulate`) when exposed over the public internet.

### 4. Data Privacy & Integrity
- Datasets collected from government sources (CGWB, IMD, JJM, Census 2011) contain non-personal municipal aggregated records.
- Verify checksums and provenance whenever regenerating processed datasets via `ml/preprocessing.py`.

---

## 🙏 Credits & Acknowledgments

We value responsible disclosure and will credit researchers in our release notes and repository security advisories (unless you request anonymity). Thank you for helping keep JalRakshak and public municipal water analytics infrastructure secure!
