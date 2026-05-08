# @poc/mock-feature

A self-contained React Native feature package that demonstrates the **host-bridge pattern** — the host app injects theme, config, and navigation through a context, and the remote package renders its own screens without any direct coupling to the host's router or design system.

## Install

```sh
# from GitHub
npm install github:phoorichet-bbik/mock-feature-rn

# or from a local path (monorepo)
# "dependencies": { "@poc/mock-feature": "file:./packages/mock-feature" }

# peer dependencies (must be installed in the host app)
npx expo install expo-file-system expo-media-library
```

> **Note (local `file:` install):** bun copies rather than symlinks `file:` packages. After adding new screen files to the package, run `bun install` in the host app once to sync them into `node_modules`.

## Host Bridge

The package exposes a `HostBridge` interface that the host fills in once, at the entry point of the feature:

```tsx
import { HostBridgeProvider, type HostBridge } from '@poc/mock-feature';

const bridge: HostBridge = {
  theme: {
    primaryColor: '#6366f1',
    backgroundColor: '#fff',
    surfaceColor: '#f5f5f5',
    textColor: '#1e1e1e',
    textSecondaryColor: '#6b7280',
    isDark: false,
  },
  config: {
    appName: 'My App',
    apiBaseUrl: 'https://api.example.com',
    userDisplayName: 'Jane',
    userEmail: 'jane@example.com',
  },
  navigation: {
    push: (slug, params) => { /* route to slug with optional params */ },
    goBack: () => { /* pop one screen */ },
    backToMainApp: () => { /* exit the feature entirely */ },
  },
};

export default function FeatureEntry() {
  return (
    <HostBridgeProvider bridge={bridge}>
      <FeatureHomeScreen />
    </HostBridgeProvider>
  );
}
```

## Navigation — slug-based

The package uses a single `push(slug, params?)` method. Screens within the feature call it using a slug name; the host resolves the slug to an actual route.

```tsx
// inside any screen in the package
const { navigation } = useHostBridge();

navigation.push('detail', { itemId: '42', itemTitle: 'Hello' });
navigation.push('save-media');
navigation.goBack();
navigation.backToMainApp();
```

### Adding a new screen (no host changes needed)

1. Create the screen component in `src/screens/`.
2. Register it in `src/registry.ts`:

```ts
import MyNewScreen from './screens/MyNewScreen';

export const SCREEN_REGISTRY: Record<string, ScreenEntry> = {
  detail: { component: FeatureDetailScreen, title: 'Feature Detail' },
  'save-media': { component: SaveMediaScreen, title: 'Save Image / Video' },
  'my-new-screen': { component: MyNewScreen, title: 'My New Screen' }, // ← add here
};
```

3. Call it from any screen: `navigation.push('my-new-screen')`.

The host uses a single dynamic route (`[slug].tsx`) that reads `SCREEN_REGISTRY` at runtime — no route files, no Stack.Screen entries, and no layout changes required in the host app.

### How the host wires it up (Expo Router example)

```tsx
// _layout.tsx — host fills in push once; never needs to change for new screens
navigation: {
  push: (slug, params) => {
    router.push({
      pathname: '/(app)/(mock-feature)/[slug]' as any,
      params: { slug, ...params },
    });
  },
  goBack: () => router.back(),
  backToMainApp: () => { /* pop all */ },
},
```

```tsx
// [slug].tsx — renders any screen from the registry
import { SCREEN_REGISTRY } from '@poc/mock-feature';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function FeatureSlugRoute() {
  const { slug, ...params } = useLocalSearchParams<{ slug: string } & Record<string, string>>();
  const entry = SCREEN_REGISTRY[slug];
  if (!entry) return null;
  const { component: Screen, title } = entry;
  return (
    <>
      <Stack.Screen options={{ title }} />
      <Screen {...params} />
    </>
  );
}
```

## Screens

| Slug | Export | Description |
|------|--------|-------------|
| `detail` | `FeatureDetailScreen` | Detail screen — expects route params `itemId` and `itemTitle` |
| `save-media` | `SaveMediaScreen` | Downloads and saves an image/video to the device media library |

`FeatureHomeScreen` is the entry screen — rendered directly, not via slug.

## API Reference

### `HostBridgeProvider`

Wraps the feature tree and makes the bridge available to all child screens.

```tsx
<HostBridgeProvider bridge={bridge}>
  {children}
</HostBridgeProvider>
```

### `useHostBridge`

Hook for reading the bridge inside any screen. Throws if called outside `HostBridgeProvider`.

```tsx
const { theme, config, navigation } = useHostBridge();
```

### `SCREEN_REGISTRY`

Map of slug → `{ component, title }`. Import it in the host to power the dynamic route.

```ts
import { SCREEN_REGISTRY } from '@poc/mock-feature';
// { detail: { component, title }, 'save-media': { component, title }, ... }
```

## Run the Example

A minimal Expo host app lives in [`example/`](./example).

```sh
cd example
npm install
npx expo run:ios
npx expo run:android
```

The example wires up React Navigation as the host navigator and provides a static bridge so you can develop screens in isolation without touching the main app.

## Peer Dependencies

The package uses native modules that must be compiled into the host app's binary:

- `expo-file-system` — file download and deletion
- `expo-media-library` — saving media to the device gallery
- `react` / `react-native` — provided by the host

## How It Works

```
Host App
 └── HostBridgeProvider        ← fills in theme, config, navigation.push(slug)
      └── FeatureHomeScreen
           └── useHostBridge() ← screens call navigation.push('detail', params)
                                  host resolves slug → route via SCREEN_REGISTRY
```

The feature package never imports from the host app. All runtime coupling goes through the `HostBridge` interface, which makes the package independently testable and portable across different host apps.
