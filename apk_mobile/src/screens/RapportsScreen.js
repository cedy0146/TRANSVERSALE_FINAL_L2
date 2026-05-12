import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safeGet, safeDelete } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import { fmtKwh, fmtDate, fmtDateTime } from '../utils/format';
import { t } from '../i18n/strings';

export default function RapportsScreen() {
  const { theme, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [rapports, setRapports] = useState([]);
  const [detail, setDetail] = useState(null);

  async function load() {
    setLoading(true);
    const r = await safeGet('/rapports');
    if (r.ok) setRapports(Array.isArray(r.data)?r.data:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function handleDelete(r) {
    Alert.alert(t(lang,'rapport_delete_confirm'), `#${r.id}`, [
      { text:t(lang,'cancel'), style:'cancel' },
      { text:t(lang,'delete'), style:'destructive', onPress:async()=>{
        const res=await safeDelete(`/rapports/${r.id}`); if(res.ok)load(); else Alert.alert(t(lang,'error'),res.error);
      }},
    ]);
  }

  // Totaux
  const totalConso = rapports.reduce((s,r)=>s+(Number(r.consommation_totale)||0),0);
  const totalAlloc = rapports.reduce((s,r)=>s+(Number(r.allocation_totale)||0),0);

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'rapports')} />
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen}/>}>

        {/* Résumé global */}
        <SectionCard title={`📊 Résumé global`}>
          <View style={s.sumRow}>
            {[
              {label:t(lang,'rapport_consommation'),val:fmtKwh(totalConso),c:theme.accentTeal},
              {label:t(lang,'rapport_allocation'),  val:fmtKwh(totalAlloc),c:theme.accentGreen},
              {label:'Rapports',                   val:String(rapports.length),c:theme.accentPurple},
            ].map((x,i)=>(
              <View key={i} style={[s.sumBox,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
                <Text style={[s.sumVal,{color:x.c}]}>{x.val}</Text>
                <Text style={[s.sumLbl,{color:theme.textMuted}]}>{x.label}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        {/* Liste */}
        {rapports.length===0
          ? <SectionCard><Text style={{color:theme.textMuted}}>{t(lang,'no_data')}</Text></SectionCard>
          : rapports.map(r=>(
            <SectionCard key={String(r.id)}>
              <View style={s.cardHead}>
                <View>
                  <Text style={[s.id,{color:theme.textMuted}]}>#{String(r.id).slice(0,10)}</Text>
                  <Text style={[s.dateStr,{color:theme.textPrimary}]}>{fmtDate(r.date_rapport||r.created_at)}</Text>
                </View>
                <Ionicons name="document-text" size={22} color={theme.accentPurple}/>
              </View>

              <View style={s.metrics}>
                <View style={[s.metricBox,{backgroundColor:theme.accentTeal+'18',borderColor:theme.accentTeal}]}>
                  <Text style={[s.metricVal,{color:theme.accentTeal}]}>{fmtKwh(Number(r.consommation_totale)||0)}</Text>
                  <Text style={[s.metricLbl,{color:theme.textMuted}]}>{t(lang,'rapport_consommation')}</Text>
                </View>
                <View style={[s.metricBox,{backgroundColor:theme.accentGreen+'18',borderColor:theme.accentGreen}]}>
                  <Text style={[s.metricVal,{color:theme.accentGreen}]}>{fmtKwh(Number(r.allocation_totale)||0)}</Text>
                  <Text style={[s.metricLbl,{color:theme.textMuted}]}>{t(lang,'rapport_allocation')}</Text>
                </View>
                {r.alertes!=null && (
                  <View style={[s.metricBox,{backgroundColor:theme.accentRed+'18',borderColor:theme.accentRed}]}>
                    <Text style={[s.metricVal,{color:theme.accentRed}]}>{r.alertes}</Text>
                    <Text style={[s.metricLbl,{color:theme.textMuted}]}>{t(lang,'rapport_alertes')}</Text>
                  </View>
                )}
              </View>

              <View style={s.actions}>
                <TouchableOpacity onPress={()=>setDetail(r)} style={[s.actBtn,{borderColor:theme.accentTeal}]}>
                  <Ionicons name="eye" size={14} color={theme.accentTeal}/>
                  <Text style={[s.actTxt,{color:theme.accentTeal}]}>{t(lang,'details')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>handleDelete(r)} style={[s.actBtn,{borderColor:theme.accentRed}]}>
                  <Ionicons name="trash" size={14} color={theme.accentRed}/>
                  <Text style={[s.actTxt,{color:theme.accentRed}]}>{t(lang,'delete')}</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          ))
        }
      </ScrollView>

      {/* Modal détail */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={()=>setDetail(null)}>
        <View style={[s.detailOverlay]}>
          <View style={[s.detailSheet,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
            <View style={[s.detailHead,{borderBottomColor:theme.border}]}>
              <Text style={[s.detailTitle,{color:theme.textPrimary}]}>{t(lang,'rapport_details')}</Text>
              <TouchableOpacity onPress={()=>setDetail(null)} style={[s.closeBtn,{backgroundColor:theme.bgHover}]}>
                <Ionicons name="close" size={18} color={theme.textSecondary}/>
              </TouchableOpacity>
            </View>
            {detail && (
              <ScrollView style={{padding:20}}>
                {Object.entries(detail).map(([k,v])=>(
                  <View key={k} style={[s.detailRow,{borderBottomColor:theme.border}]}>
                    <Text style={[s.detailKey,{color:theme.textMuted}]}>{k}</Text>
                    <Text style={[s.detailVal,{color:theme.textPrimary}]}>{String(v??'—')}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1},content:{padding:16,paddingBottom:32},
  sumRow:{flexDirection:'row',gap:8},
  sumBox:{flex:1,padding:10,borderRadius:12,borderWidth:1,alignItems:'center'},
  sumVal:{fontSize:16,fontWeight:'900'},sumLbl:{fontSize:10,marginTop:2,textAlign:'center'},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12},
  id:{fontSize:11},dateStr:{fontSize:15,fontWeight:'800',marginTop:2},
  metrics:{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12},
  metricBox:{flex:1,minWidth:80,padding:10,borderRadius:10,borderWidth:1,alignItems:'center'},
  metricVal:{fontSize:15,fontWeight:'900'},metricLbl:{fontSize:9,marginTop:2,textAlign:'center'},
  actions:{flexDirection:'row',gap:10},
  actBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,borderWidth:1},
  actTxt:{fontSize:13,fontWeight:'700'},
  detailOverlay:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.6)'},
  detailSheet:{borderTopLeftRadius:24,borderTopRightRadius:24,borderWidth:1,maxHeight:'80%'},
  detailHead:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:20,borderBottomWidth:1},
  detailTitle:{fontSize:17,fontWeight:'800'},
  closeBtn:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center'},
  detailRow:{flexDirection:'row',justifyContent:'space-between',paddingVertical:8,borderBottomWidth:1},
  detailKey:{fontSize:12,color:'#888'},detailVal:{fontSize:13,fontWeight:'600',flex:1,textAlign:'right'},
});
