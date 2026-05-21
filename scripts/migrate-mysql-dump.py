#!/usr/bin/env python3
"""
MySQL dump → Supabase (PostgreSQL) 마이그레이션

사용법:
  python scripts/migrate-mysql-dump.py path/to/crossadmin_260520.sql

환경변수 (.env.local):
  NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from typing import Any

BATCH = 100

INSERT_RE = re.compile(
    r"INSERT INTO `(\w+)` VALUES (.+);",
    re.DOTALL,
)


def load_env_local() -> None:
    root = Path(__file__).resolve().parents[1]
    env_path = root / ".env.local"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def parse_sql_values(blob: str) -> list[list[Any]]:
    """MySQL INSERT VALUES (...) 단순 파서 (문자열/NULL/숫자)."""
    rows: list[list[Any]] = []
    i = 0
    n = len(blob)

    def skip_ws() -> None:
        nonlocal i
        while i < n and blob[i] in " \t\n\r":
            i += 1

    def read_value() -> Any:
        nonlocal i
        skip_ws()
        if i >= n:
            return None
        if blob[i : i + 4] == "NULL":
            i += 4
            return None
        if blob[i] == "'":
            i += 1
            chars: list[str] = []
            while i < n:
                c = blob[i]
                if c == "\\" and i + 1 < n:
                    chars.append(blob[i + 1])
                    i += 2
                    continue
                if c == "'":
                    i += 1
                    break
                chars.append(c)
                i += 1
            return "".join(chars)
        # number
        start = i
        while i < n and blob[i] not in ",)":
            i += 1
        token = blob[start:i].strip()
        if token == "":
            return None
        try:
            if "." in token:
                return float(token)
            return int(token)
        except ValueError:
            return token

    while i < n:
        skip_ws()
        if i >= n:
            break
        if blob[i] == ",":
            i += 1
            continue
        if blob[i] == "(":
            i += 1
            row: list[Any] = []
            while i < n:
                skip_ws()
                if blob[i] == ")":
                    i += 1
                    rows.append(row)
                    break
                row.append(read_value())
                skip_ws()
                if blob[i] == ",":
                    i += 1
            continue
        i += 1
    return rows


def extract_inserts(sql: str, table: str) -> list[list[Any]]:
    out: list[list[Any]] = []
    for m in INSERT_RE.finditer(sql):
        if m.group(1) != table:
            continue
        out.extend(parse_sql_values(m.group(2)))
    return out


def as_bool(v: Any) -> bool:
    if v is None:
        return False
    return int(v) == 0 if str(v).isdigit() or isinstance(v, int) else bool(v)


def as_int(v: Any, default: int = 0) -> int:
    if v is None:
        return default
    if isinstance(v, int):
        return v
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/migrate-mysql-dump.py path/to/crossadmin_260520.sql")
        sys.exit(1)

    dump_path = Path(sys.argv[1])
    if not dump_path.exists():
        print(f"File not found: {dump_path}")
        sys.exit(1)

    load_env_local()
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local")
        sys.exit(1)

    try:
        from supabase import create_client
    except ImportError:
        print("pip install supabase")
        sys.exit(1)

    client = create_client(url, key)
    sql = dump_path.read_text(encoding="utf-8", errors="replace")

    stats: dict[str, dict[str, int]] = {}

    def upsert_batch(table: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            stats.setdefault(table, {"ok": 0, "fail": 0})
            return
        ok = 0
        fail = 0
        for i in range(0, len(rows), BATCH):
            chunk = rows[i : i + BATCH]
            try:
                client.table(table).upsert(chunk, on_conflict="id").execute()
                ok += len(chunk)
            except Exception as e:
                fail += len(chunk)
                print(f"[FAIL] {table} batch {i}: {e}")
        stats[table] = {"ok": ok, "fail": fail}
        print(f"[{table}] inserted/upserted ok={ok} fail={fail}")

    # 1. universities
    univ_rows_raw = extract_inserts(sql, "univ")
    universities = []
    for r in univ_rows_raw:
        if len(r) < 11:
            continue
        if not as_bool(r[10]):  # is_delete=0
            continue
        universities.append(
            {
                "id": as_int(r[0]),
                "country": str(r[1] or "kr"),
                "name_kr": str(r[3] or ""),
                "name_en": str(r[4] or ""),
                "logo": str(r[8] or ""),
                "continent": str(r[2] or ""),
                "address": str(r[7] or ""),
                "sort_order": as_int(r[9], 99),
                "is_active": True,
            }
        )
    upsert_batch("universities", universities)

    univ_by_id = {u["id"]: u for u in universities}

    # 2. university_departments
    dept_rows_raw = extract_inserts(sql, "univ_dept")
    departments = []
    for r in dept_rows_raw:
        if len(r) < 5:
            continue
        if not as_bool(r[4]):
            continue
        departments.append(
            {
                "id": as_int(r[0]),
                "univ_id": as_int(r[1]),
                "dept_name": str(r[2] or ""),
                "dept_name_en": str(r[3] or ""),
                "is_active": True,
            }
        )
    upsert_batch("university_departments", departments)

    dept_by_id = {d["id"]: d for d in departments}

    # 3. admissions (user_admit)
    admit_rows = extract_inserts(sql, "user_admit")
    admissions = []
    for r in admit_rows:
        if len(r) < 12:
            continue
        if not as_bool(r[5]):  # is_delete=0 only
            continue
        uid = as_int(r[1])
        admissions.append(
            {
                "id": as_int(r[0]),
                "original_user_id": uid,
                "user_handle": f"user_{uid}",
                "year": as_int(r[2], 2020),
                "year_end": as_int(r[3], 0),
                "title": str(r[7] or ""),
                "input_score": str(r[8] or ""),
                "input_gpa": str(r[9] or ""),
                "input_specialty": str(r[10] or ""),
                "view_count": as_int(r[11], 0),
                "likes_count": as_int(r[12], 0) if len(r) > 12 else 0,
                "is_verified": bool(as_int(r[4], 0)),
                "is_featured": False,
                "published": True,
                "source": "mysql",
                "created_at": str(r[6]) if r[6] else None,
            }
        )
    upsert_batch("admissions", admissions)

    # 4. admission_schools (user_admit_upload)
    upload_rows = extract_inserts(sql, "user_admit_upload")
    schools = []
    for r in upload_rows:
        if len(r) < 14:
            continue
        if not as_bool(r[13]):  # is_delete
            continue
        dept_id = as_int(r[8]) if r[8] is not None else 0
        dept = dept_by_id.get(dept_id, {})
        univ_id = as_int(dept.get("univ_id", 0))
        univ = univ_by_id.get(univ_id, {})
        schools.append(
            {
                "id": as_int(r[0]),
                "admission_id": as_int(r[2]),
                "univ_id": univ_id,
                "dept_id": dept_id,
                "univ_name": str(univ.get("name_kr", "")),
                "dept_name": str(dept.get("dept_name", "")),
                "is_apply": as_bool(r[3]),
                "is_accept": as_bool(r[4]),
                "is_regist": as_bool(r[5]),
                "is_grad": as_bool(r[6]),
                "admission_type": str(r[10] or ""),
                "review": str(r[11] or ""),
                "thumbnail": str(r[9] or ""),
                "is_active": True,
                "created_at": str(r[7]) if r[7] else None,
            }
        )
    upsert_batch("admission_schools", schools)

    # 5. cross_comparisons (univ_dept_cross)
    cross_rows = extract_inserts(sql, "univ_dept_cross")
    crosses = []
    for r in cross_rows:
        if len(r) < 7:
            continue
        if not as_bool(r[6]):
            continue
        win_dept = dept_by_id.get(as_int(r[3]), {})
        lose_dept = dept_by_id.get(as_int(r[4]), {})
        win_univ = univ_by_id.get(as_int(win_dept.get("univ_id", 0)), {})
        lose_univ = univ_by_id.get(as_int(lose_dept.get("univ_id", 0)), {})
        crosses.append(
            {
                "id": as_int(r[0]),
                "admission_id": as_int(r[5]),
                "univ_id_win": as_int(r[1]),
                "univ_id_lose": as_int(r[2]),
                "univ_name_win": str(win_univ.get("name_kr", "")),
                "univ_name_lose": str(lose_univ.get("name_kr", "")),
                "dept_name_win": str(win_dept.get("dept_name", "")),
                "dept_name_lose": str(lose_dept.get("dept_name", "")),
                "dept_id_win": as_int(r[3]),
                "dept_id_lose": as_int(r[4]),
                "is_active": True,
            }
        )
    upsert_batch("cross_comparisons", crosses)

    print("\n=== Migration summary ===")
    for table, s in stats.items():
        print(f"  {table}: success={s['ok']}, failed={s['fail']}")


if __name__ == "__main__":
    main()
