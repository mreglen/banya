#!/usr/bin/env python3
"""Upload deploy scripts and run on remote server."""
import os
import sys
from pathlib import Path

import paramiko

HOST = os.environ.get("BANYA_SSH_HOST", "89.108.88.31")
USER = os.environ.get("BANYA_SSH_USER", "root")
PASSWORD = os.environ.get("BANYA_SSH_PASSWORD", "")
DEPLOY_DIR = Path(__file__).resolve().parent


def upload_scripts(sftp: paramiko.SFTPClient) -> None:
    try:
        sftp.mkdir("/root/banya/deploy")
    except OSError:
        pass
    for f in DEPLOY_DIR.iterdir():
        if f.is_file() and f.suffix in {".sh", ".service", ".conf", ".py"}:
            data = f.read_bytes().replace(b"\r\n", b"\n")
            remote = f"/root/banya/deploy/{f.name}"
            with sftp.open(remote, "w") as rf:
                rf.write(data)
            print(f"uploaded {f.name}")


def run(client: paramiko.SSHClient, script: str, timeout: int = 900) -> int:
    cmd = f"chmod +x /root/banya/deploy/{script} && bash /root/banya/deploy/{script}"
    print(f"\n>>> Running {script}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    def safe_print(text: str) -> None:
        sys.stdout.buffer.write(
            (text[-12000:] if len(text) > 12000 else text).encode("utf-8", errors="replace")
        )
        sys.stdout.buffer.write(b"\n")

    if out:
        safe_print(out)
    if err:
        safe_print("STDERR: " + err)
    code = stdout.channel.recv_exit_status()
    print(f"EXIT: {code}")
    return code


def main() -> int:
    if not PASSWORD:
        print("Set BANYA_SSH_PASSWORD environment variable", file=sys.stderr)
        return 1
    scripts = sys.argv[1:] or [
        "remote-setup-backend.sh",
        "remote-setup-env.sh",
        "remote-setup-frontend-nginx.sh",
    ]
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()
    upload_scripts(sftp)
    sftp.close()
    for script in scripts:
        code = run(client, script, timeout=1200 if "frontend" in script else 600)
        if code != 0:
            client.close()
            return code
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
