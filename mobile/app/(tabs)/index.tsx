import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Alert,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { C } from '@/constants/Colors'
import { getDashboard, logout, type DashboardData } from '@/lib/api'
import { useRouter } from 'expo-router'

const PRIORITY_COLOR: Record<string, string> = {
  Urgent: C.red,
  High: C.orange,
  Medium: C.amber,
  Low: C.muted,
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function isOverdue(iso: string | null) {
  return iso ? new Date(iso) < new Date() : false
}

export default function DashboardScreen() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const d = await getDashboard()
      setData(d)
    } catch {
      // silent — show stale data if any
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => { await logout(); router.replace('/(auth)/login') },
      },
    ])
  }

  const { compliance, metrics, priorityItems, teamPulse } = data ?? {
    compliance: { compliant: 0, atRisk: 0, actionRequired: 0, overdue: 0, total: 0 },
    metrics: { openActions: 0, decisionNeeded: 0, alertDeliveries: 0, completedThisWeek: 0 },
    priorityItems: [],
    teamPulse: [],
  }

  const grandTotal = Math.max(compliance.total, 1)
  const pct = (n: number) => Math.round((n / grandTotal) * 100)

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase()

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}><Text style={s.logoEmoji}>🛡️</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>FineGuard</Text>
            <Text style={s.headerSub}>Compliance Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.dateText}>{today}</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#fff" />}
      >
        {/* Compliance status card */}
        <View style={s.card}>
          <Text style={s.sectionLabel}>OVERALL COMPLIANCE STATUS</Text>
          <View style={s.complianceGrid}>
            <View style={[s.complianceTile, { backgroundColor: C.greenLt }]}>
              <Text style={[s.tileNum, { color: C.green }]}>{compliance.compliant}</Text>
              <Text style={[s.tileLabel, { color: C.green }]}>✓ Compliant</Text>
              <Text style={[s.tilePct, { color: C.green }]}>{pct(compliance.compliant)}%</Text>
            </View>
            <View style={[s.complianceTile, { backgroundColor: C.amberLt }]}>
              <Text style={[s.tileNum, { color: C.amber }]}>{compliance.atRisk}</Text>
              <Text style={[s.tileLabel, { color: C.amber }]}>⚡ At Risk</Text>
              <Text style={[s.tilePct, { color: C.amber }]}>{pct(compliance.atRisk)}%</Text>
            </View>
            <View style={[s.complianceTile, { backgroundColor: C.orangeLt }]}>
              <Text style={[s.tileNum, { color: C.orange }]}>{compliance.actionRequired}</Text>
              <Text style={[s.tileLabel, { color: C.orange }]}>⚠ Action</Text>
              <Text style={[s.tilePct, { color: C.orange }]}>{pct(compliance.actionRequired)}%</Text>
            </View>
            <View style={[s.complianceTile, { backgroundColor: C.redLt }]}>
              <Text style={[s.tileNum, { color: C.red }]}>{compliance.overdue}</Text>
              <Text style={[s.tileLabel, { color: C.red }]}>🔴 Overdue</Text>
              <Text style={[s.tilePct, { color: C.red }]}>{pct(compliance.overdue)}%</Text>
            </View>
          </View>
          {/* Progress strip */}
          <View style={s.progressStrip}>
            <View style={[s.progressSeg, { flex: compliance.compliant || 0.01, backgroundColor: C.green, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
            <View style={[s.progressSeg, { flex: compliance.atRisk || 0.01, backgroundColor: C.amber }]} />
            <View style={[s.progressSeg, { flex: compliance.actionRequired || 0.01, backgroundColor: C.orange }]} />
            <View style={[s.progressSeg, { flex: compliance.overdue || 0.01, backgroundColor: C.red, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
          </View>
          <View style={s.cardFooter}>
            <Text style={s.footerText}>{compliance.total} active obligations</Text>
            <Text style={s.footerText}>{metrics.completedThisWeek} completed this week ✓</Text>
          </View>
        </View>

        {/* Metrics */}
        <View style={s.metricsGrid}>
          <MetricCard label="Active Items" value={compliance.total} color={C.blue} bg={C.blueXlt} />
          <MetricCard label="Open Actions" value={metrics.openActions} color={metrics.openActions > 0 ? C.orange : C.green} bg={metrics.openActions > 0 ? C.orangeLt : C.greenLt} />
          <MetricCard label="Decisions" value={metrics.decisionNeeded} color={metrics.decisionNeeded > 0 ? C.purple : C.green} bg={metrics.decisionNeeded > 0 ? C.purpleLt : C.greenLt} />
          <MetricCard label="Alerts" value={metrics.alertDeliveries} color={metrics.alertDeliveries > 0 ? C.orange : C.green} bg={metrics.alertDeliveries > 0 ? C.orangeLt : C.greenLt} />
        </View>

        {/* Priority items */}
        {priorityItems.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionLabel}>PRIORITY ITEMS</Text>
            {priorityItems.map((item) => (
              <View key={item.id} style={s.itemRow}>
                <View style={[s.priorityDot, { backgroundColor: PRIORITY_COLOR[item.priority] ?? C.muted }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>
                  {item.company && <Text style={s.itemSub} numberOfLines={1}>{item.company}</Text>}
                </View>
                {item.dueDate && (
                  <Text style={[s.itemDate, isOverdue(item.dueDate) && s.itemDateOverdue]}>
                    {fmt(item.dueDate)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Team pulse */}
        {teamPulse.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionLabel}>TEAM PULSE</Text>
            <View style={s.pulseRow}>
              {teamPulse.map(({ owner, count }) => (
                <View key={owner} style={s.pulseChip}>
                  <View style={s.pulseAvatar}>
                    <Text style={s.pulseAvatarText}>{owner[0]}</Text>
                  </View>
                  <Text style={s.pulseOwner}>{owner}</Text>
                  <View style={[s.pulseBadge, count > 0 && s.pulseBadgeActive]}>
                    <Text style={[s.pulseBadgeText, count > 0 && s.pulseBadgeTextActive]}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function MetricCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <View style={[s.metricCard, { backgroundColor: bg }]}>
      <Text style={[s.metricNum, { color }]}>{value}</Text>
      <Text style={[s.metricLabel, { color }]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  logoEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  logoutText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  dateText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8 },
  complianceGrid: { flexDirection: 'row', gap: 6 },
  complianceTile: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  tileNum: { fontSize: 22, fontWeight: '800' },
  tileLabel: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  tilePct: { fontSize: 9 },
  progressStrip: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 1 },
  progressSeg: { height: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, color: C.muted },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { width: '47%', borderRadius: 14, padding: 16, gap: 4 },
  metricNum: { fontSize: 32, fontWeight: '800' },
  metricLabel: { fontSize: 11, fontWeight: '600', opacity: 0.8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: C.border },
  priorityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: C.text },
  itemSub: { fontSize: 11, color: C.muted },
  itemDate: { fontSize: 11, fontWeight: '600', color: C.muted, flexShrink: 0 },
  itemDateOverdue: { color: C.red },
  pulseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pulseChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.bg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: C.border },
  pulseAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' },
  pulseAvatarText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  pulseOwner: { fontSize: 13, fontWeight: '600', color: C.text },
  pulseBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center' },
  pulseBadgeActive: { backgroundColor: C.blue },
  pulseBadgeText: { fontSize: 10, fontWeight: '700', color: C.muted },
  pulseBadgeTextActive: { color: '#fff' },
})
