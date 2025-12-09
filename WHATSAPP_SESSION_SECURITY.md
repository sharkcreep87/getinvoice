# WhatsApp Session Data - Security & Privacy

## ⚠️ Important: `.wwebjs_auth` Should NOT Be in Git

### What is `.wwebjs_auth`?

The `.wwebjs_auth` directory contains **sensitive WhatsApp session data**:

```
.wwebjs_auth/
└── session-<user-id>/
    └── session-whatsapp-bot-<user-id>/
        ├── Default/
        │   ├── Cookies          # 🔒 Browser cookies
        │   ├── Cookies-journal  # 🔒 Cookie changes
        │   ├── Local Storage/   # 🔒 WhatsApp auth tokens
        │   ├── Session Storage/ # 🔒 Session data
        │   └── IndexedDB/       # 🔒 WhatsApp messages cache
        └── ...
```

### Why It Should Be Ignored

#### 1. **Security Risk** 🔐
- Contains WhatsApp authentication tokens
- Anyone with these files can impersonate your WhatsApp session
- Could be used to send messages as you
- Access to your WhatsApp conversations

#### 2. **Privacy Risk** 🕵️
- May contain cached messages
- Contact information
- Conversation metadata
- User-specific data

#### 3. **Not Portable** 💻
- Session data is machine-specific
- Won't work on other computers
- Each user needs their own session
- Committing it serves no purpose

#### 4. **Large Files** 📦
- Can grow to hundreds of MB
- Slows down git operations
- Wastes repository space
- Makes cloning slower

## What We've Done

### ✅ Added to `.gitignore`

```gitignore
# WhatsApp Web.js session data (contains sensitive auth data)
.wwebjs_auth/
.wwebjs_cache/
```

This prevents these directories from being tracked by git.

### ✅ Verified Not in Git

Confirmed that `.wwebjs_auth` is not currently tracked in the repository.

## What You Should Do

### 1. **Verify It's Ignored**

```bash
# Check git status - should not show .wwebjs_auth
git status

# Verify gitignore is working
git check-ignore .wwebjs_auth
# Should output: .wwebjs_auth
```

### 2. **If Already Committed (How to Remove)**

If you've already committed these files to git, remove them:

```bash
# Remove from git tracking (keeps local files)
git rm -r --cached .wwebjs_auth
git rm -r --cached .wwebjs_cache

# Commit the removal
git add .gitignore
git commit -m "Remove WhatsApp session data from git and add to .gitignore"

# Push to remote
git push
```

### 3. **Clean Up Remote Repository (If Needed)**

If sensitive data was pushed to GitHub/GitLab:

**Option A: BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG
brew install bfg

# Clone a fresh copy
git clone --mirror https://github.com/yourusername/getinvoice.git

# Remove the folder from history
bfg --delete-folders .wwebjs_auth getinvoice.git

# Clean up
cd getinvoice.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push the cleaned history
git push
```

**Option B: Filter-Branch (Manual)**
```bash
git filter-branch --force --index-filter \
  "git rm -rf --cached --ignore-unmatch .wwebjs_auth" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

⚠️ **Warning**: These commands rewrite git history. Coordinate with your team!

## Best Practices

### For Development

1. **Each developer gets their own session**
   - Run `npm run dev` locally
   - Scan QR code with their own WhatsApp
   - Session stored in `.wwebjs_auth` (ignored by git)

2. **Never share session files**
   - Don't send via email/Slack
   - Don't commit to git
   - Don't upload to cloud storage

3. **Regenerate if compromised**
   - Delete `.wwebjs_auth` directory
   - Restart the bot
   - Scan new QR code

### For Production

1. **Use environment-specific sessions**
   - Production server has its own session
   - Staging server has its own session
   - Never copy sessions between environments

2. **Secure storage**
   - Store on server filesystem (not in code)
   - Proper file permissions (600 or 700)
   - Regular backups (encrypted)

3. **Session management**
   - Monitor for disconnections
   - Implement session refresh
   - Handle expiration gracefully

## What's Safe to Commit

✅ **Safe to commit:**
- Source code (`src/`)
- Configuration templates (`.env.example`)
- Documentation
- Tests
- Build scripts

❌ **Never commit:**
- `.wwebjs_auth/` - WhatsApp sessions
- `.wwebjs_cache/` - WhatsApp cache
- `.env.local` - Environment variables
- `node_modules/` - Dependencies
- API keys or tokens
- User data or credentials

## Current Status

✅ `.wwebjs_auth` is now in `.gitignore`  
✅ `.wwebjs_cache` is now in `.gitignore`  
✅ Directories are not tracked by git  
✅ Future sessions will be automatically ignored  

## Summary

The `.wwebjs_auth` directory contains sensitive WhatsApp authentication data and should **never** be committed to git. We've:

1. Added it to `.gitignore`
2. Verified it's not currently tracked
3. Documented why it's important
4. Provided cleanup instructions if needed

Your WhatsApp sessions are now properly protected! 🔒
