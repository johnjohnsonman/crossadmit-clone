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
    import requests
    import urllib3

    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
except ImportError:
    print("pip install requests python-dotenv urllib3")
    sys.exit(1)

BATCH = 100

INSERT_RE_COLS = re.compile(
    r"INSERT\s+INTO\s+`?(\w+)`?\s*\(([^)]+)\)\s*VALUES\s*(.+?);",
    re.IGNORECASE | re.DOTALL,
)
INSERT_RE_VALS = re.compile(
    r"INSERT\s+INTO\s+`?(\w+)`?\s*VALUES\s*(.+?);",
    re.IGNORECASE | re.DOTALL,
)

# mysqldump 기본 형식: INSERT INTO `table` VALUES (...) — 컬럼명 없음
TABLE_COLUMNS: dict[str, list[str]] = {
    "univ": [
        "id",
        "country",
        "continent",
        "univ_name",
        "univ_name_en",
        "word_kr",
        "word_en",
        "address",
        "logo",
        "sort_order",
        "is_delete",
    ],
    "univ_dept": ["id", "univ_id", "dept_name", "dept_name_en", "is_delete"],
    "user_admit": [
        "id",
        "user_id",
        "year",
        "year_end",
        "is_verify",
        "is_delete",
        "ctime",
        "title",
        "input_score",
        "input_gpa",
        "input_specialty",
        "view_cnt",
        "man_like",
    ],
    "user_admit_upload": [
        "id",
        "user_id",
        "user_admit_id",
        "is_apply",
        "is_accept",
        "is_regist",
        "is_grad",
        "univ_dept_id",
        "image",
        "thumbnail",
        "ctime",
        "sat_type",
        "comment",
        "is_delete",
        "category_help",
        "image_else",
    ],
    "univ_dept_cross": [
        "id",
        "univ_id_win",
        "univ_id_lose",
        "univ_dept_id_win",
        "univ_dept_id_lose",
        "user_admit_id",
        "is_delete",
    ],
}


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


def _extract_tuple_inners(values_blob: str) -> list[str]:
    """VALUES blob에서 최상위 (...) 내부 문자열만 추출 (문자열 내 괄호 무시)."""
    inners: list[str] = []
    i = 0
    n = len(values_blob)
    while i < n:
        if values_blob[i] != "(":
            i += 1
            continue
        i += 1
        start = i
        depth = 1
        in_str = False
        esc = False
        while i < n and depth > 0:
            ch = values_blob[i]
            if esc:
                esc = False
                i += 1
                continue
            if ch == "\\" and in_str:
                esc = True
                i += 1
                continue
            if ch == "'":
                in_str = not in_str
                i += 1
                continue
            if not in_str:
                if ch == "(":
                    depth += 1
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        inners.append(values_blob[start:i])
                        i += 1
                        break
            i += 1
    return inners


def _parse_values_blob(values_blob: str) -> list[list[Any]]:
    rows: list[list[Any]] = []
    for inner in _extract_tuple_inners(values_blob):
        vals = [parse_value(v) for v in split_tuple_values(inner)]
        rows.append(vals)
    return rows


INSERT_LINE_RE = re.compile(
    r"^INSERT\s+INTO\s+`?(\w+)`?\s*VALUES\s*(.+)$",
    re.IGNORECASE,
)


def parse_insert_block(sql: str) -> list[tuple[str, list[str], list[list[Any]]]]:
    results: list[tuple[str, list[str], list[list[Any]]]] = []
    for m in INSERT_RE_COLS.finditer(sql):
        table = m.group(1).lower()
        cols = [c.strip().strip("`") for c in m.group(2).split(",")]
        rows = _parse_values_blob(m.group(3).strip())
        if rows:
            results.append((table, cols, rows))
    for line in sql.splitlines():
        m = INSERT_LINE_RE.match(line.strip())
        if not m:
            continue
        table = m.group(1).lower()
        if table not in TABLE_COLUMNS:
            continue
        blob = m.group(2).strip().rstrip(";").strip()
        cols = TABLE_COLUMNS[table]
        rows = _parse_values_blob(blob)
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
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "country": str(row.get("country") or "kr"),
        "name_kr": str(row.get("univ_name") or row.get("name_kr") or ""),
        "name_en": str(row.get("univ_name_en") or row.get("name_en") or ""),
        "logo": str(row.get("logo") or ""),
        "is_active": not tinyint_bool(row.get("is_delete", 0)),
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
    year = int(row.get("year") or 0)
    year_end = int(row.get("year_end") or year)
    return {
        "id": int(row["id"]),
        "original_user_id": int(row.get("user_id") or 0),
        "user_handle": "익명",
        "year": year,
        "year_end": year_end,
        "title": str(row.get("title") or ""),
        "input_score": str(row.get("input_score") or ""),
        "input_gpa": str(row.get("input_gpa") or ""),
        "input_specialty": str(row.get("input_specialty") or ""),
        "view_count": int(row.get("view_cnt") or 0),
        "likes_count": int(row.get("man_like") or 0),
        "is_verified": tinyint_bool(row.get("is_verify", 0)),
        "is_featured": False,
        "published": True,
        "source": "mysql_import",
        "created_at": str(row.get("ctime") or ""),
    }


