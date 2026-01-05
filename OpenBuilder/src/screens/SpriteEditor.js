import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Image, PanResponder, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const SCREEN_W = Dimensions.get('window').width;
const GRID_SIZE = 16; // 16x16
const PIXEL_SIZE = (SCREEN_W - 20) / GRID_SIZE;

// Cores Padrão
const PALETTE = [
  '#000000', '#FFFFFF', '#6200EE', '#03DAC6', '#B00020', 
  '#FFD700', '#FF5722', '#4CAF50', '#2196F3', '#8D6E63',
  '#E91E63', '#9C27B0', 'transparent'
];

// Componente de Pixel Otimizado (Só renderiza se mudar cor)
const Pixel = React.memo(({ color, onPress, size }) => (
  <View 
    style={{
      width: size, height: size, 
      backgroundColor: color === 'transparent' ? 'transparent' : color,
      borderWidth: 0.2, borderColor: 'rgba(255,255,255,0.1)'
    }}
  />
));

export default function SpriteEditor({ navigation }) {
  const [pixels, setPixels] = useState(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [tool, setTool] = useState('PENCIL'); // PENCIL, ERASER, BUCKET
  const [bgImage, setBgImage] = useState(null); // Imagem de referência (Traço)

  // --- LÓGICA DE FERRAMENTAS ---

  const handlePaint = (index) => {
    if (index < 0 || index >= pixels.length) return;
    
    // Ferramenta Balde (Flood Fill)
    if (tool === 'BUCKET') {
      const targetColor = pixels[index];
      if (targetColor === selectedColor) return;
      
      const newPixels = [...pixels];
      const stack = [index];
      
      while (stack.length > 0) {
        const i = stack.pop();
        if (newPixels[i] !== targetColor) continue;
        
        newPixels[i] = selectedColor;
        
        const x = i % GRID_SIZE;
        const y = Math.floor(i / GRID_SIZE);
        
        if (x > 0) stack.push(i - 1); // Esq
        if (x < GRID_SIZE - 1) stack.push(i + 1); // Dir
        if (y > 0) stack.push(i - GRID_SIZE); // Cima
        if (y < GRID_SIZE - 1) stack.push(i + GRID_SIZE); // Baixo
      }
      setPixels(newPixels);
      return;
    }

    // Ferramenta Lápis / Borracha
    const colorToPaint = tool === 'ERASER' ? 'transparent' : selectedColor;
    if (pixels[index] !== colorToPaint) {
      const newPixels = [...pixels];
      newPixels[index] = colorToPaint;
      setPixels(newPixels);
    }
  };

  // --- GESTOS (Arrastar para pintar) ---
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const index = getIndexFromCoords(locationX, locationY);
        handlePaint(index);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const index = getIndexFromCoords(locationX, locationY);
        handlePaint(index);
      },
    })
  ).current;

  const getIndexFromCoords = (x, y) => {
    const col = Math.floor(x / PIXEL_SIZE);
    const row = Math.floor(y / PIXEL_SIZE);
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      return row * GRID_SIZE + col;
    }
    return -1;
  };

  // --- FUNÇÕES EXTRAS ---
  const importReference = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled) setBgImage(result.assets[0].uri);
  };

  const saveAsset = async () => {
    const newAsset = {
      id: 'sprite_' + Date.now(),
      label: 'Novo Sprite',
      type: 'dynamic', // Pode ser personagem
      pixels: pixels,
      isCustom: true
    };
    try {
      const existing = await AsyncStorage.getItem('MY_ASSETS');
      const assets = existing ? JSON.parse(existing) : [];
      assets.push(newAsset);
      await AsyncStorage.setItem('MY_ASSETS', JSON.stringify(assets));
      Alert.alert('Salvo!', 'Sprite adicionado aos assets.');
      navigation.goBack();
    } catch (e) { Alert.alert('Erro', 'Falha ao salvar'); }
  };

  return (
    <View style={styles.container}>
      {/* Topo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Pixel Studio</Text>
        <TouchableOpacity onPress={saveAsset} style={styles.saveBtn}><Ionicons name="save" size={20} color="#000" /></TouchableOpacity>
      </View>

      {/* Toolbar Ferramentas */}
      <View style={styles.toolbar}>
        <TouchableOpacity onPress={() => setTool('PENCIL')} style={[styles.toolBtn, tool === 'PENCIL' && styles.activeTool]}>
           <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTool('BUCKET')} style={[styles.toolBtn, tool === 'BUCKET' && styles.activeTool]}>
           <Ionicons name="color-fill" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTool('ERASER')} style={[styles.toolBtn, tool === 'ERASER' && styles.activeTool]}>
           <Ionicons name="trash-bin" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={importReference} style={styles.toolBtn}>
           <Ionicons name="image" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* Canvas */}
      <View style={styles.canvasArea}>
        <View 
          style={styles.gridContainer}
          {...panResponder.panHandlers}
        >
          {/* Imagem de Referência (Fundo) */}
          {bgImage && <Image source={{ uri: bgImage }} style={StyleSheet.absoluteFill} opacity={0.3} />}
          
          {/* Grid de Pixels */}
          {pixels.map((color, index) => (
            <Pixel key={index} color={color} size={PIXEL_SIZE} />
          ))}
        </View>
      </View>

      {/* Paleta */}
      <View style={styles.paletteArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {PALETTE.map(c => (
            <TouchableOpacity 
              key={c} 
              style={[styles.colorChip, { backgroundColor: c === 'transparent' ? '#333' : c }, selectedColor === c && styles.selectedColor]}
              onPress={() => setSelectedColor(c)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, backgroundColor: '#1e1e1e' },
  title: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#00ff00', padding: 5, borderRadius: 5 },
  toolbar: { flexDirection: 'row', justifyContent: 'center', padding: 10, gap: 15, backgroundColor: '#181818' },
  toolBtn: { padding: 8, borderRadius: 5, backgroundColor: '#333' },
  activeTool: { backgroundColor: '#6200ee', borderWidth: 1, borderColor: '#fff' },
  canvasArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  gridContainer: { width: SCREEN_W - 20, height: SCREEN_W - 20, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#333', backgroundColor: 'transparent' },
  paletteArea: { height: 70, padding: 10, backgroundColor: '#1e1e1e' },
  colorChip: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#444' },
  selectedColor: { borderColor: '#fff', borderWidth: 3 }
});
