"""Local authenticated server for the Government College for Women, Karnal ERP demo.

Run with: ..\\.venv\\Scripts\\python.exe server.py
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import secrets
import time
from io import BytesIO
from http import HTTPStatus
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

from pypdf import PdfReader


APP_DIRECTORY = Path(__file__).resolve().parent
SESSION_SECONDS = 8 * 60 * 60
MAX_LOGIN_BODY_BYTES = 8_192
LOGIN_WINDOW_SECONDS = 5 * 60
MAX_LOGIN_ATTEMPTS = 5
MAX_STUDENT_PDF_BYTES = 10 * 1024 * 1024
MAX_STUDENT_PDF_PAGES = 25
MAX_STUDENT_PDF_TEXT_CHARACTERS = 250_000
MAX_ADMIN_PROFILE_BODY_BYTES = 1_100_000
MAX_ADMIN_PROFILE_PHOTO_CHARACTERS = 1_050_000
ALLOWED_ADMIN_PHOTO_PREFIXES = ("data:image/png;base64,", "data:image/jpeg;base64,", "data:image/webp;base64,")
ADMIN_PROFILE_PATH = APP_DIRECTORY / "admin_profile.json"
DEFAULT_ADMIN_PROFILE = {
    "name": "Dr. Vivek Range",
    "position": "Principal",
    "office": "Academic Office",
    "email": "",
    "photo": "",
}

# This local demo account uses PBKDF2-HMAC-SHA256 with a fixed, non-secret salt.
# Replace this seed account with database-backed users and an identity provider before deployment.
USERS = {
    "admin": {
        "name": "Dr. Vivek Range",
        "role": "Principal",
        "salt": "c69d367d4b3b564a58e9147fbea1fa2f",
        "password_hash": "fed4792fd9e5c8dcf95ce6c2f3bee7040409a99ce17fb3e019852e570c0e2cd9",
    }
}
SESSIONS: dict[str, dict[str, float | str]] = {}
LOGIN_ATTEMPTS: dict[str, list[float]] = {}
PUBLIC_PATHS = {"/login.html", "/login.js", "/login.css", "/branding.css", "/assets/gcw-karnal-logo.png"}


def _profile_text(value: object, fallback: str, maximum: int) -> str:
    text = str(value or "").strip()
    return text if text and len(text) <= maximum else fallback


def _load_admin_profile() -> dict[str, str]:
    profile = dict(DEFAULT_ADMIN_PROFILE)
    try:
        saved = json.loads(ADMIN_PROFILE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        return profile
    if not isinstance(saved, dict):
        return profile
    profile["name"] = _profile_text(saved.get("name"), profile["name"], 100)
    profile["position"] = _profile_text(saved.get("position"), profile["position"], 100)
    profile["office"] = _profile_text(saved.get("office"), profile["office"], 120)
    email = str(saved.get("email") or "").strip()
    profile["email"] = email if len(email) <= 160 and (not email or "@" in email) else ""
    photo = str(saved.get("photo") or "")
    if photo.startswith(ALLOWED_ADMIN_PHOTO_PREFIXES) and len(photo) <= MAX_ADMIN_PROFILE_PHOTO_CHARACTERS:
        profile["photo"] = photo
    return profile


def _save_admin_profile(profile: dict[str, str]) -> None:
    temporary_path = ADMIN_PROFILE_PATH.with_suffix(".tmp")
    temporary_path.write_text(json.dumps(profile, ensure_ascii=False), encoding="utf-8")
    temporary_path.replace(ADMIN_PROFILE_PATH)


def password_matches(password: str, account: dict[str, str]) -> bool:
    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(account["salt"]), 310_000
    ).hex()
    return hmac.compare_digest(candidate, account["password_hash"])


class ERPRequestHandler(SimpleHTTPRequestHandler):
    """Serves the UI only after a valid local session is present."""

    server_version = "GCWKarnalERP/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(APP_DIRECTORY), **kwargs)

    def log_message(self, format: str, *args) -> None:
        # Keep routine browser requests out of the terminal, while preserving errors from the server.
        return

    def end_headers(self) -> None:
        # The interface changes often during local setup. Never let a browser reuse stale HTML, JavaScript or CSS.
        path = urlparse(self.path).path
        if path.endswith((".html", ".js", ".css")):
            self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def _clear_expired_sessions(self) -> None:
        current_time = time.time()
        for token, session in list(SESSIONS.items()):
            if float(session["expires_at"]) <= current_time:
                del SESSIONS[token]

    def _session(self) -> dict[str, float | str] | None:
        self._clear_expired_sessions()
        cookie = SimpleCookie(self.headers.get("Cookie"))
        token = cookie.get("gcw_karnal_session")
        if not token:
            return None
        session = SESSIONS.get(token.value)
        if not session or float(session["expires_at"]) <= time.time():
            return None
        return session

    def _send_json(self, status: HTTPStatus, body: dict, cookie: str | None = None) -> None:
        payload = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.end_headers()
        self.wfile.write(payload)

    def _redirect_to_login(self) -> None:
        self.send_response(HTTPStatus.FOUND)
        self.send_header("Location", "/login.html")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def _is_rate_limited(self) -> bool:
        now = time.time()
        attempts = [item for item in LOGIN_ATTEMPTS.get(self.client_address[0], []) if now - item < LOGIN_WINDOW_SECONDS]
        LOGIN_ATTEMPTS[self.client_address[0]] = attempts
        return len(attempts) >= MAX_LOGIN_ATTEMPTS

    def _record_failed_login(self) -> None:
        LOGIN_ATTEMPTS.setdefault(self.client_address[0], []).append(time.time())

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        session = self._session()
        if path == "/api/session":
            if session:
                profile = _load_admin_profile()
                self._send_json(HTTPStatus.OK, {"authenticated": True, "name": profile["name"], "role": profile["position"]})
            else:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"authenticated": False})
            return
        if path == "/api/admin-profile":
            if not session:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "Sign in before viewing administrator settings."})
            else:
                self._send_json(HTTPStatus.OK, _load_admin_profile())
            return
        if path == "/login.html":
            if session:
                self.send_response(HTTPStatus.FOUND)
                self.send_header("Location", "/")
                self.end_headers()
                return
            return super().do_GET()
        if path in PUBLIC_PATHS:
            return super().do_GET()
        if not session:
            return self._redirect_to_login()
        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/login":
            return self._login()
        if path == "/api/logout":
            return self._logout()
        if path == "/api/parse-student-pdf":
            if not self._session():
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "Sign in before importing a student list."})
                return
            return self._parse_student_pdf()
        if path == "/api/admin-profile":
            if not self._session():
                self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "Sign in before changing administrator settings."})
                return
            return self._update_admin_profile()
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Not found."})

    def _update_admin_profile(self) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_ADMIN_PROFILE_BODY_BYTES:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "The profile update is too large."})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "The administrator profile is invalid."})
            return
        if not isinstance(payload, dict):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "The administrator profile is invalid."})
            return
        name = str(payload.get("name") or "").strip()
        position = str(payload.get("position") or "").strip()
        office = str(payload.get("office") or "").strip()
        email = str(payload.get("email") or "").strip()
        photo = str(payload.get("photo") or "")
        if not 2 <= len(name) <= 100 or not 2 <= len(position) <= 100:
            self._send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": "Enter a name and designation between 2 and 100 characters."})
            return
        if len(office) > 120 or len(email) > 160 or (email and "@" not in email):
            self._send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": "Enter a valid office and email address."})
            return
        if photo and (not photo.startswith(ALLOWED_ADMIN_PHOTO_PREFIXES) or len(photo) > MAX_ADMIN_PROFILE_PHOTO_CHARACTERS):
            self._send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": "Choose a valid profile photo smaller than 750 KB."})
            return
        profile = {"name": name, "position": position, "office": office, "email": email, "photo": photo}
        try:
            _save_admin_profile(profile)
        except OSError:
            self._send_json(HTTPStatus.INTERNAL_SERVER_ERROR, {"error": "The administrator profile could not be saved."})
            return
        self._send_json(HTTPStatus.OK, profile)

    def _parse_student_pdf(self) -> None:
        """Extract text from a small, text-based student-list PDF without saving the upload."""
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_STUDENT_PDF_BYTES:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Choose a PDF smaller than 10 MB."})
            return
        try:
            reader = PdfReader(BytesIO(self.rfile.read(length)))
            if len(reader.pages) > MAX_STUDENT_PDF_PAGES:
                self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Choose a PDF with 25 pages or fewer."})
                return
            text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        except Exception:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "This PDF could not be read. Choose a valid, text-based PDF."})
            return
        if not text:
            self._send_json(HTTPStatus.UNPROCESSABLE_ENTITY, {"error": "No selectable text was found. Use CSV/Excel or OCR the scanned PDF first."})
            return
        if len(text) > MAX_STUDENT_PDF_TEXT_CHARACTERS:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "The extracted PDF text is too large to import."})
            return
        self._send_json(HTTPStatus.OK, {"text": text})

    def _login(self) -> None:
        if self._is_rate_limited():
            self._send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "Too many sign-in attempts. Try again in a few minutes."})
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > MAX_LOGIN_BODY_BYTES:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid sign-in request."})
            return
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            username = str(payload.get("username", "")).strip().lower()
            password = str(payload.get("password", ""))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": "Invalid sign-in request."})
            return
        account = USERS.get(username)
        if not account or not password_matches(password, account):
            self._record_failed_login()
            self._send_json(HTTPStatus.UNAUTHORIZED, {"error": "Incorrect username or password."})
            return
        LOGIN_ATTEMPTS.pop(self.client_address[0], None)
        token = secrets.token_urlsafe(32)
        SESSIONS[token] = {"username": username, "name": account["name"], "role": account["role"], "expires_at": time.time() + SESSION_SECONDS}
        cookie = f"gcw_karnal_session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age={SESSION_SECONDS}"
        self._send_json(HTTPStatus.OK, {"authenticated": True, "name": account["name"], "role": account["role"]}, cookie)

    def _logout(self) -> None:
        cookie = SimpleCookie(self.headers.get("Cookie"))
        token = cookie.get("gcw_karnal_session")
        if token:
            SESSIONS.pop(token.value, None)
        self._send_json(HTTPStatus.OK, {"authenticated": False}, "gcw_karnal_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the authenticated Government College for Women, Karnal ERP demo.")
    parser.add_argument("--port", type=int, default=8080)
    arguments = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", arguments.port), ERPRequestHandler)
    print(f"Government College for Women, Karnal ERP is running at http://127.0.0.1:{arguments.port}")
    print("Press Ctrl+C to stop the server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
