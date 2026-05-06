# @poc/mock-feature

A self-contained React Native feature package that demonstrates the **host-bridge pattern** — the host app injects theme, config, and navigation through a context, and the remote package renders its own screens without any direct coupling to the host's router or design system.

## Install

```sh
# from GitHub
npm install github:phoorichet-bbik/mock-feature-rn

# peer dependencies (must be installed in the host app)
npx expo install expo-file-system expo-media-library
```

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
    pushToDetail: (itemId, itemTitle) => { /* navigate to detail screen */ },
    pushToSaveMedia: () => { /* navigate to save-media screen */ },
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

## Screens

| Export | Description |
|--------|-------------|
| `FeatureHomeScreen` | Home screen — fetches posts from an API and renders them using host theme |
| `FeatureDetailScreen` | Detail screen — props: `{ itemId: string, itemTitle: string }` |
| `SaveMediaScreen` | Downloads and saves an image/video to the device media library |

## API

### `HostBridgeProvider`

Wraps the feature tree and provides the bridge to all child screens via context.

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

## Run the Example

A minimal Expo host app lives in [`example/`](./example).

```sh
cd example
npm install
npx expo run:ios    # iOS simulator
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
 └── HostBridgeProvider  ← fills in theme, config, navigation
      └── FeatureHomeScreen
           └── useHostBridge()  ← reads the bridge, no direct imports from host
```

The feature package never imports from the host app. All runtime coupling goes through the `HostBridge` interface, which makes the package independently testable and portable across different host apps.
