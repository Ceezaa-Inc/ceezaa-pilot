import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from '@/design/tokens/colors';
import { layoutSpacing } from '@/design/tokens/spacing';
import { borderRadius } from '@/design/tokens/borderRadius';
import { Typography, Card, Button } from '@/components/ui';
import { useAuthStore } from '@/stores/useAuthStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useTasteStore } from '@/stores/useTasteStore';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { profile, isLoading: isLoadingProfile, fetchProfile, hasFetchedProfile } = useProfileStore();
  const { traits, fetchDNA, hasFetchedDNA } = useTasteStore();

  // Fetch profile data on mount
  useEffect(() => {
    if (user?.id && !hasFetchedProfile) {
      fetchProfile(user.id);
    }
  }, [user?.id, hasFetchedProfile, fetchProfile]);

  // Fetch DNA traits on mount
  useEffect(() => {
    if (user?.id && !hasFetchedDNA) {
      fetchDNA(user.id);
    }
  }, [user?.id, hasFetchedDNA, fetchDNA]);

  // Build menu items dynamically
  const linkedCardsCount = profile?.linkedAccountsCount || 0;
  const linkedCardsText = linkedCardsCount === 1
    ? '1 card connected'
    : linkedCardsCount > 1
      ? `${linkedCardsCount} cards connected`
      : 'No cards linked';

  const menuItems = [
    { icon: '💳', label: 'Linked Cards', subtitle: linkedCardsText, route: '/(tabs)/profile/cards' },
    { icon: '🔔', label: 'Notifications', subtitle: 'Manage alerts', route: '/(tabs)/profile/notifications' },
    { icon: '🔒', label: 'Privacy', subtitle: 'Control your data', route: '/(tabs)/profile/privacy' },
    { icon: '❓', label: 'Help & Support', subtitle: 'Get assistance', route: null, action: 'help' },
  ];

  const handleMenuPress = (route: string | null, action?: string) => {
    if (action === 'help') {
      Linking.openURL('mailto:help@ceezaa.com');
      return;
    }
    if (route) {
      router.push(route as any);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  // Format member since date
  const formatMemberSince = (dateString: string | undefined) => {
    if (!dateString) return 'Member';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `Member since ${month} ${year}`;
  };

  // Get display name
  const displayName = profile?.displayName || 'User';

  // Get first 3 DNA traits for display
  const displayTraits = traits.slice(0, 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Typography variant="h1">
                {profile?.avatarEmoji || '👤'}
              </Typography>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => router.push('/(tabs)/profile/edit')}
            >
              <Typography variant="caption" color="gold">
                Edit
              </Typography>
            </TouchableOpacity>
          </View>
          {isLoadingProfile ? (
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
          ) : (
            <>
              <Typography variant="h2" color="primary">
                {displayName}
              </Typography>
              <Typography variant="body" color="secondary">
                {formatMemberSince(profile?.createdAt)}
              </Typography>
              {/* Auth Provider Badge */}
              <View style={styles.authBadge}>
                <Typography variant="caption" color="muted">
                  {user?.app_metadata?.provider === 'google'
                    ? 'Signed in with Google'
                    : user?.app_metadata?.provider === 'apple'
                    ? 'Signed in with Apple'
                    : `Phone: ${profile?.phone || ''}`}
                </Typography>
              </View>
            </>
          )}
        </View>

        {/* Taste Summary */}
        <Card variant="elevated" padding="lg" style={styles.tasteCard}>
          <View style={styles.tasteHeader}>
            <Typography variant="h4" color="primary">
              Your Taste DNA
            </Typography>
            <TouchableOpacity onPress={() => router.push('/(tabs)/pulse/taste-detail')}>
              <Typography variant="bodySmall" color="gold">
                View full →
              </Typography>
            </TouchableOpacity>
          </View>
          <View style={styles.tasteTraits}>
            {displayTraits.length > 0 ? (
              displayTraits.map((trait, index) => (
                <TraitBadge
                  key={index}
                  label={trait.name}
                  emoji={trait.emoji}
                />
              ))
            ) : (
              <>
                <TraitBadge label="Discovering..." emoji="✨" />
                <TraitBadge label="Your taste" emoji="🍽️" />
                <TraitBadge label="Profile" emoji="📊" />
              </>
            )}
          </View>
        </Card>

        {/* Menu Items */}
        <View style={styles.menu}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleMenuPress(item.route, item.action)}
            >
              <Card variant="default" padding="md" style={styles.menuItem}>
                <View style={styles.menuRow}>
                  <View style={styles.menuIcon}>
                    <Typography variant="body">{item.icon}</Typography>
                  </View>
                  <View style={styles.menuText}>
                    <Typography variant="body" color="primary">
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {item.subtitle}
                    </Typography>
                  </View>
                  <Typography variant="body" color="muted">
                    →
                  </Typography>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <Button label="Sign Out" variant="ghost" fullWidth onPress={handleSignOut} />

        <Typography variant="caption" color="muted" align="center">
          Version 1.0.0
        </Typography>
      </ScrollView>
    </SafeAreaView>
  );
}

function TraitBadge({ label, emoji }: { label: string; emoji?: string }) {
  return (
    <View style={styles.traitBadge}>
      {emoji && (
        <Typography variant="body">{emoji}</Typography>
      )}
      <Typography variant="caption" color="secondary" numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    padding: layoutSpacing.lg,
    gap: layoutSpacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: -8,
    backgroundColor: colors.dark.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },
  authBadge: {
    backgroundColor: colors.dark.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
  },
  tasteCard: {
    gap: layoutSpacing.md,
  },
  tasteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasteTraits: {
    flexDirection: 'row',
    gap: layoutSpacing.sm,
  },
  traitBadge: {
    flex: 1,
    paddingVertical: layoutSpacing.sm,
    paddingHorizontal: layoutSpacing.xs,
    backgroundColor: colors.dark.surfaceAlt,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    gap: 4,
  },
  menu: {
    gap: layoutSpacing.sm,
  },
  menuItem: {},
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
});
