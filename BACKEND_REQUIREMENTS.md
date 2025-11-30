# Backend Requirements for macOS/Safari Compatibility

## ✅ Frontend Changes Complete

The frontend now relies **entirely on backend cookies**. No more Next.js API routes for cookie management.

## 🔧 Required Backend Changes

### 1. Update Cookie Settings in `/auth/login`

Your backend needs to set **TWO cookies** (not just one):

```python
import os
import json

# Add environment detection
IS_PRODUCTION = os.getenv("ENV", "development") == "production"

@app.post("/auth/login")
async def login(body: loginRequest, response: Response):
    # ... your authentication code ...
    
    user = await usersCol.find_one({
        "email": body.email,
        "password": body.password,
        "isActive": True
    })
    
    if not user:
        raise HTTPException(status_code=401, detail="invalid credentials")
    
    now = int(time.time())
    payload = {
        "email": user["email"],
        "role": user["role"],
        "organizationId": user.get("organizationId"),
        "iat": now,
        "exp": now + cookieMaxAge
    }
    token = encodeToken(payload)
    
    # ✅ COOKIE 1: Session token (httpOnly for security)
    response.set_cookie(
        key="bgvSession",
        value=token,
        httponly=True,  # ✅ Secure - JavaScript can't read
        secure=IS_PRODUCTION,  # ✅ Only HTTPS in production
        samesite="lax",  # ✅ Changed from "none" - Safari compatible
        max_age=cookieMaxAge,
        path="/",
    )
    
    # ✅ COOKIE 2: User data (NOT httpOnly - middleware needs to read)
    user_data = {
        "role": user["role"],
        "userName": user.get("userName"),
        "email": user["email"],
        "organizationId": user.get("organizationId")
    }
    
    response.set_cookie(
        key="bgvUser",
        value=json.dumps(user_data),
        httponly=False,  # ✅ MUST be False for middleware
        secure=IS_PRODUCTION,  # ✅ Only HTTPS in production
        samesite="lax",  # ✅ Changed from "none" - Safari compatible
        max_age=cookieMaxAge,
        path="/",
    )
    
    print(f"🍪 Cookies set for {user['email']} (production: {IS_PRODUCTION})")
    
    # Return data for localStorage
    return {
        "token": token,
        "role": user["role"],
        "userName": user.get("userName"),
        "email": user["email"],
        "organizationId": user.get("organizationId"),
        "permissions": user.get("permissions", []),
        "organizationName": user.get("organizationName")
    }
```

### 2. Update CORS Configuration

```python
origins = [
    # Local development
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://localhost:3000",
    "https://localhost:3443",
    "http://127.0.0.1:3000",
    
    # Local network (for iPhone testing)
    "http://10.50.65.219:3002",
    "http://192.168.159.1:3001",
    
    # Ngrok URLs
    "https://deserted-karla-soughfully.ngrok-free.dev",
    "https://bab4f4a54b2b.ngrok-free.app",
    "https://2440df7ab360.ngrok-free.app",
    
    # Production URLs
    "https://bgv-n977.onrender.com",
    "https://maihoo.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # ✅ REQUIRED for cookies
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Set-Cookie"],  # ✅ REQUIRED for cookies
)
```

### 3. Add Logout Endpoint

```python
@app.post("/auth/logout")
async def logout(response: Response):
    """
    Clear cookies on logout
    """
    # Clear both cookies
    response.delete_cookie("bgvSession", path="/")
    response.delete_cookie("bgvUser", path="/")
    
    print("🗑️ Cookies cleared on logout")
    
    return {"message": "Logged out successfully"}
```

### 4. Add Environment Variable

In your `.env` file or Render dashboard:

```bash
# For production
ENV=production

# For development/testing
ENV=development
```

## 🔑 Key Changes Summary

| Setting | Old Value | New Value | Why |
|---------|-----------|-----------|-----|
| `httponly` (session) | True | True | ✅ Keep secure |
| `httponly` (user) | True | **False** | ✅ Middleware needs to read |
| `samesite` | "none" | **"lax"** | ✅ Safari compatible |
| `secure` | True | **IS_PRODUCTION** | ✅ Works on HTTP dev |
| Cookie count | 1 | **2** | ✅ Session + User data |

## 🧪 Testing Backend Changes

### Test 1: Check Cookies Are Set

```bash
curl -i -X POST https://maihoo.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Expected response headers:**
```
Set-Cookie: bgvSession=...; Path=/; Max-Age=7200; SameSite=Lax; Secure
Set-Cookie: bgvUser=...; Path=/; Max-Age=7200; SameSite=Lax; Secure
```

### Test 2: Verify Cookie Values

The `bgvUser` cookie should contain:
```json
{
  "role": "ORG_HR",
  "userName": "John Doe",
  "email": "test@example.com",
  "organizationId": "123"
}
```

### Test 3: Test Logout

```bash
curl -i -X POST https://maihoo.onrender.com/auth/logout \
  -H "Cookie: bgvSession=...; bgvUser=..." \
  --cookie-jar -
```

**Expected:** Cookies should be cleared

## 🚀 Deployment Steps

### Step 1: Update Backend Code
1. Copy changes from above
2. Update `/auth/login` endpoint
3. Update CORS configuration
4. Add `/auth/logout` endpoint

### Step 2: Add Environment Variable
In Render dashboard:
- Go to Environment
- Add: `ENV=production`

### Step 3: Deploy Backend
```bash
git add .
git commit -m "Fix Safari/macOS cookie compatibility"
git push origin main
```

### Step 4: Test
1. Wait for deployment
2. Test login on Safari
3. Check cookies in browser console
4. Verify pages load

## ✅ Success Criteria

After backend deployment:
- ✅ Login sets 2 cookies (`bgvSession` and `bgvUser`)
- ✅ `bgvSession` is httpOnly (secure)
- ✅ `bgvUser` is NOT httpOnly (middleware can read)
- ✅ Both use `samesite="lax"`
- ✅ `secure` flag only on production (HTTPS)
- ✅ Logout clears both cookies

## 🐛 Troubleshooting

### Issue: Cookies not set

**Check:**
1. CORS includes your frontend URL
2. `allow_credentials=True` in CORS
3. `expose_headers=["Set-Cookie"]` in CORS

### Issue: Middleware can't read cookies

**Check:**
1. `bgvUser` cookie has `httponly=False`
2. Cookie is being set (check Network tab)
3. Cookie path is `/`

### Issue: Works on localhost but not production

**Check:**
1. `ENV=production` is set
2. Frontend URL is in CORS origins
3. Using HTTPS in production

## 📋 Complete Backend Code

See `backend_update.py` for complete, ready-to-use code.

## 🎯 What Frontend Expects

The frontend now expects:
1. Backend sets `bgvSession` cookie (httpOnly)
2. Backend sets `bgvUser` cookie (NOT httpOnly)
3. Backend returns user data in response body
4. Backend has `/auth/logout` endpoint

**No frontend API routes needed!** Everything is handled by backend.

---

**Status:** ✅ Frontend ready, waiting for backend changes

**Next:** Update backend and deploy
