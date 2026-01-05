import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import CustomAlert from '../components/CustomAlert';

export default function CreatePostScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado do Alerta
  const [alert, setAlert] = useState({ visible: false, title: '', msg: '', type: 'info', onSuccess: null });

  const showAlert = (title, msg, type = 'info', onSuccess = null) => {
    setAlert({ visible: true, title, msg, type, onSuccess });
  };

  const closeAlert = () => {
    setAlert({ ...alert, visible: false });
    if (alert.onSuccess) alert.onSuccess();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5, base64: true
    });
    if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64);
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !imageUri) return showAlert("Atenção", "Título e imagem são obrigatórios!", 'error');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = imageUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, decode(imageBase64), { contentType: 'image/' + fileExt });
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);

      const { error } = await supabase.from('posts').insert({
          title: title,
          image_url: urlData.publicUrl,
          content: content,
          user_id: user.id
      });

      if (error) throw error;
      
      // Sucesso: fecha o alert e navega
      showAlert('Sucesso', 'Post publicado com sucesso!', 'info', () => navigation.navigate('Main', { screen: 'Posts' }));
      
    } catch (error) {
      showAlert('Erro', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Post</Text>
        <TouchableOpacity style={styles.postBtn} onPress={handlePost} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#000" /> : <Text style={styles.postText}>Publicar</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {imageUri ? (
                <Image source={{uri: imageUri}} style={{width:'100%', height:'100%', borderRadius:10}} />
            ) : (
                <View style={{alignItems:'center'}}>
                    <Ionicons name="image-outline" size={40} color="#666" />
                    <Text style={{color:'#666'}}>Escolher da Galeria</Text>
                </View>
            )}
        </TouchableOpacity>

        <Text style={styles.label}>TÍTULO</Text>
        <TextInput style={styles.inputTitle} placeholder="Ex: Meu Jogo Incrível" placeholderTextColor="#555" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>DESCRIÇÃO</Text>
        <TextInput style={[styles.input, styles.textArea]} placeholder="Detalhes..." placeholderTextColor="#555" multiline value={content} onChangeText={setContent} />
      </ScrollView>

      <CustomAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.msg} 
        type={alert.type} 
        onClose={closeAlert} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  postBtn: { backgroundColor: '#00ff9d', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 20 },
  postText: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  form: { paddingHorizontal: 20 },
  imagePicker: { height: 200, backgroundColor: '#111', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  label: { color: '#00ff9d', fontSize: 12, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  inputTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  input: { color: '#fff', fontSize: 14, backgroundColor: '#111', padding: 12, borderRadius: 8, marginTop: 5 },
  textArea: { height: 100, textAlignVertical: 'top' }
});
