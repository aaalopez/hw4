"""
Password hashing helpers.

Passwords are never stored in plain text. We use PBKDF2-HMAC-SHA256 with a
random per-user salt and a high iteration count, in the format:

    pbkdf2_sha256$<salt>$<hex digest>

This matches the scheme already used by the seeded test user in
data/campus_customs.db (see users.password_hash), so the existing test
account (test@campuscustoms.yale.edu / password) logs in correctly and any
new account created through /api/auth/signup is stored the same way.
"""

import hashlib
import hmac
import secrets

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 120_000


def hash_password(password: str) -> str:
    """Hash a plaintext password with a fresh random salt."""
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS
    ).hex()
    return f"{ALGORITHM}${salt}${digest}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Check a plaintext password against a stored pbkdf2_sha256$salt$hash value."""
    try:
        algorithm, salt, digest_hex = stored_hash.split("$")
    except ValueError:
        return False

    if algorithm != ALGORITHM:
        return False

    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS
    ).hex()

    # Constant-time comparison so response timing can't leak how much of the
    # hash matched.
    return hmac.compare_digest(candidate, digest_hex)
