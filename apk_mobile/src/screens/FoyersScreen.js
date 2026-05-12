import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safeGet, safePost, safePut, safeDelete } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import FormModal, { FieldInput } from '../components/ui/FormModal';
import { fmtKwh } from '../utils/format';
import { t } from '../i18n/strings';

const EMPTY = { nom:'', adresse:'', priorite:'2', consommation_moyenne:'' };
const PRIO_OPTS = [
  { val:'1', labelFr:'Haute', labelMg:'Avo', color:'#ff6b6b' },
  { val:'2', labelFr:'Moyenne', labelMg:'Antonony', color:'#ffd666' },
  { val:'3', labelFr:'Basse', labelMg:'Ambany', color:'#00e5a0' },
];

export default function FoyersScreen() {
  const { theme, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [foyers, setFoyers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await safeGet('/foyers');
    if (r.ok) setFoyers(Array.isArray(r.data)?r.data:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = foyers.filter(f =>
    !search || (f.nom||'').toLowerCase().includes(search.toLowerCase()) || (f.adresse||'').toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(f) {
    setEditing(f);
    setForm({ nom:String(f.nom||''), adresse:String(f.adresse||''), priorite:String(f.priorite||'2'), consommation_moyenne:String(f.consommation_moyenne||'') });
    setModal(true);
  }

  async function handleSave() {
    if (!form.nom) return Alert.alert(t(lang,'error'), 'Nom requis');
    setSaving(true);
    const body = { nom:form.nom, adresse:form.adresse, priorite:Number(form.priorite)||2, consommation_moyenne:Number(form.consommation_moyenne)||0 };
    const r = editing ? await safePut(`/foyers/${editing.id}`, body) : await safePost('/foyers', body);
    setSaving(false);
    if (r.ok) { setModal(false); load(); }
    else Alert.alert(t(lang,'error'), r.error);
  }

  async function handleDelete(f) {
    Alert.alert(t(lang,'foyer_delete_confirm'), f.nom||`#${f.id}`, [
      { text:t(lang,'cancel'), style:'cancel' },
      { text:t(lang,'delete'), style:'destructive', onPress: async()=>{ const r=await safeDelete(`/foyers/${f.id}`); if(r.ok)load(); else Alert.alert(t(lang,'error'),r.error); }},
    ]);
  }

  const prioColor = (p) => ({ '1':theme.accentRed,'2':theme.accentYellow,'3':theme.accentGreen })[String(p)] || theme.textMuted;
  const prioLabel = (p) => {
    const o = PRIO_OPTS.find(x=>x.val===String(p));
    return o ? (lang==='mg'?o.labelMg:o.labelFr) : '—';
  };

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'foyers')} />
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen}/>}>

        {/* Stats rapides */}
        <View style={s.statsRow}>
          {PRIO_OPTS.map(o => {
            const cnt = foyers.filter(f=>String(f.priorite)===o.val).length;
            return (
              <View key={o.val} style={[s.statBox,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
                <Text style={[s.statNum,{color:o.color}]}>{cnt}</Text>
                <Text style={[s.statLbl,{color:theme.textMuted}]}>{lang==='mg'?o.labelMg:o.labelFr}</Text>
              </View>
            );
          })}
        </View>

        {/* Search */}
        <View style={[s.searchBox,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
          <Ionicons name="search" size={16} color={theme.textMuted} />
          <TextInput value={search} onChangeText={setSearch} placeholder={t(lang,'search')}
            placeholderTextColor={theme.textMuted} style={[s.searchInput,{color:theme.textPrimary}]} />
          {search ? <TouchableOpacity onPress={()=>setSearch('')}><Ionicons name="close-circle" size={16} color={theme.textMuted}/></TouchableOpacity> : null}
        </View>

        <PrimaryButton title={`+ ${t(lang,'foyer_add')}`} onPress={openAdd} style={{marginBottom:14}}/>

        {filtered.length===0
          ? <SectionCard><Text style={{color:theme.textMuted}}>{t(lang,'no_data')}</Text></SectionCard>
          : filtered.map(f=>(
            <SectionCard key={String(f.id)}>
              <View style={s.cardHead}>
                <View style={{flex:1}}>
                  <Text style={[s.name,{color:theme.textPrimary}]}>{f.nom||`Foyer #${f.id}`}</Text>
                  {f.adresse && <Text style={[s.sub,{color:theme.textMuted}]}>📍 {f.adresse}</Text>}
                </View>
                <View style={[s.badge,{backgroundColor:prioColor(f.priorite)+'22',borderColor:prioColor(f.priorite)}]}>
                  <Text style={[s.badgeTxt,{color:prioColor(f.priorite)}]}>{prioLabel(f.priorite)}</Text>
                </View>
              </View>
              {f.consommation_moyenne!=null && (
                <View style={[s.infoRow,{backgroundColor:theme.bgHover,borderRadius:8}]}>
                  <Ionicons name="flash" size={14} color={theme.accentTeal}/>
                  <Text style={[s.infoTxt,{color:theme.textSecondary}]}>
                    {t(lang,'foyer_consommation')}: <Text style={{color:theme.accentTeal,fontWeight:'800'}}>{fmtKwh(Number(f.consommation_moyenne)||0)}</Text>
                  </Text>
                </View>
              )}
              <View style={s.actions}>
                <TouchableOpacity onPress={()=>openEdit(f)} style={[s.actBtn,{borderColor:theme.accentTeal}]}>
                  <Ionicons name="pencil" size={14} color={theme.accentTeal}/>
                  <Text style={[s.actTxt,{color:theme.accentTeal}]}>{t(lang,'edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>handleDelete(f)} style={[s.actBtn,{borderColor:theme.accentRed}]}>
                  <Ionicons name="trash" size={14} color={theme.accentRed}/>
                  <Text style={[s.actTxt,{color:theme.accentRed}]}>{t(lang,'delete')}</Text>
                </TouchableOpacity>
              </View>
            </SectionCard>
          ))
        }
      </ScrollView>

      <FormModal visible={modal} title={editing?t(lang,'foyer_edit'):t(lang,'foyer_add')}
        onClose={()=>setModal(false)} onSave={handleSave} loading={saving} saveLabel={t(lang,'save')}>
        <FieldInput label={t(lang,'foyer_nom')} value={form.nom} onChangeText={v=>setForm(f=>({...f,nom:v}))} placeholder="Fokontany Atsimo" theme={theme}/>
        <FieldInput label={t(lang,'foyer_adresse')} value={form.adresse} onChangeText={v=>setForm(f=>({...f,adresse:v}))} placeholder="Village Nord" theme={theme}/>
        <FieldInput label={t(lang,'foyer_consommation')} value={form.consommation_moyenne} onChangeText={v=>setForm(f=>({...f,consommation_moyenne:v}))} keyboardType="numeric" placeholder="5.5" theme={theme}/>
        {/* Priorité selector */}
        <Text style={{color:theme.textSecondary,fontSize:12,fontWeight:'700',marginBottom:6}}>{t(lang,'foyer_priorite')}</Text>
        <View style={{flexDirection:'row',gap:8,marginBottom:14}}>
          {PRIO_OPTS.map(o=>(
            <TouchableOpacity key={o.val} onPress={()=>setForm(f=>({...f,priorite:o.val}))}
              style={{flex:1,padding:10,borderRadius:10,borderWidth:2,alignItems:'center',
                borderColor:form.priorite===o.val?o.color:theme.border,
                backgroundColor:form.priorite===o.val?o.color+'22':theme.bgInput}}>
              <Text style={{color:form.priorite===o.val?o.color:theme.textMuted,fontWeight:'800',fontSize:13}}>
                {lang==='mg'?o.labelMg:o.labelFr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </FormModal>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1},content:{padding:16,paddingBottom:32},
  statsRow:{flexDirection:'row',gap:10,marginBottom:14},
  statBox:{flex:1,padding:12,borderRadius:12,borderWidth:1,alignItems:'center'},
  statNum:{fontSize:22,fontWeight:'900'},statLbl:{fontSize:11,marginTop:2},
  searchBox:{flexDirection:'row',alignItems:'center',gap:8,padding:10,borderRadius:12,borderWidth:1,marginBottom:12},
  searchInput:{flex:1,fontSize:15},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10},
  name:{fontSize:16,fontWeight:'800'},sub:{fontSize:12,marginTop:2},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:99,borderWidth:1},
  badgeTxt:{fontSize:11,fontWeight:'800'},
  infoRow:{flexDirection:'row',alignItems:'center',gap:6,padding:8,marginBottom:2},
  infoTxt:{fontSize:13},
  actions:{flexDirection:'row',gap:10,marginTop:12},
  actBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,borderWidth:1},
  actTxt:{fontSize:13,fontWeight:'700'},
});
