#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path

from jupyter_client import KernelManager


def main() -> int:
    parser = argparse.ArgumentParser(description="Run property reconciliation inside an IPython kernel.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--as-of", required=True)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    module_dir = repo_root / "tools" / "compute"
    code = f'''\nimport json, sys\nsys.path.insert(0, {str(module_dir)!r})\nfrom property_reconcile import analyse, parse_date\npayload = json.load(open({str(args.input.resolve())!r}, 'r', encoding='utf-8'))\nreceipt = analyse(payload, now=parse_date({args.as_of!r}))\nprint("ULTRACORE_RECEIPT=" + json.dumps(receipt, sort_keys=True))\n'''

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
        print(json.dumps(receipt, indent=2, sort_keys=True))
        return 0
    finally:
        client.stop_channels()
        km.shutdown_kernel(now=True)


if __name__ == "__main__":
    raise SystemExit(main())
