#!/usr/bin/env python3
"""
MySQL dump → Supabase(PostgreSQL) 마이그레이션

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

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

try:
    from supabase import create_client
except ImportError:
    print("pip install supabase python-dotenv")
    sys.exit(1)

BATCH = 100

INSERT_RE = re.compile(
    r"INSERT\s+INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*(.+?);",
    re.IGNORECASE | re.DOTALL,
)


def load_env() -> None:
    root = Path(__file__).resolve().parents[1]
    env_path = root / ".env.local"
    if load_dotenv and env_path.exists():
        load_dotenv(env_path)


def parse_value(tok: str) -> Any:
    tok = tok.strip()
    if tok.upper() == "NULL":
        return None
    if tok.startswith("'") and tok.endswith("'"):
        return tok[1:-1].replace("\\'", "'").replace("\\\\", "\\")
    if tok.startswith('"') and tok.endswith('"'):
        return tok[1:-1]
    try:
        if "." in tok:
            return float(tok)
        return int(tok)
    except ValueError:
        return tok


def split_tuple_values(inner: str) -> list[str]:
    parts: list[str] = []
    cur: list[str] = []
    in_str = False
    esc = False
    for ch in inner:
        if esc:
            cur.append(ch)
            esc = False
            continue
        if ch == "\\":
            cur.append(ch)
            esc = True
            continue
        if ch == "'":
            in_str = not in_str
            cur.append(ch)
            continue
        if ch == "," and not in_str:
            parts.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return parts


def parse_insert_block(sql: str) -> list[tuple[str, list[str], list[list[Any]]]]:
    results: list[tuple[str, list[str], list[list[Any]]]] = []
    for m in INSERT_RE.finditer(sql):
        table = m.group(1).lower()
        cols = [c.strip().strip("`") for c in m.group(2).split(",")]
        values_blob = m.group(3).strip()
        tuples_raw = re.findall(r"\(([^)]*(?:\([^)]*\)[^)]*)*)\)", values_blob)
        rows: list[list[Any]] = []
        for t in tuples_raw:
            vals = [parse_value(v) for v in split_tuple_values(t)]
            rows.append(vals)
        if rows:
            results.append((table, cols, rows))
    return results


def row_dict(cols: list[str], vals: list[Any]) -> dict[str, Any]:
    d: dict[str, Any] = {}
    for i, c in enumerate(cols):
        if i < len(vals):
            d[c] = vals[i]
    return d


def tinyint_bool(v: Any) -> bool:
    if v is None:
        return False
    if isinstance(v, bool):
        return v
    return int(v) != 0


def map_university(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") not in (0, "0", False, None):
        if row.get("is_delete") == 1:
            return None
    return {
        "id": int(row["id"]),
        "country": str(row.get("country") or row.get("nation") or "kr"),
        "name_kr": str(row.get("name_kr") or row.get("name") or ""),
        "name_en": str(row.get("name_en") or row.get("name_eng") or ""),
        "logo": str(row.get("logo") or ""),
        "is_active": tinyint_bool(row.get("is_delete", 0)) is False
        if "is_delete" in row
        else True,
    }


def map_univ_dept(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "univ_id": int(row.get("univ_id") or row.get("university_id") or 0),
        "dept_name": str(row.get("dept_name") or row.get("name") or ""),
        "dept_name_en": str(row.get("dept_name_en") or row.get("name_en") or ""),
    }


def map_user_admit(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "original_user_id": int(row.get("user_id") or row.get("original_user_id") or 0),
        "user_handle": str(row.get("user_handle") or row.get("nickname") or "익명"),
        "year": int(row.get("year") or 0),
        "year_end": int(row.get("year_end") or row.get("year") or 0),
        "title": str(row.get("title") or ""),
        "input_score": str(row.get("input_score") or ""),
        "input_gpa": str(row.get("input_gpa") or ""),
        "input_specialty": str(row.get("input_specialty") or ""),
        "view_count": int(row.get("view_count") or row.get("hit") or 0),
        "likes_count": int(row.get("likes_count") or row.get("likes") or 0),
        "is_verified": tinyint_bool(row.get("is_verified", 0)),
        "is_featured": tinyint_bool(row.get("is_featured", 0)),
        "published": tinyint_bool(row.get("published", 1)),
        "source": str(row.get("source") or "mysql_import"),
        "created_at": str(row.get("created_at") or row.get("reg_date") or ""),
    }


def map_user_admit_upload(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "admission_id": int(row.get("user_admit_id") or row.get("admission_id") or 0),
        "univ_id": int(row.get("univ_id") or 0),
        "dept_id": int(row.get("dept_id") or row.get("univ_dept_id") or 0),
        "univ_name": str(row.get("univ_name") or ""),
        "dept_name": str(row.get("dept_name") or ""),
        "is_apply": tinyint_bool(row.get("is_apply", 1)),
        "is_accept": tinyint_bool(row.get("is_accept", 0)),
        "is_regist": tinyint_bool(row.get("is_regist", 0)),
        "is_grad": tinyint_bool(row.get("is_grad", 0)),
        "admission_type": str(row.get("admission_type") or ""),
        "review": str(row.get("review") or row.get("content") or ""),
        "thumbnail": str(row.get("thumbnail") or ""),
    }


def map_univ_dept_cross(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "admission_id": int(row.get("user_admit_id") or row.get("admission_id") or 0),
        "univ_id_win": int(row.get("univ_id_win") or row.get("win_univ_id") or 0),
        "univ_id_lose": int(row.get("univ_id_lose") or row.get("lose_univ_id") or 0),
        "univ_name_win": str(row.get("univ_name_win") or ""),
        "univ_name_lose": str(row.get("univ_name_lose") or ""),
        "dept_name_win": str(row.get("dept_name_win") or ""),
        "dept_name_lose": str(row.get("dept_name_lose") or ""),
    }


TABLE_MAP = {
    "univ": ("universities", map_university),
    "university": ("universities", map_university),
    "univ_dept": ("university_departments", map_univ_dept),
    "university_department": ("university_departments", map_univ_dept),
    "user_admit": ("admissions", map_user_admit),
    "user_admit_upload": ("admission_schools", map_user_admit_upload),
    "univ_dept_cross": ("cross_comparisons", map_univ_dept_cross),
}


def upsert_batches(client, table: str, rows: list[dict[str, Any]]) -> int:
    inserted = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        try:
            client.table(table).upsert(chunk, on_conflict="id").execute()
            inserted += len(chunk)
        except Exception as e:
            print(f"  [warn] {table} batch {i}: {e}")
            for row in chunk:
                try:
                    client.table(table).upsert(row, on_conflict="id").execute()
                    inserted += 1
                except Exception as e2:
                    print(f"    skip id={row.get('id')}: {e2}")
    return inserted


def main() -> None:
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    dump_path = Path(sys.argv[1])
    if not dump_path.exists():
        print(f"File not found: {dump_path}")
        sys.exit(1)

    load_env()
    url = os.environ.get("SUPABASE_URL") or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_URL"
    )
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env.local")
        sys.exit(1)

    print(f"Reading {dump_path}...")
    sql = dump_path.read_text(encoding="utf-8", errors="replace")
    blocks = parse_insert_block(sql)

    buckets: dict[str, list[dict[str, Any]]] = {
        "universities": [],
        "university_departments": [],
        "admissions": [],
        "admission_schools": [],
        "cross_comparisons": [],
    }

    for table, cols, rows in blocks:
        tkey = table.lower()
        if tkey not in TABLE_MAP:
            continue
        target, mapper = TABLE_MAP[tkey]
        for vals in rows:
            raw = row_dict(cols, vals)
            mapped = mapper(raw)
            if mapped:
                buckets[target].append(mapped)

    client = create_client(url, key)
    totals: dict[str, int] = {}

    print("\n=== Inserting ===")
    for table in [
        "universities",
        "university_departments",
        "admissions",
        "admission_schools",
        "cross_comparisons",
    ]:
        rows = buckets[table]
        print(f"{table}: {len(rows)} rows...")
        totals[table] = upsert_batches(client, table, rows) if rows else 0

    print("\n=== Result ===")
    for table, n in totals.items():
        print(f"  {table}: {n} inserted/upserted")


if __name__ == "__main__":
    main()
