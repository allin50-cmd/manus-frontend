#!/usr/bin/env python3
import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from jupyter_client import KernelManager


def main() -> int:
    parser = argparse.ArgumentParser(description="Run property reconciliation inside an IPython kernel.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--as-of", default=None, help="ISO-8601 timestamp; defaults to current UTC time")
    parser.add_argument("--output", type=Path, default=None, help="optional receipt JSON output path")
    args = parser.parse_args()

    as_of = args.as_of or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    repo_root = Path(__file__).resolve().parents[2]
    module_dir = repo_root / "tools" / "compute"
    code = f'''\nimport json, sys\nsys.path.insert(0, {str(module_dir)!r})\nfrom property_reconcile import analyse, parse_date\npayload = json.load(open({str(args.input.resolve())!r}, 'r', encoding='utf-8'))\nreceipt = analyse(payload, now=parse_date({as_of!r}))\nprint("ULTRACORE_RECEIPT=" + json.dumps(receipt, sort_keys=True))\n'''

    km = KernelManager(kernel_name=os.environ.get("ULTRACORE_KERNEL", "python3"))
    km.start_kernel()
    client = km.client()
    client.start_channels()
    try:
        client.wait_for_ready(timeout=20)
        msg_id = client.execute(code, stop_on_error=True)
        receipt = None
        while True:
            msg = client.get_iopub_msg(timeout=30)
            if msg.get("parent_header", {}).get("msg_id") != msg_id:
                continue
            msg_type = msg["header"]["msg_type"]
            content = msg["content"]
            if msg_type == "stream":
                for line in content.get("text", "").splitlines():
                    if line.startswith("ULTRACORE_RECEIPT="):
                        receipt = json.loads(line.split("=", 1)[1])
            elif msg_type == "error":
                raise RuntimeError("\n".join(content.get("traceback", [])))
            elif msg_type == "status" and content.get("execution_state") == "idle":
                break
        if receipt is None:
            raise RuntimeError("kernel completed without receipt")
        rendered = json.dumps(receipt, indent=2, sort_keys=True)
        if args.output:
            args.output.parent.mkdir(parents=True, exist_ok=True)
            args.output.write_text(rendered + "\n", encoding="utf-8")
        print(rendered)
        return 0
    finally:
        client.stop_channels()
        km.shutdown_kernel(now=True)


if __name__ == "__main__":
    raise SystemExit(main())
