import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { C } from '@/constants/Colors'
import { getFilings, type WorkItem } from '@/lib/api'

type StatusBucket = 'overdue' | 'action' | 'risk' | 'compliant'

const BUCKET: Record<StatusBucket, { label: string; dot: string; border: string; bg: string }> = {
  overdue:   { label: 'Overdue',     dot: C.red,    border: C.red,    bg: C.redLt },
  action:    { label: 'Action Req.', dot: C.orange,  border: C.orange, bg: C.orangeLt },
  risk:      { label: 'At Risk',     dot: C.amber,  border: C.amber,  bg: C.amberLt },
  compliant: { label: 'Compliant',   dot: C.green,  border: C.green,  bg: C.greenLt },
}

const BUCKET_ORDER: StatusBucket[] = ['overdue', 'action', 'risk', 'compliant']

function getBucket(item: WorkItem): StatusBucket {
  const now = new Date()
  if (item.dueDate && new Date(item.dueDate) < now) return 'overdue'
  if (['Escalated', 'DecisionNeeded', 'FollowUpDue'].includes(item.status)) return 'action'
  if (item.priority === 'Urgent' || item.priority === 'High') return 'risk'
  return 'compliant'
}

function fmt(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

const FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'overdue', label: '🔴 Overdue' },
  { key: 'action', label: '⚠ Action' },
  { key: 'risk', label: '⚡ Risk' },
  { key: 'compliant', label: '✓ OK' },
]

export default function FilingsScreen() {
  const [items, setItems] = useState<WorkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  async function load() {
    try {
      const data = await getFilings()
      setItems(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const sorted = [...items].sort((a, b) => {
    const oa = BUCKET_ORDER.indexOf(getBucket(a))
    const ob = BUCKET_ORDER.indexOf(getBucket(b))
    return oa - ob
  })

  const filtered = filter === 'all' ? sorted : sorted.filter((i) => getBucket(i) === filter)

  const counts = {
    overdue: items.filter((i) => getBucket(i) === 'overdue').length,
    action: items.filter((i) => getBucket(i) === 'action').length,
    risk: items.filter((i) => getBucket(i) === 'risk').length,
    compliant: items.filter((i) => getBucket(i) === 'compliant').length,
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Filings</Text>
        <Text style={s.sub}>
          {counts.overdue} overdue · {counts.action} action · {counts.risk} at risk · {counts.compliant} compliant
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterChipText, filter === f.key && s.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#fff" />}
      >
        {loading && filtered.length === 0 && (
          <Text style={s.emptyText}>Loading filings…</Text>
        )}
        {!loading && filtered.length === 0 && (
          <Text style={s.emptyText}>No items found.</Text>
        )}
        {filtered.map((item) => {
          const bucket = getBucket(item)
          const b = BUCKET[bucket]
          const due = fmt(item.dueDate)
          return (
            <View key={item.id} style={[s.card, { borderLeftColor: b.border }]}>
              <View style={s.cardTop}>
                <View style={[s.bucketBadge, { backgroundColor: b.bg }]}>
                  <View style={[s.dot, { backgroundColor: b.dot }]} />
                  <Text style={[s.bucketLabel, { color: b.dot }]}>{b.label}</Text>
                </View>
                <Text style={s.itemType}>{item.type}</Text>
                {due && (
                  <Text style={[s.itemDue, bucket === 'overdue' && s.itemDueOverdue]}>{due}</Text>
                )}
              </View>
              <Text style={s.itemTitle} numberOfLines={2}>{item.title}</Text>
              <View style={s.itemMeta}>
                {item.company && <Text style={s.metaText} numberOfLines={1}>{item.company}</Text>}
                <Text style={s.metaText}>Owner: {item.owner}</Text>
                <Text style={[s.statusBadge, { color: C.muted }]}>{item.status}</Text>
              </View>
              {item.notes && (
                <Text style={s.notesText} numberOfLines={2}>{item.notes}</Text>
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
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  filterScroll: { maxHeight: 48 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  filterChipActive: { backgroundColor: C.blue, borderColor: C.blue },
  filterChipText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  filterChipTextActive: { color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, borderLeftWidth: 4, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bucketBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  bucketLabel: { fontSize: 10, fontWeight: '700' },
  itemType: { fontSize: 11, color: C.muted, flex: 1 },
  itemDue: { fontSize: 11, fontWeight: '600', color: C.muted, flexShrink: 0 },
  itemDueOverdue: { color: C.red },
  itemTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  itemMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  metaText: { fontSize: 11, color: C.muted },
  statusBadge: { fontSize: 11, color: C.muted },
  notesText: { fontSize: 12, color: C.muted, fontStyle: 'italic' },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 48, fontSize: 14 },
})
