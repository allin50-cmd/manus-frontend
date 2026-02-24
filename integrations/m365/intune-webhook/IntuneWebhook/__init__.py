"""
FineGuard MTD - Azure Function: Intune Webhook Receiver
========================================================

Receives Intune change notifications (device compliance, threats),
enriches via Microsoft Graph, maps to FineGuard firms, and takes
automated remediation actions (lock tenant, create tasks).

Deployment:
  Azure Functions Python v2 runtime
"""

import os
import json
import logging
import time
import uuid
from datetime import datetime, timedelta

import azure.functions as func
import requests
from azure.identity import DefaultAzureCredential

# ── Configuration via environment variables ──────────────────

FINEGUARD_API_BASE = os.getenv("FINEGUARD_API_BASE", "http://localhost:4000")
FINEGUARD_MCP_PROXY = os.getenv("FINEGUARD_MCP_PROXY", "")
KEYVAULT_NAME = os.getenv("KEYVAULT_NAME", "")
STORAGE_ACCOUNT_URL = os.getenv("AUDIT_BLOB_URL", "")
AUDIT_CONTAINER = os.getenv("AUDIT_CONTAINER", "fineguard-audit")
USE_MANAGED_IDENTITY = os.getenv("USE_MANAGED_IDENTITY", "true").lower() == "true"
GRAPH_SCOPE = "https://graph.microsoft.com/.default"
GRAPH_API = "https://graph.microsoft.com/v1.0"

FG_CLIENT_ID_SECRET_URI = os.getenv("FG_CLIENT_SECRET_KEYVAULT_URI", "")
FG_CLIENT_ID = os.getenv("FG_CLIENT_ID", "")
FG_TENANT_ID = os.getenv("FG_TENANT_ID", "")


# ── Audit Blob Writer ────────────────────────────────────────

def _write_audit_blob(event: dict):
    """Upload audit event to Azure Blob Storage (or /tmp fallback)."""
    try:
        credential = DefaultAzureCredential() if USE_MANAGED_IDENTITY else None
        if not STORAGE_ACCOUNT_URL:
            logging.warning("No AUDIT_BLOB_URL configured; writing audit to local /tmp/audit/")
            os.makedirs("/tmp/audit", exist_ok=True)
            fname = f"/tmp/audit/{int(time.time() * 1000)}-{event.get('action', 'event')}.json"
            with open(fname, "w") as fh:
                json.dump(event, fh)
            return {"localPath": fname}

        from azure.storage.blob import BlobServiceClient

        blob_service = BlobServiceClient(account_url=STORAGE_ACCOUNT_URL, credential=credential)
        container_client = blob_service.get_container_client(AUDIT_CONTAINER)
        try:
            container_client.create_container()
        except Exception:
            pass  # container already exists

        blob_name = f"{event.get('tenantId', 'unknown')}/{int(time.time() * 1000)}-{uuid.uuid4().hex}.json"
        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(json.dumps(event), overwrite=True)
        return {"blobUri": f"{STORAGE_ACCOUNT_URL}/{AUDIT_CONTAINER}/{blob_name}"}
    except Exception as e:
        logging.exception("Failed to write audit blob")
        return {"error": str(e)}


# ── Token Helpers ────────────────────────────────────────────

def _get_graph_token_client_credentials(tenant_id, client_id, client_secret):
    """Acquire Graph token via OAuth2 client credentials flow."""
    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "client_id": client_id,
        "scope": GRAPH_SCOPE,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
    }
    r = requests.post(token_url, data=data, timeout=10)
    r.raise_for_status()
    return r.json()["access_token"]


def _get_graph_token_managed_identity():
    """Acquire Graph token via Azure Managed Identity."""
    cred = DefaultAzureCredential()
    token = cred.get_token("https://graph.microsoft.com/.default")
    return token.token


