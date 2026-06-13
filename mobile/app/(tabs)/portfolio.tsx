import { useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { C } from '@/constants/Colors'
import { getPortfolio, type PortfolioCompany } from '@/lib/api'

export default function PortfolioScreen() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const data = await getPortfolio()
      setCompanies(data)
    } catch {
      // silent
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const compliant = companies.filter((c) => c.overdue === 0).length
  const attention = companies.filter((c) => c.overdue > 0).length

  return (
    <View style={s.root}>
      {/* Banner */}
      <View style={s.banner}>
        <Text style={s.title}>Portfolio</Text>
        <View style={s.bannerStats}>
          <BannerStat label="Companies" value={companies.length} />
          <View style={s.divider} />
          <BannerStat label="Compliant" value={compliant} />
          <View style={s.divider} />
          <BannerStat label="Needs Attention" value={attention} />
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#fff" />}
      >
        {loading && companies.length === 0 && (
          <Text style={s.emptyText}>Loading portfolio…</Text>
        )}
        {!loading && companies.length === 0 && (
          <Text style={s.emptyText}>No companies found.</Text>
        )}
        {companies.map((company) => {
          const isOk = company.overdue === 0
          return (
            <View key={company.id} style={s.card}>
              <View style={s.cardHeader}>
                <View style={s.companyIcon}>
                  <Text style={s.companyInitial}>{company.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.companyName} numberOfLines={1}>{company.name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: isOk ? C.greenLt : C.amberLt }]}>
                    <Text style={[s.statusText, { color: isOk ? C.green : C.amber }]}>
                      {isOk ? '✓ Compliant' : '⚡ Needs Attention'}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={s.statsRow}>
                <StatPill label="Active Items" value={company.workItems} color={C.blue} />
                <StatPill label="Contacts" value={company.contacts} color={C.muted} />
                <StatPill label="Overdue" value={company.overdue} color={company.overdue > 0 ? C.red : C.green} />
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

function BannerStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={s.bannerNum}>{value}</Text>
      <Text style={s.bannerLabel}>{label}</Text>
    </View>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.statPill}>
      <Text style={[s.statNum, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  banner: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  bannerStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bannerNum: { fontSize: 28, fontWeight: '800', color: '#fff' },
  bannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  divider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  companyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.navy, justifyContent: 'center', alignItems: 'center' },
  companyInitial: { color: '#fff', fontSize: 20, fontWeight: '800' },
  companyName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statPill: { flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '600' },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 48, fontSize: 14 },
})
