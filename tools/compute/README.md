# UltraCore Property Compute Prototype

Real business proof: property portfolio JSON in -> IPython kernel analysis -> hashed evidence receipt out.

## Run directly

```bash
python tools/compute/property_reconcile.py \
  tools/compute/sample-portfolio.json \
  --as-of 2026-08-14T10:15:00Z \
  --output receipt.json
```

## Run through an IPython/Jupyter kernel

Requires `jupyter_client` and a `python3` kernelspec:

```bash
python tools/compute/run_ipython.py \
  tools/compute/sample-portfolio.json \
  --as-of 2026-08-14T10:15:00Z
```

## Business outputs

- property / tenancy / certificate / maintenance counts
- active monthly and annualised rent
- expired certificates
- certificates expiring within 30 days
- open high/urgent maintenance
- duplicate source IDs
- orphaned property relationships
- deterministic `inputHash` and `resultHash`
- PASS or REVIEW_REQUIRED

The compute engine has no production credentials and performs no writes. Its output is evidence for the existing Runtime / approval path.
