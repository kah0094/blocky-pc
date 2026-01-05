import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';

// --- TELAS ---
import HomeScreen from './src/screens/HomeScreen';
import PostsScreen from './src/screens/PostsScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import CreateSelectionScreen from './src/screens/CreateSelectionScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import AuthScreen from './src/screens/AuthScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- LAYOUT DE PC (SIDEBAR) ---
const SidebarLayout = ({ navigation, children }) => {
  const navigate = (route) => navigation.navigate(route);
  // Função auxiliar para identificar rota ativa (simplificada)
  const activeRoute = children.props.state?.routes[children.props.state.index]?.name || 'Home';

  const MenuBtn = ({ icon, label, route }) => {
    const isActive = activeRoute === route;
    return (
      <TouchableOpacity 
        style={[styles.sideBtn, isActive && styles.sideBtnActive]}
        onPress={() => navigate(route)}
        // Hack para cursor de mão na web
        {...Platform.select({ web: { style: { cursor: 'pointer', ...styles.sideBtn, ...(isActive ? styles.sideBtnActive : {}) } } })}
      >
        <Ionicons name={icon} size={22} color={isActive ? '#00ff9d' : '#888'} />
        <Text style={[styles.sideTxt, isActive && {color:'#00ff9d', fontWeight:'bold'}]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.pcContainer}>
      {/* Sidebar Esquerda */}
      <View style={styles.sidebar}>
        <View style={styles.logoArea}>
           <Ionicons name="cube" size={28} color="#00ff9d" />
           <Text style={styles.logoText}>Blocky</Text>
        </View>

        <View style={{ gap: 5 }}>
            <MenuBtn icon="game-controller" label="Jogos" route="Início" />
            <MenuBtn icon="images" label="Feed" route="Posts" />
            <MenuBtn icon="search" label="Busca" route="Busca" />
            <MenuBtn icon="person" label="Perfil" route="MeuPerfil" />
        </View>
        
        <View style={{marginTop: 20}}>
            <TouchableOpacity 
                style={styles.createBtn} 
                onPress={()=>navigate('CreatePost')}
                {...Platform.select({ web: { style: { cursor: 'pointer', ...styles.createBtn } } })}
            >
                <Ionicons name="add-circle" size={24} color="#000"/>
                <Text style={{fontWeight:'bold', color:'#000'}}>Criar Post</Text>
            </TouchableOpacity>
        </View>

        <View style={{marginTop: 'auto', gap: 10}}>
            <MenuBtn icon="chatbubbles" label="Mensagens" route="ChatList" />
            <MenuBtn icon="notifications" label="Notificações" route="Notifications" />
            <MenuBtn icon="settings" label="Config" route="Settings" />
        </View>
      </View>

      {/* Conteúdo Direita */}
      <View style={styles.contentArea}>
        <View style={styles.topbar}>
            <Text style={{color:'#666', fontWeight:'bold', fontSize:12}}>PC VERSION</Text>
            <View style={{flexDirection:'row', gap: 15}}>
                <TouchableOpacity onPress={()=>navigate('MeuPerfil')}><View style={styles.miniAvatar}/></TouchableOpacity>
            </View>
        </View>
        
        <View style={{flex:1, overflow:'hidden'}}>
            {children}
        </View>
      </View>
    </View>
  );
};

// --- LAYOUT MOBILE (TABS) ---
const Empty = () => <View style={{flex:1, backgroundColor:'#000'}} />;
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity style={{ top: -20, justifyContent: 'center', alignItems: 'center' }} onPress={onPress}>
    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#00ff9d', alignItems: 'center', justifyContent: 'center', borderWidth:4, borderColor:'#000' }}>{children}</View>
  </TouchableOpacity>
);

function MobileTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111', borderTopWidth: 0, height: 60, paddingBottom: 10 },
        tabBarActiveTintColor: '#00ff9d',
      }}
    >
      <Tab.Screen name="Início" component={HomeScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="game-controller" size={24} color={color} /> }} />
      <Tab.Screen name="Posts" component={PostsScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="images" size={24} color={color} /> }} />
      <Tab.Screen name="Criar" component={Empty} 
        options={{
          tabBarIcon: () => <Ionicons name="add" size={30} color="#fff" />,
          tabBarButton: (props) => <CustomTabBarButton {...props} />
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('CreateSelection'); },
        })}
      />
      <Tab.Screen name="Busca" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="search" size={24} color={color} /> }} />
      <Tab.Screen name="MeuPerfil" component={ProfileScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} />, tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const isPC = width > 768; 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
    });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (loading) return (
    <View style={{flex:1, backgroundColor:'#000', justifyContent:'center', alignItems:'center'}}>
        <ActivityIndicator size="large" color="#00ff9d"/>
    </View>
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!session ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : (
            <Stack.Screen name="Root">
              {({ navigation }) => {
                  if (isPC) {
                      return (
                          <SidebarLayout navigation={navigation}>
                              <Stack.Navigator screenOptions={{ headerShown: false, animationEnabled: false }}>
                                  <Stack.Screen name="Início" component={HomeScreen} />
                                  <Stack.Screen name="Posts" component={PostsScreen} />
                                  <Stack.Screen name="Busca" component={SearchScreen} />
                                  <Stack.Screen name="MeuPerfil" component={ProfileScreen} />
                                  {/* Rotas extras acessíveis via Sidebar */}
                                  <Stack.Screen name="ChatList" component={ChatListScreen} />
                                  <Stack.Screen name="Notifications" component={NotificationsScreen} />
                                  <Stack.Screen name="Settings" component={SettingsScreen} />
                                  <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                                  {/* Rotas de Detalhes */}
                                  <Stack.Screen name="Profile" component={ProfileScreen} />
                                  <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                                  <Stack.Screen name="Chat" component={ChatScreen} />
                                  <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                              </Stack.Navigator>
                          </SidebarLayout>
                      );
                  } else {
                      return (
                          <Stack.Navigator screenOptions={{ headerShown: false }}>
                              <Stack.Screen name="MobileTabs" component={MobileTabs} />
                              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                              <Stack.Screen name="CreateSelection" component={CreateSelectionScreen} options={{ presentation: 'modal' }} />
                              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
                              <Stack.Screen name="Settings" component={SettingsScreen} />
                              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                              <Stack.Screen name="Notifications" component={NotificationsScreen} />
                              <Stack.Screen name="ChatList" component={ChatListScreen} />
                              <Stack.Screen name="Chat" component={ChatScreen} />
                              <Stack.Screen name="Profile" component={ProfileScreen} />
                          </Stack.Navigator>
                      );
                  }
              }}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  pcContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#000' },
  sidebar: { 
    width: 250, backgroundColor: '#111', borderRightWidth: 1, borderColor: '#222', 
    padding: 20, display: 'flex', flexDirection: 'column'
  },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40, paddingLeft: 5 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  
  sideBtn: { 
    flexDirection: 'row', alignItems: 'center', gap: 12, 
    padding: 12, borderRadius: 10, marginBottom: 5
  },
  sideBtnActive: { backgroundColor: 'rgba(0, 255, 157, 0.1)' },
  sideTxt: { color: '#ccc', fontSize: 15, fontWeight: '500' },
  
  createBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent:'center', gap: 10, 
    backgroundColor: '#00ff9d', padding: 12, borderRadius: 10
  },
  
  contentArea: { flex: 1, backgroundColor: '#000' },
  topbar: { 
    height: 50, borderBottomWidth: 1, borderColor: '#222', 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 20, backgroundColor: '#111' 
  },
  miniAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#333', borderWidth:1, borderColor:'#555' }
});
