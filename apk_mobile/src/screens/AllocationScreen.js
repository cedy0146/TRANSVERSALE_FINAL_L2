import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safePost, safeGet } from '../services/api';
import offlineService from '../services/offlineService';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import { fmtKwh, fmtDate } from '../utils/format';
import { t } from '../i18n/strings';

export default function AllocationScreen() {
  const { theme, lang, user } = useApp();
  const [running, setRunning] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [forecasting, setForecasting] = useState(false);
  const [allocResult, setAllocResult] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [forecastResult, setForecastResult] = useState(null);
  const [testChargeResult, setTestChargeResult] = useState(null);

  // Vérification du rôle pour l'interface Admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'RESPONSABLE';

  // --- ALLOCATION OPTIMALE (Knapsack + Dijkstra) ---
  async function runAllocation() {
    setRunning(true); setAllocResult(null);
    // Appel à la route réelle qui utilise Knapsack en backend
    const r = await safePost('/allocation/optimale', {}); 
    setRunning(false);
    if (r.ok) setAllocResult(r.data);
    else Alert.alert(t(lang,'error'), r.error);
  }

  // --- COMPARAISON DES ALGORITHMES (FIFO vs Egalitaire vs Knapsack) ---
  async function runCompare() {
    setComparing(true); setCompareResult(null);
    const r = await safeGet('/comparaison');
    setComparing(false);
    if (r.ok) setCompareResult(r.data);
    else {
      // Fallback offline-first si le réseau échoue
      const cached = await offlineService.getComparaison();
      if (cached.data) setCompareResult(cached.data);
      else Alert.alert(t(lang,'error'), r.error);
    }
  }

  // --- TEST DE CHARGE (Simulation 500+ demandes) ---
  async function runLoadTest() {
    Alert.alert("Simulation", "Lancement du test de charge (500 demandes)...");
    const r = await safePost('/test-charge', { nb_demandes: 500, nb_iterations: 5 });
    if (r.ok) setTestChargeResult(r.data);
  }

  // --- PRÉVISION SOLAIRE (Moving Average) ---
  async function runForecast() {
    setForecasting(true);
    setForecastResult(null);

    const r = await offlineService.getPrevisionMeteo();

    setForecasting(false);
    if (r.data) setForecastResult(r.data);
    else Alert.alert(t(lang,'error'), "Données indisponibles");
  }

  const satisfaction = (accepted, total) => total>0 ? Math.round((accepted/total)*100) : 0;

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'allocation')} />
      <ScrollView contentContainerStyle={s.content}>
        
        {/* L'interface utilisateur simple ne voit que les prévisions et les recommandations */}
        
        {isAdmin && (
          <>
        {/* ── Knapsack Allocation ── */}
        <SectionCard title={`🧠 ${t(lang,'alloc_knapsack')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>{t(lang,'alloc_knapsack_desc')}</Text>
          
          <PrimaryButton
            title={running ? t(lang,'alloc_running') : t(lang,'alloc_run')}
            onPress={runAllocation} loading={running} style={{marginTop:12}}
          />

          {allocResult && (
            <View style={[s.resultBox,{backgroundColor:theme.bgHover,borderColor:theme.border}]}>
              <Text style={[s.resultTitle,{color:theme.accentGreen}]}>✅ {t(lang,'alloc_result')}</Text>
              <View style={s.kpiRow}>
                {[
                  {label:t(lang,'alloc_accepted'),val:allocResult.nb_acceptees??'0',c:theme.accentGreen},
                  {label:t(lang,'alloc_rejected'),val:allocResult.nb_rejetees??'0',c:theme.accentRed},
                  {label:t(lang,'alloc_kwh_total'),val:fmtKwh(allocResult.energie_allouee_kwh||0),c:theme.accentTeal},
                ].map((k,i)=>(
                  <View key={i} style={[s.miniKpi,{backgroundColor:k.c+'18',borderColor:k.c}]}>
                    <Text style={[s.miniVal,{color:k.c}]}>{String(k.val)}</Text>
                    <Text style={[s.miniLbl,{color:theme.textMuted}]}>{k.label}</Text>
                  </View>
                ))}
              </View>
              
              {/* Visualisation Dijkstra (Chemin réseau réel) */}
              {allocResult.chemin_reseau && (
                <View style={s.dijkstraBox}>
                  <Text style={[s.miniLbl,{color:theme.textPrimary, fontWeight:'700'}]}>⚡ Chemin Optimal (Dijkstra):</Text>
                  <Text style={{color:theme.accentTeal, fontSize:11}}>{allocResult.chemin_reseau.chemin.join(' → ')}</Text>
                  <Text style={{color:theme.textMuted, fontSize:10}}>Pertes estimées: {allocResult.chemin_reseau.distance} units</Text>
                </View>
              )}
            </View>
          )}
        </SectionCard>

        {/* ── Comparaison méthodes ── */}
        <SectionCard title={`📊 ${t(lang,'alloc_compare_title')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>{t(lang,'alloc_compare_desc')}</Text>
          
          <PrimaryButton title={comparing ? '...' : t(lang,'alloc_compare')}
            onPress={runCompare} loading={comparing} variant="secondary" style={s.bigBtn}/>

          {compareResult && (
            <View style={{marginTop:14}}>
              {compareResult.resultats?.map((res, idx)=>(
                <View key={idx} style={[s.compareRow,{backgroundColor:theme.bgHover,borderColor:res.est_optimal?theme.accentGreen:theme.border}]}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
                    <Text style={{color:theme.textPrimary,fontWeight:'800'}}>{res.methode.toUpperCase()}</Text>
                    {res.est_optimal && <Ionicons name="trophy" size={16} color={theme.accentGreen} />}
                  </View>
                  <ProgressBar value={res.satisfaction_pct} max={100} height={8}/>
                  <View style={s.compareStats}>
                    <Text style={s.miniStatTxt}>Satisfaction: {res.satisfaction_pct}%</Text>
                    <Text style={s.miniStatTxt}>Coupures évitées: {res.coupures_evitees}</Text>
                    <Text style={[s.miniStatTxt, {color:theme.accentTeal}]}>Calcul: {res.temps_calcul_ms}ms</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </SectionCard>
          </>
        )}

        {/* ── Prévision solaire (Offline-First) ── */}
        <SectionCard title={`☀️ ${t(lang,'alloc_forecast')}`}>
          <Text style={[s.desc,{color:theme.textSecondary}]}>{t(lang,'alloc_forecast_desc')}</Text>
          
          <PrimaryButton title={forecasting ? '...' : t(lang,'alloc_forecast')}
            onPress={runForecast} loading={forecasting} variant="secondary" style={s.bigBtn}/>

          {forecastResult && (
            <View style={{marginTop:14}}>
               <View style={[s.forecastRow,{backgroundColor:theme.bgHover,borderColor:theme.accentOrange}]}>
                  <Ionicons name="sunny" size={32} color={theme.accentOrange}/>
                  <View style={{flex:1, marginLeft: 10}}>
                    <Text style={{color:theme.textSecondary,fontSize:12}}>Estimation Demain ({forecastResult.methode})</Text>
                    <Text style={{color:theme.accentOrange,fontWeight:'900',fontSize:26}}>{fmtKwh(forecastResult.estimation_kwh)}</Text>
                    <Text style={{color:theme.textMuted, fontSize:10}}>Indice de confiance : {forecastResult.confiance_pct}%</Text>
                  </View>
               </View>
            </View>
          )}
        </SectionCard>

        {/* ── Tests de charge (Admin uniquement) ── */}
        {isAdmin && (
          <>
            <PrimaryButton title="Lancer Test de Charge (500 req)" onPress={runLoadTest} variant="danger" style={{marginTop: 20}} />
            {testChargeResult && (
               <SectionCard title="Resultat Test de Charge">
                  <Text style={{color:theme.textPrimary}}>Latence Moyenne: {testChargeResult.latence_moyenne_ms}ms</Text>
                  <Text style={{color:theme.textPrimary}}>Succès: {testChargeResult.taux_succes}%</Text>
               </SectionCard>
            )}
          </>
        )}
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
  compareRow:{padding:12,borderRadius:12,borderWidth:1.5,marginBottom:10},
  compareStats:{flexDirection:'row',justifyContent:'space-between',marginTop:8},
  miniStatTxt:{fontSize:10,fontWeight:'600'},
  forecastRow:{flexDirection:'row',alignItems:'center',padding:16,borderRadius:15,borderWidth:1},
  bigBtn:{marginTop:12, height: 55}, // Optimisé pour gros doigts
  dijkstraBox:{marginTop:10, padding:8, borderTopWidth:1, borderTopColor:'#eee'},
});