def _get_fineguard_token():
    """Acquire token for FineGuard API (managed identity or client credentials)."""
    if USE_MANAGED_IDENTITY:
        try:
            cred = DefaultAzureCredential()
            token = cred.get_token(f"api://{FG_CLIENT_ID}/.default")
            return token.token
        except Exception:
            logging.info("Managed identity token for FineGuard not available, falling back to client credentials")

    if FG_CLIENT_ID and FG_CLIENT_ID_SECRET_URI:
        fg_secret = os.getenv("FG_CLIENT_SECRET", "")
        if not fg_secret:
            raise RuntimeError("FineGuard client secret not available")
        token_url = f"https://login.microsoftonline.com/{FG_TENANT_ID}/oauth2/v2.0/token"
        data = {
            "client_id": FG_CLIENT_ID,
            "scope": f"api://{FG_CLIENT_ID}/.default",
            "client_secret": fg_secret,
            "grant_type": "client_credentials",
        }
        r = requests.post(token_url, data=data, timeout=10)
        r.raise_for_status()
        return r.json()["access_token"]

    raise RuntimeError("No method to obtain FineGuard token configured")


# ── FineGuard API Helpers ────────────────────────────────────

def _map_device_to_firm(device, user):
    """Map an Intune device/user to a FineGuard firm via email lookup."""
    try:
        token = _get_fineguard_token()
        headers = {"Authorization": f"Bearer {token}"}
        email = user.get("mail") or user.get("userPrincipalName")
        if not email:
            return None
        r = requests.get(
            f"{FINEGUARD_API_BASE}/mcp/firms",
            params={"email": email},
            headers=headers,
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            if isinstance(data, list) and len(data) > 0:
                return data[0]
        return None
    except Exception:
        logging.exception("Error mapping device/user to firm")
        return None


def _create_remediation_task(firm_id, owner, due_date, priority, template, actor):
    """Create a remediation task in FineGuard."""
    try:
        token = _get_fineguard_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "firmId": firm_id,
            "owner": owner,
            "dueDate": due_date,
            "priority": priority,
            "template": template,
            "createdBy": actor,
        }
        r = requests.post(f"{FINEGUARD_API_BASE}/mcp/tasks", headers=headers, json=payload, timeout=10)
        return r.status_code, r.text
    except Exception as e:
        logging.exception("Failed to create remediation task")
        return 500, str(e)


def _lock_tenant(tenant_id, reason, actor):
    """Lock a tenant's submissions in FineGuard."""
    try:
        token = _get_fineguard_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {"reason": reason, "actor": actor}
        r = requests.post(
            f"{FINEGUARD_API_BASE}/admin/tenants/{tenant_id}/lock",
            headers=headers,
            json=payload,
            timeout=10,
        )
        return r.status_code, r.text
    except Exception as e:
        logging.exception("Failed to lock tenant")
        return 500, str(e)


def _unlock_tenant(tenant_id, actor):
    """Unlock a tenant's submissions in FineGuard."""
    try:
        token = _get_fineguard_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        r = requests.post(
            f"{FINEGUARD_API_BASE}/admin/tenants/{tenant_id}/unlock",
            headers=headers,
            json={"actor": actor},
            timeout=10,
        )
        return r.status_code, r.text
    except Exception as e:
        logging.exception("Failed to unlock tenant")
        return 500, str(e)


