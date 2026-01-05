import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import CustomPopup from '../components/CustomPopup';

export default function SettingsScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ visible: false, title: '', msg: '', type: 'info', onConfirm: null });

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user));
  }, []);

  // Função Auxiliar para abrir Popup
  const showPopup = (title, msg, type = 'info', onConfirm = null) => {
    setPopup({ visible: true, title, msg, type, onConfirm });
  };

  const copyUID = async () => {
    if(user?.id) {
        await Clipboard.setStringAsync(user.id);
        showPopup("Sucesso", "UHID copiado para a área de transferência.");
    }
  };

  const handleLogout = () => {
    showPopup("Sair da Conta", "Tem certeza que deseja sair?", 'info', async () => await supabase.auth.signOut());
  };

  const handleDelete = () => {
    showPopup("ZONA DE PERIGO", "Isso apagará sua conta permanentemente.", 'error', async () => {
        setLoading(true);
        const { error } = await supabase.rpc('delete_own_user');
        setLoading(false);
        if(error) showPopup("Erro", error.message, 'error');
        else await supabase.auth.signOut();
    });
  };

  const SettingItem = ({ icon, label, sub, color='#fff', onPress, arrow=true }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.cardLeft}>
            <View style={[styles.iconBox, {backgroundColor: '#222'}]}><Ionicons name={icon} size={22} color={color} /></View>
            <View>
                <Text style={[styles.cardLabel, {color}]}>{label}</Text>
                {sub && <Text style={styles.cardSub}>{sub}</Text>}
            </View>
        </View>
        {arrow && <Ionicons name="chevron-forward" size={20} color="#333" />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Configurações</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>IDENTIDADE</Text>
        <View style={styles.idCard}>
            <View>
                <Text style={styles.idLabel}>SUA CHAVE DE ACESSO (UHID)</Text>
                <Text style={styles.idValue}>{user?.id?.substring(0, 16).toUpperCase()}...</Text>
            </View>
            <TouchableOpacity style={styles.copyBtn} onPress={copyUID}><Text style={styles.copyText}>COPIAR</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>CONTA</Text>
        <SettingItem icon="log-out-outline" label="Sair do App" onPress={handleLogout} />

        <Text style={[styles.sectionTitle, {color:'#ff4444'}]}>ZONA DE RISCO</Text>
        <TouchableOpacity style={styles.dangerCard} onPress={handleDelete}>
            <View style={{flexDirection:'row', alignItems:'center', gap:15}}>
                <View style={{backgroundColor:'#3a0000', padding:8, borderRadius:8}}><Ionicons name="person-remove-outline" size={20} color="#ff4444" /></View>
                <Text style={{color:'#ff4444', fontWeight:'bold', fontSize:16}}>Apagar minha conta</Text>
            </View>
        </TouchableOpacity>
      </ScrollView>
      
      {loading && <ActivityIndicator color="red" size="large" style={styles.loadingOverlay}/>}
      
      <CustomPopup 
        visible={popup.visible} 
        title={popup.title} 
        message={popup.msg} 
        type={popup.type}
        onConfirm={popup.onConfirm}
        onClose={() => setPopup({...popup, visible: false})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 30 },
  sectionTitle: { color: '#00ff9d', fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginTop: 20 },
  idCard: { backgroundColor: '#111', padding: 20, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  idLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  idValue: { color: '#fff', fontSize: 18, fontFamily: 'monospace' },
  copyBtn: { backgroundColor: '#1a4030', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
  copyText: { color: '#00ff9d', fontSize: 11, fontWeight: 'bold' },
  card: { backgroundColor: '#111', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, borderWidth:1, borderColor:'#222' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  cardLabel: { fontSize: 16, fontWeight: 'bold' },
  dangerCard: { backgroundColor: '#150505', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#300' },
  loadingOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)' }
});
