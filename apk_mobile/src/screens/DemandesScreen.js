import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safeGet, safePost, safePut, safeDelete } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import FormModal, { FieldInput } from '../components/ui/FormModal';
import { fmtKwh, fmtDate } from '../utils/format';
import { t } from '../i18n/strings';

const EMPTY = { foyer_id:'', quantite_kwh:'', est_acceptee: false };

export default function DemandesScreen() {
  const { theme, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [foyers, setFoyers] = useState([]);
  const [filter, setFilter] = useState('all'); // all | pending | accepted | rejected
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [dRes, fRes] = await Promise.all([safeGet('/demandes'), safeGet('/foyers')]);
    if (dRes.ok) setDemandes(Array.isArray(dRes.data)?dRes.data:[]);
    if (fRes.ok) setFoyers(Array.isArray(fRes.data)?fRes.data:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = demandes.filter(d => {
    if (filter==='pending')  return !d.est_acceptee && !d.est_rejetee;
    if (filter==='accepted') return !!d.est_acceptee;
    if (filter==='rejected') return !!d.est_rejetee;
    return true;
  });

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(d) {
    setEditing(d);
    setForm({ foyer_id:String(d.foyer_id||''), quantite_kwh:String(d.quantite_kwh||''), est_acceptee:!!d.est_acceptee });
    setModal(true);
  }

  async function handleSave() {
    if (!form.quantite_kwh) return Alert.alert(t(lang,'error'), 'Quantité kWh requise');
    setSaving(true);
    const body = { foyer_id: Number(form.foyer_id)||null, quantite_kwh: Number(form.quantite_kwh)||0 };
    const r = editing ? await safePut(`/demandes/${editing.id}`, body) : await safePost('/demandes', body);
    setSaving(false);
    if (r.ok) { setModal(false); load(); }
    else Alert.alert(t(lang,'error'), r.error);
  }

  async function handleDelete(d) {
    Alert.alert(t(lang,'demande_delete_confirm'), `#${d.id}`, [
      { text:t(lang,'cancel'), style:'cancel' },
      { text:t(lang,'delete'), style:'destructive', onPress:async()=>{ const r=await safeDelete(`/demandes/${d.id}`); if(r.ok)load(); else Alert.alert(t(lang,'error'),r.error); }},
    ]);
  }

  const statusInfo = (d) => {
    if (d.est_rejetee)  return { label:t(lang,'demande_rejected'),  color:theme.accentRed };
    if (d.est_acceptee) return { label:t(lang,'demande_accepted'),  color:theme.accentGreen };
    return                     { label:t(lang,'demande_pending'),   color:theme.accentYellow };
  };

  const foyerName = (id) => { const f=foyers.find(x=>x.id===id||String(x.id)===String(id)); return f?f.nom:`Foyer #${id}`; };

  const FILTERS = [
    { key:'all', label:'Tout', icon:'list' },
    { key:'pending', label:t(lang,'demande_pending'), icon:'time' },
    { key:'accepted', label:t(lang,'demande_accepted'), icon:'checkmark-circle' },
    { key:'rejected', label:t(lang,'demande_rejected'), icon:'close-circle' },
  ];

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'demandes')} />
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen}/>}>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {FILTERS.map(f=>(
            <TouchableOpacity key={f.key} onPress={()=>setFilter(f.key)}
              style={[s.filterBtn,{borderColor:filter===f.key?theme.accentGreen:theme.border,
                backgroundColor:filter===f.key?theme.accentGreen+'22':theme.bgCard}]}>
              <Ionicons name={f.icon} size={13} color={filter===f.key?theme.accentGreen:theme.textMuted}/>
              <Text style={[s.filterTxt,{color:filter===f.key?theme.accentGreen:theme.textMuted}]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <PrimaryButton title={`+ ${t(lang,'demande_add')}`} onPress={openAdd} style={{marginBottom:14}}/>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            {label:t(lang,'demande_pending'),cnt:demandes.filter(d=>!d.est_acceptee&&!d.est_rejetee).length,c:theme.accentYellow},
            {label:t(lang,'demande_accepted'),cnt:demandes.filter(d=>!!d.est_acceptee).length,c:theme.accentGreen},
            {label:t(lang,'demande_rejected'),cnt:demandes.filter(d=>!!d.est_rejetee).length,c:theme.accentRed},
          ].map((x,i)=>(
            <View key={i} style={[s.statBox,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
              <Text style={[s.statNum,{color:x.c}]}>{x.cnt}</Text>
              <Text style={[s.statLbl,{color:theme.textMuted}]}>{x.label}</Text>
            </View>
          ))}
        </View>

        {filtered.length===0
          ? <SectionCard><Text style={{color:theme.textMuted}}>{t(lang,'no_data')}</Text></SectionCard>
          : filtered.map(d=>{
              const si = statusInfo(d);
              return (
                <SectionCard key={String(d.id)}>
                  <View style={s.cardHead}>
                    <View>
                      <Text style={[s.id,{color:theme.textMuted}]}>#{String(d.id).slice(0,10)}</Text>
                      {d.foyer_id && <Text style={[s.foyerName,{color:theme.textPrimary}]}>{foyerName(d.foyer_id)}</Text>}
                    </View>
                    <View style={[s.badge,{backgroundColor:si.color+'22',borderColor:si.color}]}>
                      <Text style={[s.badgeTxt,{color:si.color}]}>{si.label}</Text>
                    </View>
                  </View>
                  <View style={s.kwhRow}>
                    <Ionicons name="flash" size={18} color={theme.accentYellow}/>
                    <Text style={[s.kwh,{color:theme.accentYellow}]}>{fmtKwh(Number(d.quantite_kwh)||0)}</Text>
                    {d.date_demande && <Text style={[s.date,{color:theme.textMuted}]}>{fmtDate(d.date_demande)}</Text>}
                  </View>
                  <View style={s.actions}>
                    <TouchableOpacity onPress={()=>openEdit(d)} style={[s.actBtn,{borderColor:theme.accentTeal}]}>
                      <Ionicons name="pencil" size={14} color={theme.accentTeal}/>
                      <Text style={[s.actTxt,{color:theme.accentTeal}]}>{t(lang,'edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleDelete(d)} style={[s.actBtn,{borderColor:theme.accentRed}]}>
                      <Ionicons name="trash" size={14} color={theme.accentRed}/>
                      <Text style={[s.actTxt,{color:theme.accentRed}]}>{t(lang,'delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </SectionCard>
              );
            })
        }
      </ScrollView>

      <FormModal visible={modal} title={editing?t(lang,'demande_edit'):t(lang,'demande_add')}
        onClose={()=>setModal(false)} onSave={handleSave} loading={saving} saveLabel={t(lang,'save')}>
        <FieldInput label={t(lang,'demande_foyer')+' ID'} value={form.foyer_id} onChangeText={v=>setForm(f=>({...f,foyer_id:v}))} keyboardType="numeric" placeholder="1" theme={theme}/>
        <FieldInput label={t(lang,'demande_kwh')} value={form.quantite_kwh} onChangeText={v=>setForm(f=>({...f,quantite_kwh:v}))} keyboardType="numeric" placeholder="5.0" theme={theme}/>
      </FormModal>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1},content:{padding:16,paddingBottom:32},
  filterScroll:{marginBottom:12},
  filterBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:99,borderWidth:1,marginRight:8},
  filterTxt:{fontSize:12,fontWeight:'700'},
  statsRow:{flexDirection:'row',gap:8,marginBottom:14},
  statBox:{flex:1,padding:10,borderRadius:12,borderWidth:1,alignItems:'center'},
  statNum:{fontSize:20,fontWeight:'900'},statLbl:{fontSize:10,marginTop:2,textAlign:'center'},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10},
  id:{fontSize:11},foyerName:{fontSize:15,fontWeight:'800',marginTop:2},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:99,borderWidth:1},
  badgeTxt:{fontSize:11,fontWeight:'800'},
  kwhRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  kwh:{fontSize:20,fontWeight:'900'},date:{fontSize:12,marginLeft:'auto'},
  actions:{flexDirection:'row',gap:10,marginTop:4},
  actBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,borderWidth:1},
  actTxt:{fontSize:13,fontWeight:'700'},
});