# ── Main Function Handler ────────────────────────────────────

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Functions HTTP trigger entry point for Intune webhook notifications."""
    try:
        # ── Subscription validation handshake ────────────────
        validation_token = req.params.get("validationToken")
        if validation_token:
            return func.HttpResponse(validation_token, status_code=200, mimetype="text/plain")

        # ── Parse request body ───────────────────────────────
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"error": "invalid JSON"}),
                status_code=400,
                mimetype="application/json",
            )

        if not body:
            return func.HttpResponse(
                json.dumps({"error": "empty payload"}),
                status_code=400,
                mimetype="application/json",
            )

        # ── Process Intune change notifications ──────────────
        events = body.get("value", [])
        results = []

        for ev in events:
            resource_data = ev.get("resourceData", {})
            device_id = resource_data.get("id")
            change_type = ev.get("changeType", "unknown")
            compliance_state = (
                resource_data.get("complianceState")
                or resource_data.get("deviceCompliancePolicyStates", {}).get("state")
            )
            user_id = resource_data.get("userId") or resource_data.get("userPrincipalName")
            severity = resource_data.get("severity", "normal")

            # ── Enrich via Microsoft Graph ───────────────────
            graph_token = None
            try:
                if USE_MANAGED_IDENTITY:
                    graph_token = _get_graph_token_managed_identity()
                else:
                    graph_token = _get_graph_token_client_credentials(
                        FG_TENANT_ID,
                        os.getenv("GRAPH_CLIENT_ID"),
                        os.getenv("GRAPH_CLIENT_SECRET"),
                    )
            except Exception:
                logging.exception("Failed to obtain Graph token")

            device = {}
            user = {}

            if graph_token and device_id:
                try:
                    r = requests.get(
                        f"{GRAPH_API}/devices/{device_id}",
                        headers={"Authorization": f"Bearer {graph_token}"},
                        timeout=10,
                    )
                    if r.status_code == 200:
                        device = r.json()
                except Exception:
                    logging.exception("Graph device fetch failed")

            if graph_token and user_id:
                try:
                    r = requests.get(
                        f"{GRAPH_API}/users/{user_id}",
                        headers={"Authorization": f"Bearer {graph_token}"},
                        timeout=10,
                    )
                    if r.status_code == 200:
                        user = r.json()
                except Exception:
                    logging.exception("Graph user fetch failed")

            # ── Map to FineGuard firm ────────────────────────
            mapped = _map_device_to_firm(device, user) or {}
            tenant_id = mapped.get("tenantId", "t-demo")

            # ── Decision engine ──────────────────────────────
            action_taken = []
            actor = "intune-webhook"
            timestamp = datetime.utcnow().isoformat() + "Z"
            audit_event = {
                "id": str(uuid.uuid4()),
                "tenantId": tenant_id,
                "actor": actor,
                "action": "intune.notification",
                "payload": {"event": ev, "device": device, "user": user},
                "createdAt": timestamp,
            }

            if compliance_state and compliance_state.lower() != "compliant":
                # Non-compliant: create remediation task and lock tenant
                due = (datetime.utcnow() + timedelta(days=1)).date().isoformat()
                firm_id = mapped.get("id")
                if firm_id:
                    status_code, resp_text = _create_remediation_task(
                        firm_id,
                        owner="ops-team",
                        due_date=due,
                        priority="P1",
                        template="device-remediation",
                        actor=actor,
                    )
                    action_taken.append({"taskCreated": status_code})

                lock_code, lock_resp = _lock_tenant(
                    tenant_id,
                    reason=f"device_noncompliant:{device_id}",
                    actor=actor,
                )
                action_taken.append({"tenantLocked": lock_code})
                audit_event["actionDetail"] = {"actions": action_taken}
            else:
                # Compliant: attempt to unlock tenant
                unlock_code, unlock_resp = _unlock_tenant(tenant_id, actor=actor)
                action_taken.append({"tenantUnlocked": unlock_code})
                audit_event["actionDetail"] = {"actions": action_taken}

            # ── Write audit blob ─────────────────────────────
            audit_result = _write_audit_blob(audit_event)
            audit_event["blob"] = audit_result
            results.append({
                "eventId": ev.get("id"),
                "actions": action_taken,
                "audit": audit_result,
            })

        return func.HttpResponse(
            json.dumps({"status": "accepted", "results": results}),
            status_code=202,
            mimetype="application/json",
        )

    except Exception as e:
        logging.exception("Unhandled error in IntuneWebhook")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            status_code=500,
            mimetype="application/json",
        )
