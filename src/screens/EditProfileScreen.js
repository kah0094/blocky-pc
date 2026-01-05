import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer'; // <--- IMPORTANTE
import CustomAlert from '../components/CustomAlert';

export default function EditProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ visible:false, title:'', msg:'', type:'info' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if(data) {
            setUsername(data.username || '');
            setBio(data.bio || '');
            setAvatarUrl(data.avatar_url);
        }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true
    });

    if (!result.canceled) {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            const fileExt = result.assets[0].uri.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, decode(result.assets[0].base64), { contentType: 'image/' + fileExt });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('images').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl); // Mostra preview
        } catch (error) {
            setAlert({ visible:true, title:'Erro Upload', msg: error.message, type:'error' });
        } finally {
            setLoading(false);
        }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
        .from('profiles')
        .update({ username, bio, avatar_url: avatarUrl })
        .eq('id', user.id);
    
    setLoading(false);
    
    if(error) setAlert({ visible:true, title:'Erro', msg: error.message, type:'error' });
    else {
        navigation.goBack(); // Volta e atualiza
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Editar Perfil</Text>
        <TouchableOpacity onPress={handleSave}>
            {loading ? <ActivityIndicator color="#00ff9d" /> : <Ionicons name="checkmark" size={28} color="#00ff9d" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={pickImage}>
                <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                <View style={styles.camIcon}><Ionicons name="camera" size={20} color="#000" /></View>
            </TouchableOpacity>
        </View>

        <Text style={styles.label}>NOME DE EXIBIÇÃO</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholderTextColor="#555" />

        <Text style={styles.label}>BIOGRAFIA</Text>
        <TextInput style={[styles.input, {height:100, textAlignVertical:'top'}]} value={bio} onChangeText={setBio} multiline placeholderTextColor="#555" />
      </ScrollView>

      <CustomAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.msg} 
        type={alert.type}
        onClose={() => setAlert({...alert, visible:false})} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#222' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20 },
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#333' },
  camIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#00ff9d', padding: 8, borderRadius: 20 },
  label: { color: '#666', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#333' }
});
