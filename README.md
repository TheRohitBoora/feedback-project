# Voicebox — Feedback Form (Intern Assignment)

**Author:** [TheRohitBoora](https://github.com/TheRohitBoora) (Rohit Boora)

A small full-stack **feedback system**: **HTML, CSS, JavaScript** frontend and **Python (Flask)** backend. The UI uses an indigo / violet theme with **Voicebox** branding: a submit form and a **Live inbox** page that lists messages in a numbered feed.

This README answers the assignment: **break your own system**, **top fixes**, **explain your approach**, and **scale thinking**, plus how to run the project and host it on GitHub.

---

## Assignment requirements (checklist)

| Area | Requirement | How it’s met |
|------|-------------|--------------|
| **Frontend** | Form: Name, Email, Feedback (message) | `frontend/index.html` |
| | Submit button | Sends `POST /feedback` via `js/form.js` |
| | Success or error message | Alert region below the form |
| **Backend** | `POST /feedback` | `backend/app.py` |
| | Store data (in-memory) | Python list `feedbacks` |
| | Validation: required fields, valid email | Server-side checks + regex |

---

## Run locally

```powershell
cd backend
pip install -r requirements.txt
python app.py
```

- **Form:** http://127.0.0.1:5050/
- **Live inbox:** http://127.0.0.1:5050/responses

The dev server uses **port 5050** by default (port 5000 is often busy on Windows). Change it in `backend/app.py` if needed.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/feedback` | Body: JSON `{ "name", "email", "message" }` |
| `GET` | `/feedback` | List submissions, newest first |

**Success:** `201` — `{ "ok": true, "id": "<uuid>" }`  
**Validation error:** `400` — `{ "ok": false, "error": "...", "errors": [...] }`  
**Rate limit:** `429` — too many POSTs from the same IP in a short window  
**Bad JSON:** `400` — clear message when the body is not a JSON object

---

## Break your own system (8–10 failure modes)

1. **Missing required fields** — Empty name, email, or message should be rejected.
2. **Invalid email** — Values like `not-an-email` should fail format validation.
3. **Stored XSS** — If user content were injected with `innerHTML`, scripts could run in other users’ browsers.
4. **Huge payloads** — Very long fields could waste memory and CPU (especially with an in-memory store).
5. **Spam / flooding** — Many automated `POST`s could fill memory and slow the inbox view.
6. **Double submit** — Double-clicking “Send” could create duplicate rows for the same intent.
7. **Malformed JSON** — Invalid JSON or wrong `Content-Type` can produce confusing errors if not handled explicitly.
8. **Network / server down** — `fetch` fails; the user only sees a generic network error unless the UI explains it.
9. **Data loss on restart** — In-memory storage disappears when the process exits.
10. **Public inbox & PII** — `GET /feedback` and `/responses` expose names and emails to anyone with the URL (no login).

---

## Top 3 issues we fixed (and why)

| # | Issue | Fix | Why these three |
|---|--------|-----|-----------------|
| 1 | **Stored XSS** | Inbox rows are built with **`textContent`** only in `frontend/js/responses.js` (no user HTML parsed as DOM). | Safety impact is high; one malicious message should not compromise viewers. |
| 2 | **Memory / abuse via size** | **Max lengths** on the server (`app.py`) and matching **`maxlength`** on inputs in the form. | Cheap guardrail; reduces accidental or hostile giant payloads on a small demo server. |
| 3 | **Flooding** | **Per-IP rate limit** (e.g. 20 POSTs per 60 seconds) returning **429** with a clear message. | Improves availability without accounts or CAPTCHA—reasonable for this scope. |

**Also in place:** `400` for non-object JSON; **submit button disabled** while the request is in flight to reduce accidental double posts.

---

## Explain your approach

**Why this design**  
A single **Flask** app serves static files from `frontend/` and exposes a minimal JSON API. One command runs everything in development. The form and inbox are separate pages so concerns stay clear: collect input vs. review submissions. **In-memory storage** keeps the focus on HTTP validation, UX, and testing rather than database setup.

**Trade-offs**  
- **Durability:** Data is lost on restart; no multi-instance consistency.  
- **Rate limiting:** IP-based limits are imperfect behind proxies unless `X-Forwarded-For` is trusted and normalized.  
- **Privacy:** The inbox is intentionally open for the assignment; production would require auth, audit logs, and retention policy.

**What we would improve with more time**  
SQLite or Postgres; **auth** on the inbox and API; **pagination** on `GET /feedback`; production WSGI (e.g. Gunicorn), HTTPS, structured logging; optional idempotency keys for submits; honeypot or CAPTCHA for spam; export and deletion tools for GDPR-style requests.

---

## Scale thinking (~10,000 users)

- **In-memory state** on one machine would not survive restarts or scale horizontally; you’d need a **shared database** and **stateless app servers** behind a load balancer.  
- **Unbounded `GET /feedback`** would return ever-larger JSON and slow the UI—**pagination** (cursor/limit) and **caching** would be required.  
- **Rate limits** would move to a **shared store** (e.g. Redis) so limits apply across all instances.  
- **PII at scale** needs **encryption at rest**, **access control**, retention limits, and legal/compliance review.

---

## Project layout

```
Feedback Project/
  backend/
    app.py
    requirements.txt
  frontend/
    index.html
    responses.html
    css/styles.css
    js/form.js
    js/responses.js
  README.md
  .gitignore
```

---

## Push to GitHub

This project is set up for account **[TheRohitBoora](https://github.com/TheRohitBoora)**. After you create the empty repo on GitHub, use the URL below (change the repo name if you used something other than `feedback-project`).

### 1. Create a new repository on GitHub

In the browser: [github.com/new](https://github.com/new) — name it e.g. **`feedback-project`**. Leave **Add a README** unchecked (you already have one here).

### 2. From this folder on your machine

If you **already** ran `git init` and committed, only add the remote and push:

```powershell
cd "c:\Users\Rohit Boora\Desktop\Feedback Project"
git branch -M main
git remote add origin https://github.com/TheRohitBoora/feedback-project.git
git push -u origin main
```

If `origin` already exists, update it instead:

```powershell
git remote set-url origin https://github.com/TheRohitBoora/feedback-project.git
git push -u origin main
```

**First time** (no git repo yet):

```powershell
cd "c:\Users\Rohit Boora\Desktop\Feedback Project"
git init
git add .
git commit -m "Initial commit: Voicebox feedback form and Flask API"
git branch -M main
git remote add origin https://github.com/TheRohitBoora/feedback-project.git
git push -u origin main
```

Use a **Personal Access Token** as the password when Git prompts over HTTPS, or configure **SSH** if you prefer.

### 3. Optional: GitHub CLI

If `gh` is installed and you are logged in (`gh auth login`):

```powershell
cd "c:\Users\Rohit Boora\Desktop\Feedback Project"
gh repo create feedback-project --public --source=. --remote=origin --push
```

---

## License

Educational / intern assignment use. Add a license file if you need a formal open-source license.
