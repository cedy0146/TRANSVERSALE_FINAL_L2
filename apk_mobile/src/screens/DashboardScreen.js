import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, useWindowDimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { safeGet } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import BigStatCard from '../components/ui/BigStatCard';
import SectionCard from '../components/ui/SectionCard';
import ProgressBar from '../components/ui/ProgressBar';
import { fmtKwh, fmtPct, fmtDate } from '../utils/format';
import { t } from '../i18n/strings';
 
export default function DashboardScreen() {
  const { theme, lang } = useApp();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ batteries: [], foyers: [], demandes: [], rapports: [] });
 
  async function load() {
    setLoading(true);
    const [bRes, fRes, dRes, rRes] = await Promise.all([
      safeGet('/batteries'), safeGet('/foyers'), safeGet('/demandes'), safeGet('/rapports'),
    ]);
    setData({
      batteries: bRes.ok ? (Array.isArray(bRes.data) ? bRes.data : []) : [],
      foyers:    fRes.ok ? (Array.isArray(fRes.data) ? fRes.data : []) : [],
      demandes:  dRes.ok ? (Array.isArray(dRes.data) ? dRes.data : []) : [],
      rapports:  rRes.ok ? (Array.isArray(rRes.data) ? rRes.data : []) : [],
    });
    setLoading(false);
  }
 
  useEffect(() => { load(); }, []);
 
  const { batteries, foyers, demandes, rapports } = data;
  const totalAct = batteries.reduce((s, b) => s + (Number(b.capacite_actuelle) || 0), 0);
  const totalCap = batteries.reduce((s, b) => s + (Number(b.capacite_totale) || 0), 0);
  const pending  = demandes.filter(d => !d.est_acceptee);
 
  // Padding responsive
  const pad = width < 380 ? 12 : 16;
  const gap = width < 380 ? 8  : 12;
 
  return (
    <View style={[s.root, { backgroundColor: theme.bgPrimary }]}>
      <AppHeader title={t(lang, 'dashboard')} />
      <ScrollView
        contentContainerStyle={[s.content, { padding: pad, gap: 0 }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen} />}
      >
        {/* Status bar */}
        <View style={[s.statusBar, { backgroundColor: theme.bgCard, borderColor: theme.border, marginBottom: gap }]}>
          <View style={[s.dot, { backgroundColor: theme.accentGreen }]} />
          <Text style={[s.statusTxt, { color: theme.accentGreen }]}>{t(lang, 'system_online')}</Text>
          <Text style={[s.statusSub, { color: theme.textMuted }]}>  ·  ELECTRIMADA v2</Text>
        </View>
 
        {/* KPI Grid — 2 colonnes */}
        <View style={[s.grid2, { gap, marginBottom: gap }]}>
          <BigStatCard icon="battery-charging" label={t(lang, 'kpi_battery')}  value={fmtKwh(totalAct)} variant="green"  />
          <BigStatCard icon="home"             label={t(lang, 'kpi_foyers')}   value={String(foyers.length)} variant="teal" />
        </View>
        <View style={[s.grid2, { gap, marginBottom: gap }]}>
          <BigStatCard icon="flash"            label={t(lang, 'kpi_demandes')} value={String(pending.length)} variant="yellow" />
          <BigStatCard icon="document-text"    label={t(lang, 'kpi_rapports')} value={String(rapports.length)} variant="purple" />
        </View>
 
        {/* Batteries */}
        <SectionCard title={`🔋 ${t(lang, 'battery_state')}`}>
          {batteries.length === 0
            ? <Text style={{ color: theme.textMuted }}>{t(lang, 'no_data')}</Text>
            : batteries.slice(0, 5).map(b => {
                const cap  = Number(b.capacite_totale) || 0;
                const act  = Number(b.capacite_actuelle) || 0;
                const thr  = Number(b.seuil_critique) || 0;
                const isLow = act <= thr;
                return (
                  <View key={String(b.id)} style={[s.battRow, { borderBottomColor: theme.border }]}>
                    <View style={s.battTop}>
                      <Text style={[s.battName, { color: theme.textPrimary }]}>{b.nom || `Batterie #${b.id}`}</Text>
                      <Text style={[s.battPct, { color: isLow ? theme.accentRed : theme.accentGreen }]}>
                        {fmtPct(act, cap)} {isLow ? '⚠️' : ''}
                      </Text>
                    </View>
                    <ProgressBar value={act} max={cap} height={6} />
                    <Text style={[s.battSub, { color: theme.textMuted }]}>{fmtKwh(act)} / {fmtKwh(cap)}</Text>
                  </View>
                );
              })
          }
        </SectionCard>
 
        {/* Demandes en attente */}
        <SectionCard title={`⚡ ${t(lang, 'pending_dem')}`}>
          {pending.length === 0
            ? <Text style={{ color: theme.textMuted }}>{t(lang, 'empty_wait')}</Text>
            : pending.slice(0, 5).map(d => (
                <View key={String(d.id)} style={[s.row, { borderBottomColor: theme.border }]}>
                  <Text style={[s.rowL, { color: theme.textPrimary }]}>
                    #{String(d.id).slice(0, 8)} · Foyer {d.foyer_id || '—'}
                  </Text>
                  <Text style={[s.rowR, { color: theme.accentYellow }]}>{fmtKwh(Number(d.quantite_kwh) || 0)}</Text>
                </View>
              ))
          }
        </SectionCard>
 
        {/* Derniers rapports */}
        <SectionCard title={`📄 ${t(lang, 'last_reports')}`}>
          {rapports.length === 0
            ? <Text style={{ color: theme.textMuted }}>{t(lang, 'no_data')}</Text>
            : rapports.slice(0, 5).map(r => (
                <View key={String(r.id)} style={[s.row, { borderBottomColor: theme.border }]}>
                  <Text style={[s.rowL, { color: theme.textPrimary }]}>
                    #{String(r.id).slice(0, 8)} · {fmtDate(r.date_rapport || r.created_at)}
                  </Text>
                  <Text style={[s.rowR, { color: theme.accentTeal }]}>{fmtKwh(Number(r.consommation_totale) || 0)}</Text>
                </View>
              ))
          }
        </SectionCard>
      </ScrollView>
    </View>
  );
}
 
const s = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 32 },
  statusBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusTxt: { fontWeight: '700', fontSize: 13 },
  statusSub: { fontSize: 12 },
  grid2: { flexDirection: 'row' },
  battRow: { paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1 },
  battTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  battName: { fontWeight: '700', fontSize: 14 },
  battPct: { fontWeight: '800', fontSize: 14 },
  battSub: { fontSize: 11, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  rowL: { fontSize: 13, fontWeight: '600', flex: 1 },
  rowR: { fontSize: 13, fontWeight: '800', marginLeft: 8 },
});