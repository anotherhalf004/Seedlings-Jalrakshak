# Security Fixes Summary

This document summarizes all security vulnerabilities identified and fixed in the JalRakshak backend API.

## Date: 2026-10-11

## Vulnerabilities Fixed

### 1. ✅ CORS Wildcard Vulnerability (HIGH SEVERITY)
**Location:** `backend/main.py` (lines 32-38)

**Issue:** 
- Used `allow_origins=["*"]` which allows any origin to make requests
- `allow_credentials=True` combined with wildcard origin is dangerous

**Fix:**
- Changed to use environment variable `ALLOWED_ORIGINS` with default to localhost
- Set `allow_credentials=False` for security
- Restricted methods to `["GET", "POST"]` instead of wildcard
- Restricted headers to `["Content-Type"]` instead of wildcard

**Configuration:**
```bash
# Set in .env file
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

### 2. ✅ No Input Validation (MEDIUM SEVERITY)
**Location:** `backend/main.py` (lines 89-106)

**Issue:**
- No range validation for percentages (could be >100% or negative)
- No sanitization of city name parameter
- Could lead to unexpected behavior

**Fix:**
- Added Pydantic field validators with range constraints:
  - `gw_fall_pct`: `ge=0, le=100`
  - `population`: `ge=0`
  - `rainfall_period_dep_pct`: `ge=-100, le=200`
  - `monitoring_wells_count`: `ge=1, le=1000`
- Added custom city name validator to prevent special characters
- Added validator to ensure target NRW <= current NRW

---

### 3. ✅ Insecure Model Deserialization (MEDIUM-HIGH SEVERITY)
**Location:** `ml/predict.py` (lines 76-118)

**Issue:**
- `joblib.load()` uses pickle which can execute arbitrary code if model file is compromised
- No integrity verification of model files

**Fix:**
- Added `compute_file_hash()` function for SHA256 checksums
- Created `load_trusted_model()` function with optional hash verification
- Model hashes can be set via environment variables:
  - `DEMAND_MODEL_HASH`
  - `SUPPLY_MODEL_HASH`
- Added proper error logging instead of silent failure

**Usage:**
```bash
# Generate hash
sha256sum models/demand_model.joblib

# Set in .env
DEMAND_MODEL_HASH=<your-sha256-hash>
SUPPLY_MODEL_HASH=<your-sha256-hash>
```

---

### 4. ✅ No Authentication/Authorization (HIGH SEVERITY)
**Location:** `backend/main.py` (all endpoints)

**Issue:**
- All API endpoints publicly accessible without authentication
- No rate limiting to prevent abuse

**Fix:**
- Implemented optional API key authentication using FastAPI Security
- Added `verify_api_key()` dependency to protected endpoints
- Authentication is optional - enabled only when `API_KEY` env var is set
- Added rate limiting middleware (100 requests per 60 seconds by default)

**Configuration:**
```bash
# Enable authentication (optional)
API_KEY=your-secret-api-key-here

# Rate limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
```

---

### 5. ✅ Missing Security Headers (MEDIUM SEVERITY)
**Location:** `backend/main.py`

**Issue:**
- No security headers configured in FastAPI responses

**Fix:**
- Added middleware to set security headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self'`

---

### 6. ✅ Hardcoded File Paths (LOW-MEDIUM SEVERITY)
**Location:** `backend/main.py` (line 41), `ml/predict.py` (lines 72-74)

**Issue:**
- Paths hardcoded, could fail in different environments

**Fix:**
- Replaced hardcoded paths with environment variables
- Added sensible defaults using `os.getenv()` with fallbacks
- Created `.env.example` file for documentation

**Configuration:**
```bash
MASTER_DATA_PATH=data/final/jalrakshak_master.csv
```

---

### 7. ✅ Unhandled Exceptions (MEDIUM SEVERITY)
**Location:** `ml/predict.py` (line 117-118), `ml/shortage_engine.py`

**Issue:**
- Broad exception handling with silent failures
- Errors not logged, users won't know why predictions failed

**Fix:**
- Added proper logging configuration using Python's `logging` module
- Changed `except Exception as e: pass` to `except Exception as e: logger.error(..., exc_info=True)`
- Added logging to `shortage_engine.py` as well

---

### 8. ✅ No HTTPS Enforcement (MEDIUM SEVERITY)
**Location:** Backend configuration

**Issue:**
- Backend doesn't enforce HTTPS in production