def map_user_admit_upload(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    dept_id = row.get("univ_dept_id")
    return {
        "id": int(row["id"]),
        "admission_id": int(row.get("user_admit_id") or 0),
        "univ_id": 0,
        "dept_id": int(dept_id) if dept_id else 0,
        "univ_name": "",
        "dept_name": "",
        "is_apply": tinyint_bool(row.get("is_apply", 0)),
        "is_accept": tinyint_bool(row.get("is_accept", 0)),
        "is_regist": tinyint_bool(row.get("is_regist", 0)),
        "is_grad": tinyint_bool(row.get("is_grad", 0)),
        "admission_type": str(row.get("sat_type") or ""),
        "review": str(row.get("comment") or ""),
        "thumbnail": str(row.get("thumbnail") or ""),
    }


def map_univ_dept_cross(row: dict[str, Any]) -> dict[str, Any] | None:
    if row.get("is_delete") == 1:
        return None
    return {
        "id": int(row["id"]),
        "admission_id": int(row.get("user_admit_id") or 0),
        "univ_id_win": int(row.get("univ_id_win") or 0),
        "univ_id_lose": int(row.get("univ_id_lose") or 0),
        "dept_id_win": int(row.get("univ_dept_id_win") or 0),
        "dept_id_lose": int(row.get("univ_dept_id_lose") or 0),
        "univ_name_win": "",
        "univ_name_lose": "",
        "dept_name_win": "",
        "dept_name_lose": "",
    }


def build_lookups(
    universities: list[dict[str, Any]],
    departments: list[dict[str, Any]],
) -> tuple[dict[int, str], dict[int, dict[str, Any]]]:
    univ_names = {u["id"]: u["name_kr"] for u in universities}
    dept_by_id: dict[int, dict[str, Any]] = {}
    for d in departments:
        dept_by_id[d["id"]] = {
            "univ_id": d["univ_id"],
            "dept_name": d["dept_name"],
            "univ_name": univ_names.get(d["univ_id"], ""),
        }
    return univ_names, dept_by_id


def enrich_admission_schools(
    rows: list[dict[str, Any]], dept_by_id: dict[int, dict[str, Any]]
) -> None:
    for r in rows:
        dept = dept_by_id.get(r.get("dept_id") or 0)
        if not dept:
            continue
        r["univ_id"] = dept["univ_id"]
        r["univ_name"] = dept["univ_name"]
        r["dept_name"] = dept["dept_name"]


def enrich_cross_comparisons(
    rows: list[dict[str, Any]],
    univ_names: dict[int, str],
    dept_by_id: dict[int, dict[str, Any]],
) -> None:
    for r in rows:
        r["univ_name_win"] = univ_names.get(r.get("univ_id_win") or 0, "")
        r["univ_name_lose"] = univ_names.get(r.get("univ_id_lose") or 0, "")
        win = dept_by_id.get(r.pop("dept_id_win", 0) or 0)
        lose = dept_by_id.get(r.pop("dept_id_lose", 0) or 0)
        if win:
            r["dept_name_win"] = win["dept_name"]
            if not r["univ_name_win"]:
                r["univ_name_win"] = win["univ_name"]
        if lose:
            r["dept_name_lose"] = lose["dept_name"]
            if not r["univ_name_lose"]:
                r["univ_name_lose"] = lose["univ_name"]


TABLE_MAP = {
    "univ": ("universities", map_university),
    "university": ("universities", map_university),
    "univ_dept": ("university_departments", map_univ_dept),
    "university_department": ("university_departments", map_univ_dept),
    "user_admit": ("admissions", map_user_admit),
    "user_admit_upload": ("admission_schools", map_user_admit_upload),
    "univ_dept_cross": ("cross_comparisons", map_univ_dept_cross),
}


def upsert_batches(
    base_url: str, key: str, table: str, rows: list[dict[str, Any]]
) -> int:
    endpoint = f"{base_url.rstrip('/')}/rest/v1/{table}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    inserted = 0
    for i in range(0, len(rows), BATCH):
        chunk = rows[i : i + BATCH]
        try:
            resp = requests.post(
                endpoint,
                json=chunk,
                headers=headers,
                timeout=120,
                verify=False,
            )
            if resp.status_code >= 400:
                raise RuntimeError(f"HTTP {resp.status_code}: {resp.text[:500]}")
            inserted += len(chunk)
        except Exception as e:
            print(f"  [warn] {table} batch {i}: {e}")
            for row in chunk:
                try:
                    resp = requests.post(
                        endpoint,
                        json=row,
                        headers=headers,
                        timeout=60,
                        verify=False,
                    )
                    if resp.status_code >= 400:
                        raise RuntimeError(
                            f"HTTP {resp.status_code}: {resp.text[:300]}"
                        )
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

    univ_names, dept_by_id = build_lookups(
        buckets["universities"], buckets["university_departments"]
    )
    enrich_admission_schools(buckets["admission_schools"], dept_by_id)
    enrich_cross_comparisons(
        buckets["cross_comparisons"], univ_names, dept_by_id
    )

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
        totals[table] = upsert_batches(url, key, table, rows) if rows else 0

    print("\n=== Result ===")
    for table, n in totals.items():
        print(f"  {table}: {n} inserted/upserted")


if __name__ == "__main__":
    main()
