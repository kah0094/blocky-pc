import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from './src/services/supabase';

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
import DebugFab from './src/components/DebugFab'; // <--- NOVO

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const Empty = () => <View style={{flex:1, backgroundColor:'#000'}} />;

const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity style={{ top: -20, justifyContent: 'center', alignItems: 'center' }} onPress={onPress}>
    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#6200ee', alignItems: 'center', justifyContent: 'center', borderWidth:4, borderColor:'#000' }}>{children}</View>
  </TouchableOpacity>
);

function Tabs() {
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
      <Tab.Screen name="Criar" component={Empty} options={{ tabBarIcon: () => <Ionicons name="add" size={30} color="#fff" />, tabBarButton: (props) => <CustomTabBarButton {...props} /> }} listeners={({ navigation }) => ({ tabPress: (e) => { e.preventDefault(); navigation.navigate('CreateSelection'); }, })} />
      <Tab.Screen name="Busca" component={SearchScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="search" size={24} color={color} /> }} />
      <Tab.Screen name="MeuPerfil" component={ProfileScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="person" size={24} color={color} />, tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    supabase.auth.onAuthStateChange((_event, session) => setSession(session));
  }, []);

  if (loading) return <View style={{flex:1, backgroundColor:'#000', justifyContent:'center'}}><ActivityIndicator size="large" color="#00ff9d"/></View>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <>
              <Stack.Screen name="Main" component={Tabs} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="PostDetail" component={PostDetailScreen} />
              <Stack.Screen name="CreateSelection" component={CreateSelectionScreen} options={{ presentation: 'modal' }} />
              <Stack.Screen name="CreatePost" component={CreatePostScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Notifications" component={NotificationsScreen} />
              <Stack.Screen name="ChatList" component={ChatListScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />
            </>
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
        
        {/* DEBUG FAB (Só aparece se for admin, lógica interna) */}
        {session && <DebugFab />}
        
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
