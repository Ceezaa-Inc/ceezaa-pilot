import { Redirect } from 'expo-router';

export default function Index() {
  // For now, always redirect to welcome
  // Later, check auth state and redirect accordingly
  return <Redirect href="/(auth)/welcome" />;
}
