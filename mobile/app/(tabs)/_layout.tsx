import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { C } from '@/constants/Colors'

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={s.iconWrap}>
      <Text style={s.emoji}>{emoji}</Text>
      <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
    </View>
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: s.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: C.blueLt,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused }) => <TabIcon label="Alerts" emoji="🔔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="filings"
        options={{
          title: 'Filings',
          tabBarIcon: ({ focused }) => <TabIcon label="Filings" emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ focused }) => <TabIcon label="Portfolio" emoji="🏢" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="decisions"
        options={{
          title: 'Decisions',
          tabBarIcon: ({ focused }) => <TabIcon label="Decisions" emoji="⚖️" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const s = StyleSheet.create({
  tabBar: {
    backgroundColor: C.navy,
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  iconWrap: {
    alignItems: 'center',
    gap: 2,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
  },
  labelActive: {
    color: C.blueLt,
  },
})
