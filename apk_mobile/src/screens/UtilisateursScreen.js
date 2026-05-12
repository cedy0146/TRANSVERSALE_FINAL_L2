import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { safeGet, safeDelete } from '../services/api';
import AppHeader from '../components/ui/AppHeader';
import SectionCard from '../components/ui/SectionCard';
import { fmtDate } from '../utils/format';
import { t } from '../i18n/strings';

const ROLE_COLOR = {
  ADMIN: '#b388ff', RESPONSABLE: '#00e5a0', VILLAGEOIS: '#00bcd4',
};
const ROLE_ICON  = {
  ADMIN: 'shield-checkmark', RESPONSABLE: 'person-circle', VILLAGEOIS: 'people',
};

export default function UtilisateursScreen() {
  const { theme, lang } = useApp();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    const r = await safeGet('/utilisateurs');
    if (r.ok) setUsers(Array.isArray(r.data)?r.data:[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  async function handleDelete(u) {
    Alert.alert(t(lang,'user_delete_confirm'), u.nom||u.email||`#${u.id}`, [
      { text:t(lang,'cancel'), style:'cancel' },
      { text:t(lang,'delete'), style:'destructive', onPress:async()=>{
        const r=await safeDelete(`/utilisateurs/${u.id}`); if(r.ok)load(); else Alert.alert(t(lang,'error'),r.error);
      }},
    ]);
  }

  const roles = [...new Set(users.map(u=>(u.role||'').toUpperCase()).filter(Boolean))];
  const filtered = filter==='all' ? users : users.filter(u=>(u.role||'').toUpperCase()===filter);

  const roleLabel = (role) => {
    const r=(role||'').toUpperCase();
    if(r==='ADMIN') return t(lang,'role_admin');
    if(r==='RESPONSABLE') return t(lang,'role_responsable');
    return t(lang,'role_villageois');
  };

  return (
    <View style={[s.root,{backgroundColor:theme.bgPrimary}]}>
      <AppHeader title={t(lang,'utilisateurs')} />
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accentGreen}/>}>

        {/* Stats par rôle */}
        <View style={s.statsRow}>
          {[
            {role:'ADMIN',label:t(lang,'role_admin')},
            {role:'RESPONSABLE',label:t(lang,'role_responsable')},
            {role:'VILLAGEOIS',label:t(lang,'role_villageois')},
          ].map(x=>{
            const cnt=users.filter(u=>(u.role||'').toUpperCase()===x.role).length;
            const c=ROLE_COLOR[x.role]||theme.accentTeal;
            return (
              <View key={x.role} style={[s.statBox,{backgroundColor:theme.bgCard,borderColor:theme.border}]}>
                <Ionicons name={ROLE_ICON[x.role]} size={18} color={c}/>
                <Text style={[s.statNum,{color:c}]}>{cnt}</Text>
                <Text style={[s.statLbl,{color:theme.textMuted}]}>{x.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Filtres */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:12}}>
          {['all',...roles].map(r=>{
            const isActive=filter===r;
            const c=r==='all'?theme.accentGreen:(ROLE_COLOR[r]||theme.accentTeal);
            return (
              <TouchableOpacity key={r} onPress={()=>setFilter(r)}
                style={[s.filterBtn,{borderColor:isActive?c:theme.border,backgroundColor:isActive?c+'22':theme.bgCard}]}>
                <Text style={[s.filterTxt,{color:isActive?c:theme.textMuted}]}>
                  {r==='all'?'Tous':roleLabel(r)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Liste */}
        {filtered.length===0
          ? <SectionCard><Text style={{color:theme.textMuted}}>{t(lang,'no_data')}</Text></SectionCard>
          : filtered.map(u=>{
              const role=(u.role||'VILLAGEOIS').toUpperCase();
              const roleC=ROLE_COLOR[role]||theme.accentTeal;
              return (
                <SectionCard key={String(u.id)}>
                  <View style={s.cardRow}>
                    {/* Avatar */}
                    <View style={[s.avatar,{backgroundColor:roleC+'33'}]}>
                      <Ionicons name={ROLE_ICON[role]||'person'} size={22} color={roleC}/>
                    </View>
                    {/* Infos */}
                    <View style={{flex:1}}>
                      <Text style={[s.name,{color:theme.textPrimary}]}>{u.username||u.nom||u.name||`Utilisateur #${u.id}`}</Text>
                      {u.email && <Text style={[s.email,{color:theme.textMuted}]}>{u.email}</Text>}
                      <View style={[s.roleBadge,{backgroundColor:roleC+'22',borderColor:roleC}]}>
                        <Text style={[s.roleTxt,{color:roleC}]}>{roleLabel(role)}</Text>
                      </View>
                    </View>
                    {/* Actions */}
                    <TouchableOpacity onPress={()=>handleDelete(u)} style={[s.delBtn,{borderColor:theme.accentRed}]}>
                      <Ionicons name="trash" size={16} color={theme.accentRed}/>
                    </TouchableOpacity>
                  </View>
                  {u.created_at && (
                    <Text style={[s.date,{color:theme.textMuted}]}>
                      {t(lang,'created_at')} {fmtDate(u.created_at)}
                    </Text>
                  )}
                </SectionCard>
              );
            })
        }

        {/* Note info */}
        <View style={[s.infoBox,{backgroundColor:theme.accentTeal+'15',borderColor:theme.accentTeal}]}>
          <Ionicons name="information-circle" size={18} color={theme.accentTeal}/>
          <Text style={[s.infoTxt,{color:theme.textSecondary}]}>
            {lang==='mg'
              ? "Ny fanamboarana mpampiasa dia atao amin'ny faritra backend."
              : "La création d'utilisateurs se fait via le système d'authentification backend."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1},content:{padding:16,paddingBottom:32},
  statsRow:{flexDirection:'row',gap:8,marginBottom:14},
  statBox:{flex:1,padding:12,borderRadius:12,borderWidth:1,alignItems:'center',gap:4},
  statNum:{fontSize:20,fontWeight:'900'},statLbl:{fontSize:10,textAlign:'center'},
  filterBtn:{paddingVertical:7,paddingHorizontal:14,borderRadius:99,borderWidth:1,marginRight:8},
  filterTxt:{fontSize:12,fontWeight:'700'},
  cardRow:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:8},
  avatar:{width:46,height:46,borderRadius:23,alignItems:'center',justifyContent:'center'},
  name:{fontSize:15,fontWeight:'800'},email:{fontSize:12,marginTop:2},
  roleBadge:{alignSelf:'flex-start',paddingHorizontal:8,paddingVertical:3,borderRadius:99,borderWidth:1,marginTop:5},
  roleTxt:{fontSize:10,fontWeight:'800'},
  delBtn:{width:34,height:34,borderRadius:8,borderWidth:1,alignItems:'center',justifyContent:'center'},
  date:{fontSize:11},
  infoBox:{flexDirection:'row',alignItems:'flex-start',gap:10,padding:14,borderRadius:12,borderWidth:1,marginTop:8},
  infoTxt:{flex:1,fontSize:13,lineHeight:19},
});
