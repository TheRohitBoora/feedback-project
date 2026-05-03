"""
Feedback API — POST /feedback to submit, GET /feedback to list (for dashboard).
"""
from __future__ import annotations

import re
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Paths: serve frontend from sibling ../frontend
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.normpath(os.path.join(ROOT, "..", "frontend"))

app = Flask(__name__, static_folder=None)
CORS(app)

feedbacks: list[dict] = []

MAX_NAME = 120
MAX_EMAIL = 254
MAX_MESSAGE = 4000

RATE_WINDOW_SEC = 60
RATE_MAX_PER_WINDOW = 20
_rate_buckets: dict[str, list[float]] = defaultdict(list)

_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


def _validate_email(email: str) -> bool:
    if len(email) > MAX_EMAIL:
        return False
    return bool(_EMAIL_RE.match(email))


def _client_ip() -> str:
    return (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip() or (
        request.remote_addr or "unknown"
    )


def _rate_limited(ip: str) -> bool:
    now = time.monotonic()
    bucket = _rate_buckets[ip]
    bucket[:] = [t for t in bucket if now - t < RATE_WINDOW_SEC]
    if len(bucket) >= RATE_MAX_PER_WINDOW:
        return True
    bucket.append(now)
    return False


@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.route("/responses")
def responses_page():
    return send_from_directory(FRONTEND, "responses.html")


@app.route("/css/<path:f>")
def css(f):
    return send_from_directory(os.path.join(FRONTEND, "css"), f)


@app.route("/js/<path:f>")
def js(f):
    return send_from_directory(os.path.join(FRONTEND, "js"), f)


@app.route("/feedback", methods=["GET"])
def list_feedback():
    items = sorted(feedbacks, key=lambda x: x["created_at"], reverse=True)
    return jsonify(items)


@app.route("/feedback", methods=["POST"])
def create_feedback():
    if _rate_limited(_client_ip()):
        return (
            jsonify(
                {
                    "ok": False,
                    "error": "Too many submissions. Please wait a minute and try again.",
                }
            ),
            429,
        )

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return (
            jsonify({"ok": False, "error": "Expected JSON object with name, email, message."}),
            400,
        )

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or data.get("feedback") or "").strip()

    errors: list[str] = []
    if not name:
        errors.append("Name is required.")
    elif len(name) > MAX_NAME:
        errors.append(f"Name must be at most {MAX_NAME} characters.")

    if not email:
        errors.append("Email is required.")
    elif not _validate_email(email):
        errors.append("Please enter a valid email address.")

    if not message:
        errors.append("Feedback is required.")
    elif len(message) > MAX_MESSAGE:
        errors.append(f"Feedback must be at most {MAX_MESSAGE} characters.")

    if errors:
        return jsonify({"ok": False, "error": " ".join(errors), "errors": errors}), 400

    created = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "message": message,
        "created_at": created,
    }
    feedbacks.append(entry)
    return jsonify({"ok": True, "id": entry["id"]}), 201


if __name__ == "__main__":
    # 5000 is often taken on Windows (AirPlay, etc.); 5050 avoids conflicts locally.
    app.run(host="127.0.0.1", port=5050, debug=True)
