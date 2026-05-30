import { pgClient } from '../db/index';

const POLL_INTERVAL_MS = 10_000;

export async function runEscalationWorker(): Promise<void> {
  console.log('Escalation worker started');
  while (true) {
    try {
      const rules = await pgClient`
        SELECT * FROM escalation_rules WHERE is_active = true
      `;

      for (const rule of rules) {
        const cond = rule.condition as { status?: string; severity?: string; min_minutes?: number };
        const minMinutes = cond.min_minutes ?? 0;
        const targetStatus = rule.target_status;

        await pgClient.begin(async sql => {
          const staleAlerts = await sql`
            SELECT * FROM alerts
            WHERE company_id = ${rule.company_id}
              AND status     = ${cond.status ?? 'OPEN'}
              AND severity   = ${cond.severity ?? 'HIGH'}
              AND EXTRACT(EPOCH FROM (now() - status_changed_at)) / 60 > ${minMinutes}
            FOR UPDATE SKIP LOCKED
          `;

          for (const alert of staleAlerts) {
            try {
              await sql`
                UPDATE alerts
                SET status = ${targetStatus}, status_changed_at = now(), updated_at = now()
                WHERE id = ${alert.id} AND company_id = ${alert.company_id}
              `;
              await sql`
                INSERT INTO alert_events (alert_id, company_id, event_type, previous_value, new_value, created_by)
                VALUES (${alert.id}, ${alert.company_id}, 'ESCALATED',
                  ${JSON.stringify({ status: alert.status })},
                  ${JSON.stringify({ status: targetStatus })},
                  'system-escalation-worker')
              `;
              console.log(`Escalated alert ${alert.id} → ${targetStatus}`);
            } catch (err) {
              console.error(`Failed to escalate alert ${alert.id}:`, err);
            }
          }
        });
      }
    } catch (err) {
      console.error('Escalation worker loop error:', err);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

if (process.env.NODE_ENV !== 'test') {
  runEscalationWorker().catch(console.error);
}
