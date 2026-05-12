import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safePost, safeGet } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import { fmtKwh } from '../utils/format';
import { t } from '../i18n/strings';

export default function AllocationScreen() {
  const { theme, lang } = useApp();
  const [running, setRunning] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [allocResult, setAllocResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [forecastResult, setForecastResult] = useState(null);

  async function runAllocation() {
    setRunning(true); setAllocResult(null);
    const r = await safePost('/api/allocation/lancer', {});
    setRunning(false);
    if (r.ok) setAllocResult(r.data);
    else Alert.alert(t(lang,'error'), r.error);
  }

  async function runCompare() {
    setComparing(true); setCompareResult(null);
    const r = await safeGet('/api/allocation/comparer');
    setComparing(false);
    if (r.ok) setCompareResult(r.data);
    else Alert.alert(t(lang,'error'), r.error);
  }

  async function runForecast() {
    setForecasting(true); setForecastResult(null);
    // Envoie des données historiques fictives pour la démo
    const historique = [10,12,9,11,13,10,12,14,11,10,9,13,12,11,10];
    const r = await safePost('/api/allocation/prevision-solaire', { historique });
    setForecasting(false);
    if (r.ok) setForecastResult(r.data);
    else Alert.alert(t(lang,'error'), r.error);
  }

  const satisfaction = (accepted, total) => total>0 ? Math.round((accepted/total)*100) : 0;

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'allocation')} />
      <ScrollView contentContainerStyle={s.content}>

        {/* ── Knapsack Allocation ── */}
        <SectionCard title={`🧠 ${t(lang,'alloc_knapsack')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>
            {lang==='mg'
              ? "Manokana angovo amin'ny fomba tsara indrindra amin'ny alalan'ny algoritma knapsack."
              : "Optimise la distribution d'énergie avec l'algorithme knapsack pour maximiser la satisfaction."}
          </Text>
          <PrimaryButton
            title={running ? t(lang,'alloc_running') : t(lang,'alloc_run')}
            onPress={runAllocation} loading={running} style={{marginTop:12}}
          />

          {allocResult && (
            <View style={[s.resultBox,{backgroundColor:theme.bgHover,borderColor:theme.border}]}>
              <Text style={[s.resultTitle,{color:theme.accentBlue}]}>✅ {t(lang,'alloc_result')}</Text>
              <View style={s.kpiRow}>
                {[
                  {label:t(lang,'alloc_accepted'),val:allocResult.acceptees?.length??allocResult.demandes_acceptees??'—',c:theme.accentBlue},
                  {label:t(lang,'alloc_rejected'),val:allocResult.refusees?.length??allocResult.demandes_refusees??'—',c:theme.accentPink},
                  {label:t(lang,'alloc_kwh_total'),val:fmtKwh(Number(allocResult.total_kwh_alloue)||0),c:theme.accentCyan},
                ].map((k,i)=>(
                  <View key={i} style={[s.miniKpi,{backgroundColor:k.c+'18',borderColor:k.c}]}>
                    <Text style={[s.miniVal,{color:k.c}]}>{String(k.val)}</Text>
                    <Text style={[s.miniLbl,{color:theme.textMuted}]}>{k.label}</Text>
                  </View>
                ))}
              </View>
              {allocResult.taux_satisfaction!=null && (
                <View style={{marginTop:12}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                    <Text style={{color:theme.textSecondary,fontWeight:'700'}}>{t(lang,'alloc_satisfaction')}</Text>
                    <Text style={{color:theme.accentBlue,fontWeight:'900'}}>{Math.round(allocResult.taux_satisfaction*100)||0}%</Text>
                  </View>
                  <ProgressBar value={Math.round(allocResult.taux_satisfaction*100)||0} max={100}/>
                </View>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Comparaison méthodes ── */}
        <SectionCard title={`📊 ${t(lang,'alloc_compare')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>
            {lang==='mg'
              ? "Ampitahao ny Knapsack amin'ny FIFO sy ny fizarana mitovy."
              : "Compare Knapsack vs FIFO vs partage égal pour visualiser le gain de l'optimisation."}
          </Text>
          <PrimaryButton title={comparing ? '...' : t(lang,'alloc_compare')}
            onPress={runCompare} loading={comparing} variant="secondary" style={{marginTop:12}}/>

          {compareResult && (
            <View style={{marginTop:14}}>
              {Object.entries(compareResult).map(([method, res])=>(
                <View key={method} style={[s.compareRow,{backgroundColor:theme.bgHover,borderColor:theme.border}]}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                    <Text style={{color:theme.textPrimary,fontWeight:'800',textTransform:'capitalize'}}>{method}</Text>
                    <Text style={{color:theme.accentCyan,fontWeight:'800'}}>{fmtKwh(Number(res.total_kwh||res.total_alloue)||0)}</Text>
                  </View>
                  <ProgressBar value={Number(res.taux||res.taux_satisfaction||0)*100} max={100} height={6}/>
                  <Text style={{color:theme.textMuted,fontSize:11,marginTop:4}}>
                    {t(lang,'alloc_satisfaction')}: {Math.round(Number(res.taux||res.taux_satisfaction||0)*100)}%
                  </Text>
                </View>
              ))}
            </View>
          )}
        </SectionCard>

        {/* ── Prévision solaire ── */}
        <SectionCard title={`☀️ ${t(lang,'alloc_forecast')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>
            {lang==='mg'
              ? "Mampiasa Moving Average hanambarany ny angovo masoandro rahampitso."
              : "Utilise la moyenne mobile pour prévoir la production solaire de demain."}
          </Text>
          <PrimaryButton title={forecasting ? '...' : t(lang,'alloc_forecast')}
            onPress={runForecast} loading={forecasting} variant="secondary" style={{marginTop:12}}/>

          {forecastResult && (
            <View style={{marginTop:14}}>
              {[
                {label:t(lang,'alloc_tomorrow_am'), val:forecastResult.matin??forecastResult.demain_matin, icon:'sunny'},
                {label:t(lang,'alloc_tomorrow_pm'), val:forecastResult.soir??forecastResult.demain_soir,   icon:'moon'},
              ].map((item,i)=>(
                <View key={i} style={[s.forecastRow,{backgroundColor:theme.bgHover,borderColor:theme.border}]}>
                  <Ionicons name={item.icon} size={22} color={theme.accentOrange}/>
                  <View style={{flex:1}}>
                    <Text style={{color:theme.textSecondary,fontSize:12}}>{item.label}</Text>
                    <Text style={{color:theme.accentOrange,fontWeight:'900',fontSize:20}}>{fmtKwh(Number(item.val)||0)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1},content:{padding:16,paddingBottom:32},
  desc:{fontSize:13,lineHeight:20},
  resultBox:{marginTop:14,padding:14,borderRadius:12,borderWidth:1},
  resultTitle:{fontWeight:'800',fontSize:15,marginBottom:12},
  kpiRow:{flexDirection:'row',gap:8},
  miniKpi:{flex:1,padding:10,borderRadius:10,borderWidth:1,alignItems:'center'},
  miniVal:{fontSize:18,fontWeight:'900'},
  miniLbl:{fontSize:10,marginTop:3,textAlign:'center'},
  compareRow:{padding:12,borderRadius:10,borderWidth:1,marginBottom:8},
  forecastRow:{flexDirection:'row',alignItems:'center',gap:14,padding:14,borderRadius:10,borderWidth:1,marginBottom:8},
});
