import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safeGet, safePost, safePut, safeDelete } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import ProgressBar from '../components/ui/ProgressBar';
import FormModal, { FieldInput } from '../components/ui/FormModal';
import { fmtKwh, fmtPct, fmtPctNum } from '../utils/format';
import { t } from '../i18n/strings';

const EMPTY = { nom:'', capacite_totale:'', capacite_actuelle:'', seuil_critique:'', localisation:'' };

export default function BatteriesScreen() {
  const { theme, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [batteries, setBatteries] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await safeGet('/batteries');
    if (r.ok) setBatteries(Array.isArray(r.data)?r.data:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }
  function openEdit(b) {
    setEditing(b);
    setForm({ nom:String(b.nom||''), capacite_totale:String(b.capacite_totale||''), capacite_actuelle:String(b.capacite_actuelle||''), seuil_critique:String(b.seuil_critique||''), localisation:String(b.localisation||b.emplacement||'') });
    setModal(true);
  }

  async function handleSave() {
    if (!form.capacite_totale) return Alert.alert(t(lang,'error'), 'Capacité totale requise');
    setSaving(true);
    const body = { nom:form.nom, capacite_totale:Number(form.capacite_totale), capacite_actuelle:Number(form.capacite_actuelle)||0, seuil_critique:Number(form.seuil_critique)||0, localisation:form.localisation };
    const r = editing ? await safePut(`/batteries/${editing.id}`, body) : await safePost('/batteries', body);
    setSaving(false);
    if (r.ok) { setModal(false); load(); }
    else Alert.alert(t(lang,'error'), r.error);
  }

  async function handleDelete(b) {
    Alert.alert(t(lang,'battery_delete_confirm'), b.nom||`#${b.id}`, [
      { text: t(lang,'cancel'), style:'cancel' },
      { text: t(lang,'delete'), style:'destructive', onPress: async () => {
          const r = await safeDelete(`/batteries/${b.id}`);
          if (r.ok) load(); else Alert.alert(t(lang,'error'), r.error);
      }},
    ]);
  }

  const criticals = batteries.filter(b => {
    const act=Number(b.capacite_actuelle)||0, thr=Number(b.seuil_critique)||0;
    return act<=thr;
  });

  return (
    <View style={[s.root, { backgroundColor: theme.bgPrimary }]}>
      <AppHeader title={t(lang,'batteries')} />
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen} />}
      >
        {/* Alertes */}
        {criticals.length > 0 && (
          <View style={[s.alert, { backgroundColor: theme.accentRed+'22', borderColor: theme.accentRed }]}>
            <Ionicons name="warning" size={18} color={theme.accentRed} />
            <Text style={[s.alertTxt, { color: theme.accentRed }]}>
              {criticals.length} {t(lang,'battery_alert')} — {t(lang,'battery_below_threshold')}
            </Text>
          </View>
        )}

        {/* Add button */}
        <PrimaryButton title={`+ ${t(lang,'battery_add')}`} onPress={openAdd} style={{ marginBottom: 14 }} />

        {/* Liste batteries */}
        {batteries.length===0
          ? <SectionCard><Text style={{ color:theme.textMuted }}>{t(lang,'no_data')}</Text></SectionCard>
          : batteries.map(b => {
              const cap = Number(b.capacite_totale)||0;
              const act = Number(b.capacite_actuelle)||0;
              const thr = Number(b.seuil_critique)||0;
              const pct = fmtPctNum(act,cap);
              const isCrit = act<=thr;
              const statusColor = pct<20?theme.accentRed:pct<50?theme.accentYellow:theme.accentGreen;
              const statusLabel = pct>=80?t(lang,'battery_full'):pct>=50?t(lang,'battery_ok'):pct>=20?t(lang,'battery_low'):t(lang,'battery_critical');
              return (
                <SectionCard key={String(b.id)}>
                  <View style={s.cardHead}>
                    <View>
                      <Text style={[s.name, { color:theme.textPrimary }]}>{b.nom||`Batterie #${b.id}`}</Text>
                      {(b.localisation||b.emplacement) && <Text style={[s.loc, { color:theme.textMuted }]}>📍 {b.localisation||b.emplacement}</Text>}
                    </View>
                    <View style={[s.badge, { backgroundColor: statusColor+'22', borderColor: statusColor }]}>
                      <Text style={[s.badgeTxt, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>

                  <View style={s.pctRow}>
                    <Text style={[s.pctNum, { color: statusColor }]}>{pct}%</Text>
                    <Text style={[s.pctSub, { color: theme.textMuted }]}>{fmtKwh(act)} / {fmtKwh(cap)}</Text>
                  </View>
                  <ProgressBar value={act} max={cap} height={10} />

                  {thr > 0 && (
                    <Text style={[s.thr, { color: isCrit ? theme.accentRed : theme.textMuted }]}>
                      {isCrit ? '⚠️ ' : ''}{t(lang,'battery_threshold')}: {fmtKwh(thr)}
                    </Text>
                  )}

                  <View style={s.actions}>
                    <TouchableOpacity onPress={()=>openEdit(b)} style={[s.actBtn, { borderColor:theme.accentTeal }]}>
                      <Ionicons name="pencil" size={14} color={theme.accentTeal} />
                      <Text style={[s.actTxt, { color:theme.accentTeal }]}>{t(lang,'edit')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={()=>handleDelete(b)} style={[s.actBtn, { borderColor:theme.accentRed }]}>
                      <Ionicons name="trash" size={14} color={theme.accentRed} />
                      <Text style={[s.actTxt, { color:theme.accentRed }]}>{t(lang,'delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </SectionCard>
              );
            })
        }
      </ScrollView>

      {/* Modal form */}
      <FormModal
        visible={modal} title={editing ? t(lang,'battery_edit') : t(lang,'battery_add')}
        onClose={()=>setModal(false)} onSave={handleSave} loading={saving}
        saveLabel={t(lang,'save')}
      >
        <FieldInput label={t(lang,'battery_name')} value={form.nom} onChangeText={v=>setForm(f=>({...f,nom:v}))} placeholder="Batterie principale" theme={theme} />
        <FieldInput label={t(lang,'battery_cap_total')} value={form.capacite_totale} onChangeText={v=>setForm(f=>({...f,capacite_totale:v}))} keyboardType="numeric" placeholder="100" theme={theme} />
        <FieldInput label={t(lang,'battery_cap_actual')} value={form.capacite_actuelle} onChangeText={v=>setForm(f=>({...f,capacite_actuelle:v}))} keyboardType="numeric" placeholder="75" theme={theme} />
        <FieldInput label={t(lang,'battery_threshold')} value={form.seuil_critique} onChangeText={v=>setForm(f=>({...f,seuil_critique:v}))} keyboardType="numeric" placeholder="20" theme={theme} />
        <FieldInput label={t(lang,'battery_location')} value={form.localisation} onChangeText={v=>setForm(f=>({...f,localisation:v}))} placeholder="Village Nord" theme={theme} />
      </FormModal>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1}, content:{padding:16,paddingBottom:32},
  alert:{flexDirection:'row',alignItems:'center',gap:8,padding:12,borderRadius:12,borderWidth:1,marginBottom:14},
  alertTxt:{fontWeight:'700',fontSize:13,flex:1},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12},
  name:{fontSize:16,fontWeight:'800'},
  loc:{fontSize:12,marginTop:2},
  badge:{paddingHorizontal:10,paddingVertical:4,borderRadius:99,borderWidth:1},
  badgeTxt:{fontSize:11,fontWeight:'800'},
  pctRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline',marginBottom:8},
  pctNum:{fontSize:28,fontWeight:'900'},
  pctSub:{fontSize:12},
  thr:{fontSize:12,marginTop:8},
  actions:{flexDirection:'row',gap:10,marginTop:14},
  actBtn:{flexDirection:'row',alignItems:'center',gap:5,paddingVertical:7,paddingHorizontal:14,borderRadius:8,borderWidth:1},
  actTxt:{fontSize:13,fontWeight:'700'},
});
