import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, TextInput, Modal,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { C } from '@/constants/Colors'
import { getDecisions, resolveDecision, type Decision } from '@/lib/api'

function fmt(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
}

function isOverdue(iso: string | null) {
  return iso ? new Date(iso) < new Date() : false
}

export default function DecisionsScreen() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [modalDecision, setModalDecision] = useState<Decision | null>(null)
  const [decisionText, setDecisionText] = useState('')

  async function load() {
    try {
      const data = await getDecisions()
      setDecisions(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  async function handleApprove(dec: Decision) {
    setModalDecision(dec)
    setDecisionText('')
  }

  async function submitApproval() {
    if (!modalDecision) return
    setResolving(modalDecision.id)
    try {
      await resolveDecision(modalDecision.id, decisionText || 'Approved')
      setModalDecision(null)
      await load()
    } catch {
      Alert.alert('Error', 'Could not resolve decision. Please try again.')
    } finally {
      setResolving(null)
    }
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Decisions</Text>
        <Text style={s.sub}>{decisions.length} open decision{decisions.length !== 1 ? 's' : ''} awaiting review</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#fff" />}
      >
        {loading && decisions.length === 0 && (
          <Text style={s.emptyText}>Loading decisions…</Text>
        )}
        {!loading && decisions.length === 0 && (
          <View style={s.emptyCard}>
            <Text style={s.emptyCardEmoji}>✅</Text>
            <Text style={s.emptyCardTitle}>All caught up</Text>
            <Text style={s.emptyCardSub}>No open decisions require your attention.</Text>
          </View>
        )}
        {decisions.map((dec) => {
          const due = fmt(dec.dueDate)
          const overdue = isOverdue(dec.dueDate)
          return (
            <View key={dec.id} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.statusDot, { backgroundColor: overdue ? C.red : C.amber }]} />
                <Text style={s.decisionBy}>For: {dec.decisionBy}</Text>
                {due && (
                  <Text style={[s.dueDate, overdue && s.dueDateOverdue]}>Due {due}</Text>
                )}
              </View>

              <Text style={s.question}>{dec.question}</Text>

              <View style={s.workItemRow}>
                <Text style={s.workItemLabel}>Re: </Text>
                <Text style={s.workItemTitle} numberOfLines={1}>{dec.workItem.title}</Text>
                {dec.workItem.company && (
                  <Text style={s.workItemCompany} numberOfLines={1}> · {dec.workItem.company}</Text>
                )}
              </View>

              {dec.options && (
                <View style={s.optionsBox}>
                  <Text style={s.optionsLabel}>OPTIONS</Text>
                  <Text style={s.optionsText}>{dec.options}</Text>
                </View>
              )}

              {dec.recommendation && (
                <View style={s.recommendBox}>
                  <Text style={s.recommendLabel}>RECOMMENDATION</Text>
                  <Text style={s.recommendText}>{dec.recommendation}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[s.approveBtn, resolving === dec.id && s.approveBtnDisabled]}
                onPress={() => handleApprove(dec)}
                disabled={resolving === dec.id}
              >
                <Text style={s.approveBtnText}>
                  {resolving === dec.id ? 'Resolving…' : '✓ Approve / Resolve'}
                </Text>
              </TouchableOpacity>
            </View>
          )
        })}
      </ScrollView>

      {/* Approval modal */}
      <Modal visible={!!modalDecision} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>Resolve Decision</Text>
            {modalDecision && (
              <Text style={s.modalQuestion} numberOfLines={3}>{modalDecision.question}</Text>
            )}
            <Text style={s.modalInputLabel}>YOUR DECISION (optional note)</Text>
            <TextInput
              style={s.modalInput}
              value={decisionText}
              onChangeText={setDecisionText}
              placeholder="e.g. Approved — proceed with filing"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
            />
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.modalCancel}
                onPress={() => setModalDecision(null)}
              >
                <Text style={s.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalApprove, resolving && s.approveBtnDisabled]}
                onPress={submitApproval}
                disabled={!!resolving}
              >
                <Text style={s.modalApproveText}>{resolving ? 'Resolving…' : 'Approve'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  decisionBy: { flex: 1, fontSize: 12, color: C.muted, fontWeight: '600' },
  dueDate: { fontSize: 11, fontWeight: '600', color: C.muted },
  dueDateOverdue: { color: C.red },
  question: { fontSize: 15, fontWeight: '700', color: C.text, lineHeight: 22 },
  workItemRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  workItemLabel: { fontSize: 12, color: C.muted },
  workItemTitle: { fontSize: 12, color: C.blue, fontWeight: '600', flexShrink: 1 },
  workItemCompany: { fontSize: 12, color: C.muted, flexShrink: 1 },
  optionsBox: { backgroundColor: C.bg, borderRadius: 8, padding: 10, gap: 4 },
  optionsLabel: { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  optionsText: { fontSize: 12, color: C.text },
  recommendBox: { backgroundColor: C.blueXlt, borderRadius: 8, padding: 10, gap: 4 },
  recommendLabel: { fontSize: 9, fontWeight: '700', color: C.blue, letterSpacing: 0.5 },
  recommendText: { fontSize: 12, color: C.text },
  approveBtn: { backgroundColor: C.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  approveBtnDisabled: { opacity: 0.6 },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 48, fontSize: 14 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, marginTop: 24 },
  emptyCardEmoji: { fontSize: 40 },
  emptyCardTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  emptyCardSub: { fontSize: 13, color: C.muted, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  modalQuestion: { fontSize: 14, color: C.muted },
  modalInputLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  modalInput: { borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 12, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontWeight: '600', color: C.muted },
  modalApprove: { flex: 2, backgroundColor: C.blue, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalApproveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
