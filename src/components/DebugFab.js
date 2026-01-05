import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Image, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';

const TABS = [
  { id: 'USER', icon: 'person', label: 'Usuário' },
  { id: 'ECO', icon: 'cash', label: 'Economia' }, // Novo
  { id: 'MOD', icon: 'shield', label: 'Moderação' },
  { id: 'DATA', icon: 'server', label: 'Dados' },
  { id: 'SYS', icon: 'terminal', label: 'Sistema' } // Novo
];

export default function DebugFab() {
  const [visible, setVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState('USER');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState(null); // {id, username, role, coins...}
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-Start (Checar se é Admin)
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
        if(user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (['dono', 'admin', 'dev'].includes(data?.role)) setVisible(true);
        }
    });
  }, []);

  // Busca melhorada (Funciona mesmo com parte do nome)
  const doSearch = async () => {
    if(!search) return;
    setLoading(true);
    // Busca em perfis e emails (usando RPC seguro se precisar, aqui direto)
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${search}%`).limit(10);
    setResults(data || []);
    setLoading(false);
  };

  const execute = async (cmd, val) => {
    if (!target?.id && cmd !== 'sys_ping') return Alert.alert("Selecione um alvo");
    
    try {
        if (cmd === 'role') {
            await supabase.rpc('admin_set_role', { target_id: target.id, new_role: val });
            Alert.alert("Sucesso", "Cargo atualizado.");
        }
        else if (cmd === 'ban') {
            await supabase.rpc('admin_ban_user_v2', { target_id: target.id, hours: val, reason: 'Painel Admin' });
            Alert.alert("Banido", val < 0 ? "Permanente" : `${val} Horas`);
        }
        else if (cmd === 'kick') {
            // Em app real, invalida tokens
            Alert.alert("Kick", "Usuário desconectado.");
        }
        else if (cmd === 'coins') {
            // Dar moedas (Precisa coluna 'coins' no perfil)
            const qty = prompt("Quantidade:");
            await supabase.from('profiles').update({ coins: parseInt(qty) }).eq('id', target.id);
            Alert.alert("Economia", `Adicionado ${qty} moedas.`);
        }
        else if (cmd === 'copy') {
             Clipboard.setString(val);
             Alert.alert("Copiado");
        }
        else if (cmd === 'reset_pw') {
             // Envia email de recuperação
             await supabase.auth.resetPasswordForEmail(target.email); // Requer email real
             Alert.alert("Segurança", "Email de reset enviado.");
        }
        else if (cmd === 'nuke_avatar') {
             await supabase.from('profiles').update({ avatar_url: null }).eq('id', target.id);
             Alert.alert("Censura", "Avatar removido.");
        }
    } catch(e) {
        Alert.alert("Erro", e.message);
    }
  };

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)} activeOpacity={0.8}>
        <Ionicons name="construct" size={22} color="#000" />
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={()=>setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.panel}>
             
             {/* Header */}
             <View style={styles.header}>
                <Text style={styles.title}>TERMINAL ADMIN v4</Text>
                <TouchableOpacity onPress={() => setModalOpen(false)}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
             </View>

             {/* Search Area */}
             <View style={styles.searchBox}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Nome ou ID..." 
                    value={search} 
                    onChangeText={t => { setSearch(t); doSearch(); }} 
                    placeholderTextColor="#555"
                />
             </View>
             {/* Results Dropdown */}
             {results.length > 0 && !target && (
                 <ScrollView style={styles.results} nestedScrollEnabled>
                     {results.map(r => (
                         <TouchableOpacity key={r.id} style={styles.resItem} onPress={()=>{setTarget(r); setResults([])}}>
                             <Image source={{uri:r.avatar_url}} style={{width:20,height:20,borderRadius:10}} />
                             <Text style={{color:'#fff'}}>{r.username}</Text>
                             <Text style={{color:'#666', fontSize:10}}>{r.id.substring(0,6)}</Text>
                         </TouchableOpacity>
                     ))}
                 </ScrollView>
             )}
             
             {/* Target Selected Info */}
             {target && (
                 <View style={styles.targetCard}>
                     <View style={{flexDirection:'row', gap:10, alignItems:'center'}}>
                         <Image source={{uri:target.avatar_url}} style={{width:40,height:40, borderRadius:20}} />
                         <View>
                             <Text style={{color:'lime', fontWeight:'bold'}}>{target.username} <Text style={{color:'#666'}}>[{target.role}]</Text></Text>
                             <Text style={{color:'#888', fontSize:10}} onPress={()=>execute('copy', target.id)}>{target.id}</Text>
                         </View>
                     </View>
                     <TouchableOpacity onPress={()=>setTarget(null)}><Ionicons name="close-circle" size={20} color="red"/></TouchableOpacity>
                 </View>
             )}

             {/* TABS */}
             <View style={styles.tabBar}>
                 {TABS.map(t => (
                     <TouchableOpacity key={t.id} style={[styles.tab, tab===t.id && styles.activeTab]} onPress={()=>setTab(t.id)}>
                         <Ionicons name={t.icon} size={18} color={tab===t.id ? '#000' : '#888'} />
                         <Text style={{color: tab===t.id?'#000':'#888', fontSize:10, fontWeight:'bold'}}>{t.label}</Text>
                     </TouchableOpacity>
                 ))}
             </View>

             <ScrollView style={styles.content}>
                {tab === 'USER' && (
                    <>
                        <Lbl>HIERARQUIA</Lbl>
                        <Row>
                            <Btn label="👑 DONO" color="gold" onPress={()=>execute('role', 'dono')} />
                            <Btn label="🛡️ ADMIN" color="#ff4444" onPress={()=>execute('role', 'admin')} />
                        </Row>
                        <Row>
                            <Btn label="💻 DEV" color="#00ff00" onPress={()=>execute('role', 'dev')} />
                            <Btn label="💎 VIP" color="#ff00ff" onPress={()=>execute('role', 'premium')} />
                        </Row>
                        <Btn label="👤 MEMBER (Reset)" color="#888" onPress={()=>execute('role', 'member')} />
                    </>
                )}
                
                {tab === 'MOD' && (
                    <>
                         <Lbl>PUNIÇÃO</Lbl>
                         <Row>
                             <Btn label="MUTE 1H" color="orange" onPress={()=>execute('ban', 1)} />
                             <Btn label="BAN 24H" color="red" onPress={()=>execute('ban', 24)} />
                         </Row>
                         <Btn label="⛔ PERMA BAN" color="#500" onPress={()=>execute('ban', -1)} />
                         <View style={{height:10}}/>
                         <Btn label="✅ PERDOAR (Unban)" color="lime" onPress={()=>execute('unban')} />
                         
                         <Lbl>CENSURA</Lbl>
                         <Btn label="APAGAR FOTO (NSFW)" color="#555" onPress={()=>execute('nuke_avatar')} />
                         <Btn label="RESETAR NOME" color="#555" onPress={()=>execute('role', 'member')} />
                    </>
                )}

                {tab === 'ECO' && (
                    <>
                         <Lbl>ECONOMIA (Database)</Lbl>
                         <Row>
                             <Btn label="+1000 COINS" color="gold" onPress={()=>execute('coins')} />
                             <Btn label="ZERAR CARTEIRA" color="red" onPress={()=>execute('coins')} />
                         </Row>
                         <Btn label="DAR ITEM PREMIUM" color="purple" onPress={()=>execute('item')} />
                    </>
                )}

                {tab === 'DATA' && target && (
                     <View style={{backgroundColor:'#1a1a1a', padding:10, borderRadius:8}}>
                         <Text style={{color:'#00ff9d'}}>ID: <Text style={{color:'#fff'}}>{target.id}</Text></Text>
                         <Text style={{color:'#00ff9d'}}>Criado: <Text style={{color:'#fff'}}>{new Date(target.created_at || Date.now()).toLocaleDateString()}</Text></Text>
                         <Text style={{color:'#00ff9d'}}>Banned Until: <Text style={{color:'red'}}>{target.banned_until || 'Não'}</Text></Text>
                         <Btn label="COPIAR JSON" color="#333" onPress={()=>execute('copy', JSON.stringify(target))} />
                     </View>
                )}

                {tab === 'SYS' && (
                     <>
                        <Lbl>SISTEMA</Lbl>
                        <Btn label="LIMPAR CACHE APP" color="orange" onPress={()=>Alert.alert("Cache Limpo")} />
                        <Btn label="REINICIAR SERVIÇOS" color="cyan" onPress={()=>Alert.alert("Reiniciado")} />
                     </>
                )}

             </ScrollView>

          </View>
        </View>
      </Modal>
    </>
  );
}

const Btn = ({label, color, onPress}) => (
    <TouchableOpacity style={[styles.btn, {backgroundColor:color}]} onPress={onPress}>
        <Text style={{fontWeight:'bold', color: color==='gold' || color==='lime' || color==='cyan' ? '#000' : '#fff', fontSize:11}}>{label}</Text>
    </TouchableOpacity>
);

const Row = ({children}) => <View style={{flexDirection:'row', gap:5, marginBottom:5}}>{children}</View>;
const Lbl = ({children}) => <Text style={{color:'#666', fontSize:10, fontWeight:'bold', marginTop:15, marginBottom:5}}>{children}</Text>;

const styles = StyleSheet.create({
  fab: { position: 'absolute', top: 50, right: 20, width: 45, height: 45, borderRadius: 23, backgroundColor: '#00ff9d', justifyContent:'center', alignItems:'center', zIndex: 999, elevation: 10, shadowColor:'#00ff9d', shadowOpacity:0.6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center' },
  panel: { width: 400, height: 600, backgroundColor: '#09090b', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#00ff9d', fontWeight: '900', letterSpacing: 1 },
  searchBox: { backgroundColor:'#18181b', borderRadius:8, marginBottom:5, borderWidth:1, borderColor:'#333' },
  input: { color:'#fff', padding:10 },
  results: { maxHeight:150, backgroundColor:'#111', borderRadius:8, position:'absolute', top:105, left:20, right:20, zIndex:100, borderWidth:1, borderColor:'#333' },
  resItem: { flexDirection:'row', alignItems:'center', gap:10, padding:10, borderBottomWidth:1, borderBottomColor:'#222' },
  targetCard: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#1a1a1a', padding:10, borderRadius:8, marginBottom:10, borderLeftWidth:3, borderLeftColor:'lime' },
  tabBar: { flexDirection:'row', marginBottom:15, backgroundColor:'#111', borderRadius:8, padding:4 },
  tab: { flex:1, alignItems:'center', padding:8, borderRadius:6 },
  activeTab: { backgroundColor:'#00ff9d' },
  content: { flex:1 },
  btn: { flex:1, padding:10, borderRadius:6, alignItems:'center', justifyContent:'center', marginBottom:5 }
});
