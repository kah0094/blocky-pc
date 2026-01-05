import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useNavigation } from '@react-navigation/native';

export default function DebugFab() {
  const [visible, setVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => { checkPermission(); }, []);

  const checkPermission = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (data && (data.role === 'dono' || data.role === 'admin')) setVisible(true);
    }
  };

  // --- MÁGICA: Converte ID Curto em UUID Real ---
  const resolveUser = async (input) => {
    if (!input) return null;
    if (input.length > 30) return input; // Já é um UUID completo

    try {
        // Busca usuário cujo ID começa com os caracteres digitados
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username')
            .ilike('id', `${input}%`) // Busca parcial
            .limit(1)
            .single();

        if (error || !data) {
            Alert.alert("Não encontrado", `Nenhum usuário começa com '${input}'`);
            return null;
        }
        return data.id;
    } catch (e) {
        return null;
    }
  };

  const handleAction = async (actionType, value) => {
    if (!targetInput) return Alert.alert("Erro", "Digite o ID curto.");
    setLoading(true);

    const realId = await resolveUser(targetInput);
    if (!realId) { setLoading(false); return; }

    let error = null;

    if (actionType === 'ROLE') {
        const { error: e } = await supabase.rpc('admin_set_role', { target_id: realId, new_role: value });
        error = e;
    } 
    else if (actionType === 'BAN') {
        const { error: e } = await supabase.rpc('admin_ban_user', { target_id: realId, hours: value });
        error = e;
    }
    else if (actionType === 'UNBAN') {
        const { error: e } = await supabase.rpc('admin_unban_user', { target_id: realId });
        error = e;
    }
    else if (actionType === 'CHAT') {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase.from('rooms').select('id').or(`and(user_a.eq.${user.id},user_b.eq.${realId}),and(user_a.eq.${realId},user_b.eq.${user.id})`).maybeSingle();
        
        if (existing) {
            navigation.navigate('Chat', { roomId: existing.id, user: { username: 'Alvo' } }); // Username fake pra não travar
        } else {
            const { data: newRoom, error: e } = await supabase.from('rooms').insert({ user_a: user.id, user_b: realId }).select().single();
            if (!e) navigation.navigate('Chat', { roomId: newRoom.id, user: { username: 'Novo Chat' } });
            error = e;
        }
        setPanelOpen(false);
    }

    setLoading(false);
    if (error) Alert.alert("Erro", error.message);
    else if (actionType !== 'CHAT') Alert.alert("Sucesso", "Comando aplicado.");
  };

  if (!visible) return null;

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setPanelOpen(true)}>
        <Ionicons name="terminal" size={24} color="#000" />
      </TouchableOpacity>

      <Modal visible={panelOpen} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.header}>
                <Text style={styles.title}>Admin Console</Text>
                <TouchableOpacity onPress={() => setPanelOpen(false)}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
            </View>

            <ScrollView>
                <Text style={styles.label}>ID DO USUÁRIO (6 primeiros dígitos)</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ex: a1b2c3" 
                    placeholderTextColor="#666"
                    value={targetInput}
                    onChangeText={setTargetInput}
                    autoCapitalize="none"
                />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>CARGOS</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#ff4444'}]} onPress={() => handleAction('ROLE', 'admin')}><Text style={styles.btnTxt}>Admin</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#ffd700'}]} onPress={() => handleAction('ROLE', 'dono')}><Text style={[styles.btnTxt, {color:'#000'}]}>Dono</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#00ff00'}]} onPress={() => handleAction('ROLE', 'dev')}><Text style={styles.btnTxt}>Dev</Text></TouchableOpacity>
                    </View>
                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#00aaff'}]} onPress={() => handleAction('ROLE', 'verificado')}><Text style={styles.btnTxt}>Verif.</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#ff00ff'}]} onPress={() => handleAction('ROLE', 'premium')}><Text style={styles.btnTxt}>VIP</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#888'}]} onPress={() => handleAction('ROLE', 'member')}><Text style={styles.btnTxt}>Membro</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, {color:'red'}]}>PENALIDADES</Text>
                    <View style={styles.row}>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#550000'}]} onPress={() => handleAction('BAN', 1)}><Text style={styles.btnTxt}>1h</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#aa0000'}]} onPress={() => handleAction('BAN', 24)}><Text style={styles.btnTxt}>24h</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.btn, {backgroundColor:'#ff0000'}]} onPress={() => handleAction('BAN', -1)}><Text style={styles.btnTxt}>PERMA</Text></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.btn, {backgroundColor:'#00aa00', marginTop:5}]} onPress={() => handleAction('UNBAN')}>
                        <Text style={styles.btnTxt}>REMOVER BANIMENTO</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.btn, {backgroundColor:'#6200ee'}]} onPress={() => handleAction('CHAT')}>
                    {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.btnTxt}>ABRIR CHAT SECRETO</Text>}
                </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', top: 120, right: 0, backgroundColor: '#00ff9d', padding: 12, borderTopLeftRadius: 10, borderBottomLeftRadius: 10, zIndex: 999, elevation: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 },
  panel: { backgroundColor: '#111', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  label: { color: '#00ff9d', fontSize: 10, marginBottom: 5, fontWeight:'bold' },
  input: { backgroundColor: '#222', color: '#fff', padding: 12, borderRadius: 5, borderWidth: 1, borderColor: '#444', marginBottom: 20, fontSize: 18, fontFamily: 'monospace', textAlign:'center', letterSpacing: 2 },
  section: { marginBottom: 20, padding: 10, backgroundColor: '#1a1a1a', borderRadius: 8 },
  sectionTitle: { color: '#666', fontWeight: 'bold', marginBottom: 10, fontSize: 10 },
  row: { flexDirection: 'row', gap: 5, marginBottom: 5 },
  btn: { flex: 1, padding: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 11 }
});
