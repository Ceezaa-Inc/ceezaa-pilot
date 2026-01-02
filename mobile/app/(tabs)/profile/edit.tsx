import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';

// Common emoji options for avatars
const AVATAR_EMOJIS = [
  '👤', '😊', '😎', '🤓', '🧑‍🍳', '👨‍🍳', '👩‍🍳',
  '🍕', '🍔', '🍜', '🍣', '🥗', '🍰', '☕',
  '🌮', '🥘', '🍝', '🍲', '🥐', '🍩', '🧁',
];

export default function EditProfileScreen() {
  const { user } = useAuthStore();
  const { profile, isUpdating, updateProfile } = useProfileStore();

  // Local state for form
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('👤');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [avatarType, setAvatarType] = useState<'emoji' | 'photo'>('emoji');

  // Determine auth provider
  const authProvider = user?.app_metadata?.provider || 'phone';
  const isPhoneAuth = authProvider === 'phone';

  // Initialize form from profile
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setAvatarEmoji(profile.avatarEmoji || '👤');
      setAvatarUrl(profile.avatarUrl || null);
      setPhone(profile.phone || '');
      // Determine avatar type based on what's set
      if (profile.avatarUrl) {
        setAvatarType('photo');
      } else {
        setAvatarType('emoji');
      }
    }
  }, [profile]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
      setAvatarType('photo');
      setShowEmojiPicker(false);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setAvatarEmoji(emoji);
    setAvatarType('emoji');
    setAvatarUrl(null);
    setShowEmojiPicker(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    const updates: {
      displayName?: string;
      avatarEmoji?: string;
      avatarUrl?: string;
      phone?: string;
    } = {};

    // Only include changed values
    if (displayName !== (profile?.displayName || '')) {
      updates.displayName = displayName;
    }

    if (avatarType === 'emoji' && avatarEmoji !== profile?.avatarEmoji) {
      updates.avatarEmoji = avatarEmoji;
      updates.avatarUrl = ''; // Clear photo when using emoji
    } else if (avatarType === 'photo' && avatarUrl !== profile?.avatarUrl) {
      updates.avatarUrl = avatarUrl || '';
    }

    if (isPhoneAuth && phone !== (profile?.phone || '')) {
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0) {
      router.back();
      return;
    }

    const success = await updateProfile(user.id, updates);

    if (success) {
      router.back();
    } else {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const currentAvatar = avatarType === 'photo' && avatarUrl ? avatarUrl : avatarEmoji;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Typography variant="body" color="primary">
                ← Cancel
              </Typography>
            </TouchableOpacity>
            <Typography variant="h2" color="primary">
              Edit Profile
            </Typography>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarPreview}>
              {avatarType === 'photo' && avatarUrl ? (
                <View style={styles.photoPlaceholder}>
                  <Typography variant="caption" color="muted">Photo</Typography>
                </View>
              ) : (
                <Typography variant="h1">{avatarEmoji}</Typography>
              )}
            </View>

            <View style={styles.avatarButtons}>
              <TouchableOpacity
                style={[
                  styles.avatarOption,
                  avatarType === 'emoji' && styles.avatarOptionActive,
                ]}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Typography variant="body" color={avatarType === 'emoji' ? 'gold' : 'secondary'}>
                  Choose Emoji
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.avatarOption,
                  avatarType === 'photo' && styles.avatarOptionActive,
                ]}
                onPress={handlePickImage}
              >
                <Typography variant="body" color={avatarType === 'photo' ? 'gold' : 'secondary'}>
                  Upload Photo
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Card variant="default" padding="md" style={styles.emojiPicker}>
                <View style={styles.emojiGrid}>
                  {AVATAR_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiItem,
                        avatarEmoji === emoji && styles.emojiItemActive,
                      ]}
                      onPress={() => handleSelectEmoji(emoji)}
                    >
                      <Typography variant="h3">{emoji}</Typography>
                    </TouchableOpacity>
                  ))}
                </View>
              </Card>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Display Name */}
            <View style={styles.field}>
              <Typography variant="label" color="muted" style={styles.fieldLabel}>
                Display Name
              </Typography>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={colors.text.muted}
                maxLength={50}
              />
            </View>

            {/* Phone Number */}
            <View style={styles.field}>
              <Typography variant="label" color="muted" style={styles.fieldLabel}>
                Phone Number
              </Typography>
              {isPhoneAuth ? (
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                />
              ) : (
                <View style={styles.disabledInput}>
                  <Typography variant="body" color="muted">
                    {phone || 'Not available'}
                  </Typography>
                  <Typography variant="caption" color="muted" style={styles.authNote}>
                    Phone cannot be changed for {authProvider === 'google' ? 'Google' : 'Apple'} accounts
                  </Typography>
                </View>
              )}
            </View>

            {/* Auth Provider Info */}
            <View style={styles.authInfo}>
              <Typography variant="caption" color="muted">
                Signed in with {authProvider === 'google' ? 'Google' : authProvider === 'apple' ? 'Apple' : 'Phone'}
              </Typography>
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : (
              <Button label="Save Changes" variant="primary" fullWidth onPress={handleSave} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    gap: layoutSpacing.sm,
  },
  backButton: {
    marginBottom: layoutSpacing.xs,
  },
  avatarSection: {
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  avatarPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.primary.DEFAULT,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  avatarOption: {
    paddingVertical: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: borderRadius.md,
  },
  avatarOptionActive: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.dark.surfaceAlt,
  },
  emojiPicker: {
    width: '100%',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: layoutSpacing.xs,
  },
  emojiItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  emojiItemActive: {
    backgroundColor: colors.dark.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  form: {
    gap: layoutSpacing.md,
  },
  field: {
    gap: layoutSpacing.xs,
  },
  fieldLabel: {
    marginLeft: layoutSpacing.xs,
  },
  input: {
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: borderRadius.md,
    paddingVertical: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.md,
    color: colors.text.primary,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: colors.dark.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.dark.border,
    borderRadius: borderRadius.md,
    paddingVertical: layoutSpacing.md,
    paddingHorizontal: layoutSpacing.md,
  },
  authNote: {
    marginTop: layoutSpacing.xs,
  },
  authInfo: {
    alignItems: 'center',
    paddingTop: layoutSpacing.sm,
  },
  saveSection: {
    paddingTop: layoutSpacing.md,
  },
});
