import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { C } from '@/constants/Colors'
import { getAlerts, type AlertDelivery } from '@/lib/api'

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  Pending:      { bg: C.amberLt,  text: C.amber,  label: 'Pending' },
  Sent:         { bg: C.blueXlt,  text: C.blue,   label: 'Sent' },
  Failed:       { bg: C.redLt,    text: C.red,     label: 'Failed' },
  Acknowledged: { bg: C.greenLt,  text: C.green,   label: 'Acknowledged' },
  Escalated:    { bg: C.orangeLt, text: C.orange,  label: 'Escalated' },
  Suppressed:   { bg: C.border,   text: C.muted,   label: 'Suppressed' },
}

const CHANNEL_EMOJI: Record<string, string> = {
  Email: '✉️', Dashboard: '📊', Sms: '💬', WhatsApp: '📱',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const pending = alerts.filter((a) => a.status === 'Pending').length
  const failed = alerts.filter((a) => a.status === 'Failed').length

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Alert Deliveries</Text>
        <Text style={s.sub}>{alerts.length} alerts · {pending} pending · {failed} failed</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#fff" />}
      >
        {loading && alerts.length === 0 && (
          <Text style={s.emptyText}>Loading alerts…</Text>
        )}
        {!loading && alerts.length === 0 && (
          <Text style={s.emptyText}>No alert deliveries found.</Text>
        )}
        {alerts.map((alert) => {
          const ss = STATUS_STYLE[alert.status] ?? STATUS_STYLE.Suppressed
          return (
            <View key={alert.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: ss.bg }]}>
                  <Text style={[s.badgeText, { color: ss.text }]}>{ss.label}</Text>
                </View>
                <Text style={s.channel}>{CHANNEL_EMOJI[alert.channel] ?? '📡'} {alert.channel}</Text>
                <Text style={s.date}>{fmt(alert.createdAt)}</Text>
              </View>
              {alert.workItem && (
                <Text style={s.workTitle} numberOfLines={2}>{alert.workItem.title}</Text>
              )}
              {alert.workItem?.company && (
                <Text style={s.workCompany}>{alert.workItem.company}</Text>
              )}
              {alert.recipient && (
                <Text style={s.recipient}>→ {alert.recipient.name} · {alert.recipient.role}</Text>
              )}
              {alert.sentAt && (
                <Text style={s.sentAt}>Sent: {fmt(alert.sentAt)}</Text>
              )}
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  channel: { fontSize: 12, color: C.muted, flex: 1 },
  date: { fontSize: 11, color: C.muted },
  workTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  workCompany: { fontSize: 12, color: C.muted },
  recipient: { fontSize: 12, color: C.blue, fontWeight: '500' },
  sentAt: { fontSize: 11, color: C.muted },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 48, fontSize: 14 },
})
