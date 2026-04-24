# 📤 How to Upload CYNAPSE AI Frontend to GitHub

Follow these steps **exactly** to push your code to the correct branch.

---

## STEP 1 — Create the GitHub Repository (Team Lead does this ONCE)

1. Go to **github.com** → Sign in → Click **"New"** (top-left green button)
2. Fill in:
   - **Repository name:** `cynapse-ai`
   - **Description:** `CYNAPSE AI — Cyber Neural Adaptive Protection System Engine | Nexora 2026`
   - **Visibility:** Private (recommended for hackathon)
3. ✅ Check **"Add a README file"**
4. Click **"Create repository"**
5. Share the repo URL with Teammates 2 and 3

---

## STEP 2 — Clone the Repo Locally

```bash
# Replace YOUR_USERNAME and REPO_NAME with actual values
git clone https://github.com/YOUR_USERNAME/cynapse-ai.git
cd cynapse-ai
```

---

## STEP 3 — Create Your Branch

```bash
# Create and switch to your branch
git checkout -b feat/frontend-ui-teammate1

# Verify you're on the right branch
git branch
# Should show: * feat/frontend-ui-teammate1
```

---

## STEP 4 — Add the Frontend Code

Copy the entire `cynapse-frontend/` folder into the cloned repo:

```bash
# From inside the cynapse-ai/ folder:
# Option A — if code folder is at the same level
cp -r ../cynapse-frontend ./frontend

# Option B — manually drag the folder in using your file explorer
# Then rename it to 'frontend' inside the repo
```

Your repo structure should look like:
```
cynapse-ai/
├── frontend/          ← your code goes here
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── README.md
```

---

## STEP 5 — Stage, Commit, and Push

```bash
# Stage all new files
git add .

# First commit
git commit -m "feat(frontend): init React 18 project with Tailwind dark theme"

# Push your branch to GitHub
git push -u origin feat/frontend-ui-teammate1
```

You'll be asked for credentials. Use your GitHub username + a **Personal Access Token** (not your password).

### How to generate a Personal Access Token (PAT):
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token (classic)"**
3. Name it `cynapse-hackathon`, expiry = 1 day
4. Check scope: **repo**
5. Generate and copy the token — use it as your password when prompted

---

## STEP 6 — Verify on GitHub

1. Go to your repo on github.com
2. Click the branch dropdown → select `feat/frontend-ui-teammate1`
3. You should see your `frontend/` folder ✅

---

## STEP 7 — Push Updates Every 1.5 Hours

```bash
git add .
git commit -m "feat(frontend): add phishing clone detector UI component"
git push
```

Commit message format (use these prefixes):
```
feat(frontend): ...   ← new feature or component
fix(frontend): ...    ← bug fix
chore(frontend): ...  ← config, installs, refactor
```

---

## STEP 8 — Raise a Pull Request at Hour 10

1. Go to your repo on GitHub
2. Click **"Compare & pull request"** (appears automatically after push)
3. Set:
   - **base:** `main`
   - **compare:** `feat/frontend-ui-teammate1`
   - **Title:** `feat(frontend): CYNAPSE AI Frontend — all features complete`
4. Add a brief description of what you built
5. Click **"Create pull request"**
6. Tag **Teammate 3** as the reviewer

Teammate 3 will review and merge to `main` at Hour 10.

---

## 🆘 Common Errors & Fixes

| Error | Fix |
|---|---|
| `fatal: not a git repository` | You're not inside the cloned folder. Run `cd cynapse-ai` first |
| `remote: Permission denied` | Use Personal Access Token (PAT) instead of your password |
| `rejected — non-fast-forward` | Run `git pull origin feat/frontend-ui-teammate1` first, then push |
| `error: failed to push — branch not found` | Run `git push -u origin feat/frontend-ui-teammate1` with `-u` flag |

---

## 🌐 Deploy to Vercel (Hour 11)

1. Go to **vercel.com** → Sign in with GitHub
2. Click **"Add New Project"** → Import `cynapse-ai` repo
3. Set **Root Directory** to `frontend`
4. Add Environment Variable: `REACT_APP_API_URL` = your Railway backend URL
5. Click **Deploy**

Your frontend will be live at: `https://cynapse-ai.vercel.app`
