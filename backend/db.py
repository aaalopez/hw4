"""
Shared SQLite connection helper.

Used by main.py (API routes) and tools.py (agent tools) so both talk to the
same database the same way, regardless of which folder the process was
started from.
"""

import sqlite3
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
DB_PATH = ROOT_DIR / "data" / "campus_customs.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn
