#!/usr/bin/env python3
"""Upload domain migration files and run remote-migrate-domain.sh on server."""
import os
import sys
from pathlib import Path

import paramiko

HOST = os.environ.get("BANYA_SSH_HOST", "89.108.88.31")
USER = os.environ.get("BANYA_SSH_USER", "root")
PASSWORD = os.environ.get("BANYA_SSH_PASSWORD", "")
ROOT = Path(__file__).resolve().parent.parent

FILES = [
    "deploy/nginx-banya.conf",
    "deploy/remote-fix-nginx.sh",
    "deploy/remote-setup-env.sh",
    "deploy/remote-setup-ssl.sh",
    "deploy/remote-verify.sh",
    "deploy/remote-fix-images.sh",
    "deploy/remote-migrate-domain.sh",
    "frontend/my-banya/public/index.html",
    "frontend/my-banya/src/pages/Home/Home.jsx",
    "frontend/my-banya/src/pages/Baths/Baths.jsx",
    "frontend/my-banya/src/pages/Baths/BathsCard/BathsCard.jsx",
    "frontend/my-banya/src/pages/Contacts/Contacts.jsx",
]


def upload(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    remote_dir = os.path.dirname(remote)
    parts = remote_dir.split("/")
    path = ""
    for part in parts:
        if not part:
            continue
        path += f"/{part}"
        try:
            sftp.stat(path)
        except OSError:
            try:
                sftp.mkdir(path)
            except OSError:
                pass
    data = local.read_bytes().replace(b"\r\n", b"\n")
    with sftp.open(remote, "w") as rf:
        rf.write(data)
    print(f"uploaded {local.relative_to(ROOT)}")


def main() -> int:
    if not PASSWORD:
        print("Set BANYA_SSH_PASSWORD", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
    sftp = client.open_sftp()

    for rel in FILES:
        local = ROOT / rel
        if not local.exists():
            print(f"skip missing {rel}")
            continue
        upload(sftp, local, f"/root/banya/{rel.replace(chr(92), '/')}")

    sftp.close()

    cmd = (
        "chmod +x /root/banya/deploy/*.sh && "
        "bash /root/banya/deploy/remote-migrate-domain.sh"
    )
    print(f"\n>>> Running migration on {HOST}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=1800)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    code = stdout.channel.recv_exit_status()
    if out:
        print(out[-15000:])
    if err:
        print("STDERR:", err[-5000:])
    print(f"EXIT: {code}")
    client.close()
    return code


if __name__ == "__main__":
    raise SystemExit(main())
