#!/usr/bin/env python3
import argparse, json, subprocess, sys
from pathlib import Path

HERE=Path(__file__).resolve().parent

def run(cmd):
    p=subprocess.run(cmd,cwd=HERE.parent.parent,text=True,capture_output=True)
    if p.returncode:
        sys.stderr.write(p.stdout+p.stderr)
        raise SystemExit(p.returncode)
    if p.stdout: print(p.stdout.strip())

def main():
    ap=argparse.ArgumentParser(description='UltraCore property business compute: export/ingest -> IPython reconciliation -> evidence receipt')
    src=ap.add_mutually_exclusive_group(required=True)
    src.add_argument('--manus',action='store_true',help='discover/export from MANUS_BASE_URL')
    src.add_argument('--input',help='normalized portfolio JSON')
    ap.add_argument('--output',default='tools/compute/property-compute-receipt.json')
    args=ap.parse_args()

    if args.manus:
        portfolio=HERE/'manus-portfolio.json'
        run([sys.executable,str(HERE/'manus_export_adapter.py'),str(portfolio)])
    else:
        portfolio=Path(args.input).resolve()
        if not portfolio.exists(): raise SystemExit(f'input not found: {portfolio}')

    out=Path(args.output).resolve()
    out.parent.mkdir(parents=True,exist_ok=True)
    run([sys.executable,str(HERE/'run_ipython.py'),str(portfolio),str(out)])
    receipt=json.loads(out.read_text())
    result=receipt['result']
    print(json.dumps({
      'status':result['status'],
      'properties':result['counts']['properties'],
      'activeTenancies':result['counts']['activeTenancies'],
      'activeMonthlyRentGBP':result['financials']['activeMonthlyRentGBP'],
      'annualisedRentGBP':result['financials']['annualisedRentGBP'],
      'expiredCertificates':len(result['compliance']['expired']),
      'expiringWithin30Days':len(result['compliance']['expiringWithin30Days']),
      'highPriorityOpenMaintenance':len(result['maintenance']['highPriorityOpen']),
      'issues':result['issues'],
      'inputHash':receipt['inputHash'],
      'resultHash':receipt['resultHash'],
      'receipt':str(out),
    },indent=2))

if __name__=='__main__': main()
