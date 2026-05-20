#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"
BACKEND_ENV = BACKEND_DIR / ".env"
FRONTEND_ENV = FRONTEND_DIR / ".env"

BACKEND_LOCAL_URL = "http://localhost:8000"
FRONTEND_LOCAL_URL = "http://localhost:3000"
TUNNEL_URL_RE = re.compile(r"https://[a-z0-9-]+\.trycloudflare\.com")


def log(prefix: str, line: str) -> None:
    print(f"[{prefix}] {line}", end="", flush=True)


def forward_output(prefix: str, process: subprocess.Popen[str]) -> None:
    assert process.stdout is not None
    for line in process.stdout:
        log(prefix, line)


def start_process(
    prefix: str,
    command: list[str],
    cwd: Path = ROOT,
) -> subprocess.Popen[str]:
    process = subprocess.Popen(
        command,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    threading.Thread(
        target=forward_output,
        args=(prefix, process),
        daemon=True,
    ).start()
    return process


def start_tunnel(prefix: str, target_url: str) -> tuple[subprocess.Popen[str], str]:
    process = subprocess.Popen(
        ["cloudflared", "tunnel", "--url", target_url],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )

    assert process.stdout is not None
    tunnel_url = ""
    while True:
        line = process.stdout.readline()
        if not line:
            raise RuntimeError(f"{prefix} tunnel stopped before URL was created")

        log(prefix, line)

        match = TUNNEL_URL_RE.search(line)
        if match:
            tunnel_url = match.group(0)
            break

    def continue_forwarding() -> None:
        for line in process.stdout:
            log(prefix, line)

    threading.Thread(target=continue_forwarding, daemon=True).start()
    return process, tunnel_url


def parse_env(path: Path) -> tuple[list[str], dict[str, str]]:
    lines = path.read_text().splitlines() if path.exists() else []
    values: dict[str, str] = {}
    for line in lines:
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key] = value
    return lines, values


def replace_generated_trycloudflare(value: str, replacement: str) -> str:
    parts = [part.strip() for part in value.split(",") if part.strip()]
    parts = [part for part in parts if not part.endswith(".trycloudflare.com")]
    parts.append(replacement)
    return ",".join(dict.fromkeys(parts))


def replace_generated_trycloudflare_origin(value: str, replacement: str) -> str:
    parts = [part.strip() for part in value.split(",") if part.strip()]
    parts = [
        part
        for part in parts
        if not re.fullmatch(r"https://[a-z0-9-]+\.trycloudflare\.com", part)
    ]
    parts.append(replacement)
    return ",".join(dict.fromkeys(parts))


def write_env(path: Path, updates: dict[str, str]) -> None:
    lines, existing = parse_env(path)
    seen: set[str] = set()
    next_lines: list[str] = []

    for line in lines:
        if not line or line.lstrip().startswith("#") or "=" not in line:
            next_lines.append(line)
            continue

        key, _value = line.split("=", 1)
        if key in updates:
            next_lines.append(f"{key}={updates[key]}")
            seen.add(key)
        else:
            next_lines.append(line)

    missing = [key for key in updates if key not in seen and key not in existing]
    if missing and next_lines and next_lines[-1] != "":
        next_lines.append("")

    for key in missing:
        next_lines.append(f"{key}={updates[key]}")

    path.write_text("\n".join(next_lines).rstrip() + "\n")


def update_env_files(backend_url: str, frontend_url: str) -> None:
    backend_host = backend_url.removeprefix("https://")
    _backend_lines, backend_values = parse_env(BACKEND_ENV)

    write_env(
        BACKEND_ENV,
        {
            "DJANGO_ALLOWED_HOSTS": replace_generated_trycloudflare(
                backend_values.get(
                    "DJANGO_ALLOWED_HOSTS",
                    "localhost,127.0.0.1,0.0.0.0",
                ),
                backend_host,
            ),
            "DJANGO_CORS_ALLOWED_ORIGINS": replace_generated_trycloudflare_origin(
                backend_values.get(
                    "DJANGO_CORS_ALLOWED_ORIGINS",
                    "http://localhost:3000,https://localhost:3000",
                ),
                frontend_url,
            ),
            "LIQPAY_SERVER_URL": f"{backend_url}/payments/liqpay/callback",
            "LIQPAY_RESULT_URL": f"{frontend_url}/checkout",
        },
    )

    write_env(
        FRONTEND_ENV,
        {
            "NEXT_PUBLIC_API_URL": backend_url,
            "NEXT_PUBLIC_MEDIA_HOST": backend_url,
        },
    )


def terminate(processes: list[subprocess.Popen[str]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()

    for process in processes:
        if process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


def main() -> int:
    processes: list[subprocess.Popen[str]] = []

    try:
        backend_tunnel, backend_url = start_tunnel("backend-tunnel", BACKEND_LOCAL_URL)
        processes.append(backend_tunnel)

        frontend_tunnel, frontend_url = start_tunnel(
            "frontend-tunnel", FRONTEND_LOCAL_URL
        )
        processes.append(frontend_tunnel)

        update_env_files(backend_url, frontend_url)

        print("\nLiqPay dev URLs:")
        print(f"  Backend:  {backend_url}")
        print(f"  Frontend: {frontend_url}")
        print(f"  Checkout: {frontend_url}/uk/checkout")
        print("\nUpdated backend/.env and frontend/.env. Starting dev servers...\n")

        processes.append(
            start_process(
                "backend",
                ["uv", "run", "python", "manage.py", "runserver"],
                BACKEND_DIR,
            )
        )
        processes.append(start_process("frontend", ["npm", "run", "dev"], FRONTEND_DIR))

        while True:
            for process in processes:
                if process.poll() is not None:
                    terminate(processes)
                    return process.returncode or 0
            threading.Event().wait(1)
    except KeyboardInterrupt:
        print("\nStopping LiqPay dev processes...")
        terminate(processes)
        return 0
    except Exception as exc:
        print(f"\nFailed to start LiqPay dev environment: {exc}", file=sys.stderr)
        terminate(processes)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