**Fix:**
- Added HTTPS redirect middleware for production
- Only enforces HTTPS when `ENVIRONMENT=production`
- Skips enforcement for localhost/127.0.0.1

**Configuration:**
```bash
ENVIRONMENT=production
```

---

### 9. ✅ No Rate Limiting (MEDIUM SEVERITY)
**Location:** All API endpoints

**Issue:**
- Endpoints vulnerable to brute force and DoS attacks

**Fix:**
- Implemented in-memory rate limiter using `RateLimiter` class
- Configurable limits via environment variables
- Logs rate limit violations
- Returns HTTP 429 when limit exceeded

**Configuration:**
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60
```

---

### 10. ✅ Dependency Vulnerabilities (LOW-MEDIUM SEVERITY)
**Location:** `requirements.txt`

**Issue:**
- Dependencies unpinned (using `>=` ranges)
- Could install vulnerable versions

**Fix:**
- Installed `safety` package for vulnerability scanning
- Pinned all dependencies to specific versions
- Ran safety check: **0 vulnerabilities reported**

**Pinned Versions:**
```
pandas==3.0.3
numpy==2.4.5
scikit-learn==1.9.1
joblib==1.6.0
fastapi==0.143.0
uvicorn==0.52.4
pydantic==2.13.5
python-dotenv==1.0.1
```

---

## Additional Improvements

### Environment Variables Configuration
Created `backend/.env.example` with all security-related configuration options:
- `ENVIRONMENT` - development/production
- `ALLOWED_ORIGINS` - CORS allowed origins
- `ALLOWED_HOSTS` - Trusted hosts
- `API_KEY` - Optional authentication
- `RATE_LIMIT_MAX` - Rate limit requests
- `RATE_LIMIT_WINDOW` - Rate limit window (seconds)
- `DEMAND_MODEL_HASH` - Model integrity verification
- `SUPPLY_MODEL_HASH` - Model integrity verification
- `MASTER_DATA_PATH` - Data file path

### Logging
- Added comprehensive logging to all modules
- Configured log format with timestamp, module, level, and message
- Error logging includes stack traces for debugging

---

## Deployment Checklist

Before deploying to production:

1. ✅ Set `ENVIRONMENT=production` in `.env`
2. ✅ Configure `ALLOWED_ORIGINS` with your frontend domain
3. ✅ Configure `ALLOWED_HOSTS` with your production domain
4. ✅ Set `API_KEY` to enable authentication
5. ✅ Configure rate limiting as needed
6. ✅ Generate and set model hashes for integrity verification
7. ✅ Enable HTTPS on your hosting platform
8. ✅ Configure reverse proxy (nginx/Apache) with security headers
9. ✅ Review and adjust `ALLOWED_ORIGINS` for production
10. ✅ Test all endpoints with authentication

---

## Testing Security

### Test CORS
```bash
curl -H "Origin: http://malicious-site.com" http://localhost:8000/api/v1/health
# Should fail or not include CORS headers
```

### Test Rate Limiting
```bash
for i in {1..101}; do curl http://localhost:8000/api/v1/health; done
# Should get 429 after 100 requests
```

### Test Authentication (if enabled)
```bash
curl -H "Authorization: Bearer wrong-key" http://localhost:8000/api/v1/predict
# Should return 401 Unauthorized
```

### Test Input Validation
```bash
curl -X POST http://localhost:8000/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"city":"<script>alert(1)</script>"}'
# Should return 422 validation error
```

---

## Recommendations for Future

1. **Production Deployment:**
   - Use a proper secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Implement proper session management with JWT tokens
   - Add database connection pooling
   - Set up monitoring and alerting

2. **Advanced Security:**
   - Implement API rate limiting with Redis for distributed systems
   - Add Web Application Firewall (WAF)
   - Implement request signing for API calls
   - Add audit logging for all sensitive operations

3. **Monitoring:**
   - Set up centralized logging (ELK stack, CloudWatch)
   - Monitor for suspicious activity patterns
   - Set up alerts for rate limit violations
   - Regular security audits

---

## Files Modified

1. `backend/main.py` - CORS, input validation, authentication, rate limiting, security headers
2. `ml/predict.py` - Model integrity verification, logging
3. `ml/shortage_engine.py` - Logging
4. `requirements.txt` - Pinned dependencies, added python-dotenv
5. `backend/.env.example` - Environment variable documentation

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Pydantic Validation](https://docs.pydantic.dev/latest/concepts/pydantic_settings/)
- [Python Safety](https://pyup.io/docs/safety/)
