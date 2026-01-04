# ![eduMEET](/public/images/logo.edumeet.svg) Edumeet client

This is the client service for the Edumeet project.


![](img/edumeet-client.drawio.png)

## Usage
### Running the service in development

This will start the service using https with a self-signed certificate. It's exposed on port `4443`.
Https is needed for things such as `navigator.mediaService.getUserMedia()`. 

```bash
$ yarn install
$ yarn start
```

To run the service you need to have Node.js version 18 or higher installed.

### Running the service in production

Build the service:
```bash
$ yarn build
```
This will produce a `./build` directory, ready to be deployed. Https is needed for things such as `navigator.mediaService.getUserMedia()`. 

You would in most cases want to replace the `config/` and `images/` directories with your own content.

https://github.com/edumeet/edumeet-docker/tree/4.x has guidelines for running the next generation Edumeet as docker containers.

## Configuration
The app configuration file should be a valid javascript file defining a single
`config` object containing the properties that you need to modify. Below we have configured the ports of our room-server service in development and production. They are used when a participant tries to join a room and a websocket connection to the room-server service is established.

Example `public/config/config.js`:

```javascript
var config = {
  // Room-server websocket ports
  developmentPort: 8443,
  productionPort: 443,

  // Example: keep room id in URL after leaving (4.2+)
  keepRoomNameOnLeave: true,

  // Theme configuration (MUI ThemeOptions + edumeet custom keys)
  // You can override Material UI theme values, e.g. palette.primary.main:
  theme: {
    palette: {
      primary: {
        main: '#313131'
      }
    },

    // Background: either a CSS background value…
    background: 'linear-gradient(135deg, rgba(1,42,74,1) 0%, rgba(1,58,99,1) 50%, rgba(1,73,124,1) 100%)',

    // …or a background image URL (when used by your deployment / UI)
    backgroundImage: 'images/background.jpg',

    // App bar colors (4.2+ adds text/icon colors)
    appBarColor: 'rgba(0, 0, 0, 0.4)',
    appBarTextColor: 'rgba(255, 255, 255, 1.0)',
    appBarIconColor: 'rgba(255, 255, 255, 1.0)',
    appBarFloating: true,

    // Pre-call title colors (4.2+)
    precallTitleColor: 'rgba(255, 255, 255, 1.0)',
    precallTitleTextColor: 'rgba(0, 0, 0, 1.0)',
    precallTitleIconColor: 'rgba(0, 0, 0, 1.0)',

    logo: 'images/logo.edumeet.svg'
  }
};
```
An example configuration file with all properties set to default values
can be found here: [config.example.js](public/config/config.example.js).

### Configuration properties

The client merges your `window.config` with built-in defaults (see `src/utils/types.tsx`).

#### Top-level settings

| Name | Description | Format | Default value |
| :--- | :---------- | :----- | :------------ |
| loginEnabled | If login is enabled. | `boolean` | `false` |
| managementUrl | URL to management service (optional). | `string` | *(unset)* |
| developmentPort | Development room-server websocket port. | `number` | `8443` |
| productionPort | Production room-server websocket port. | `number` | `443` |
| serverHostname | Room-server hostname if different from client host (optional). | `string` | *(unset)* |
| resolution | Default webcam capture resolution. | `low \| medium \| high \| veryhigh \| ultra` | `medium` |
| frameRate | Default webcam capture framerate (fps). | `number` | `30` |
| screenSharingResolution | Default screen sharing resolution. | `low \| medium \| high \| veryhigh \| ultra` | `veryhigh` |
| screenSharingFrameRate | Default screen sharing framerate (fps). | `number` | `5` |
| simulcast | Enable simulcast for webcam video. | `boolean` | `true` |
| simulcastSharing | Enable simulcast for screen sharing video. | `boolean` | `false` |
| autoGainControl | Audio auto gain control. | `boolean` | `true` |
| echoCancellation | Audio echo cancellation. | `boolean` | `true` |
| noiseSuppression | Audio noise suppression. | `boolean` | `true` |
| sampleRate | Audio sample rate (Hz). | `number` | `48000` |
| channelCount | Audio channel count. | `1 \| 2` | `1` |
| sampleSize | Audio sample size (bits). | `8 \| 16 \| 24 \| 32` | `16` |
| opusStereo | Enable OPUS stereo. | `boolean` | `false` |
| opusDtx | Enable OPUS DTX. | `boolean` | `true` |
| opusFec | Enable OPUS FEC. | `boolean` | `true` |
| opusPtime | OPUS packet time (ms). | `number` | `20` |
| opusMaxPlaybackRate | OPUS max playback rate (Hz). | `number` | `48000` |
| audioPreset | Selected audio preset. | `string` | `conference` |
| audioPresets | Available audio presets. | `object` | `{ ... }` |
| buttonControlBar | Show media control buttons in separate control bar. | `boolean` | `true` |
| title | Application title. | `string` | `edumeet` |
| randomizeOnBlank | Randomize room name when blank. | `boolean` | `true` |
| keepRoomNameOnLeave | (4.2+) Keep the room name in the URL when leaving the room. | `boolean` | `true` |
| transcriptionEnabled | Enable transcription. | `boolean` | `true` |
| imprintUrl | Show an imprint link (blank to hide). | `string` | `''` |
| privacyUrl | Show a privacy notice link (blank to hide). | `string` | `''` |

#### Theme settings (`config.theme`) (4.2+)

Theme/UI parameters live under `config.theme` (they were previously shown mixed into the main table).

| Name | Description | Format | Default value |
| :--- | :---------- | :----- | :------------ |
| theme.background | Page background (CSS value). | `string` | `linear-gradient(...)` |
| theme.appBarColor | App bar background color. | `string` | `rgba(0, 0, 0, 0.4)` |
| theme.appBarTextColor | App bar text color. | `string` | `rgba(255, 255, 255, 1.0)` |
| theme.appBarIconColor | App bar icon color. | `string` | `rgba(255, 255, 255, 1.0)` |
| theme.appBarFloating | Float app bar over content. | `boolean` | `true` |
| theme.precallTitleColor | Pre-call title background color. | `string` | `rgba(255, 255, 255, 1.0)` |
| theme.precallTitleTextColor | Pre-call title text color. | `string` | `rgba(0, 0, 0, 1.0)` |
| theme.precallTitleIconColor | Pre-call title icon color. | `string` | `rgba(0, 0, 0, 1.0)` |
| theme.logo | Logo URL. | `string` | `images/logo.edumeet.svg` |
| theme.activeSpeakerBorder | Active speaker border CSS. | `string` | `1px solid rgba(255, 255, 255, 1.0)` |
| theme.videoBackroundColor | Video tile background color. | `string` | `rgba(49, 49, 49, 0.9)` |
| theme.videoAvatarImage | Fallback avatar image URL. | `string` | `images/buddy.svg` |
| theme.roundedness | UI border radius. | `number` | `10` |
| theme.sideContentItemColor | Side panel item color. | `string` | `rgba(255, 255, 255, 0.4)` |
| theme.sideContentItemDarkColor | Side panel item color (dark). | `string` | `rgba(150, 150, 150, 0.4)` |
| theme.sideContainerBackgroundColor | Side panel background color. | `string` | `rgba(255, 255, 255, 0.7)` |

---
#### Audio preset fields (`config.audioPresets.<preset>`)

Each entry inside `audioPresets` defines the WebRTC audio constraints and OPUS encoder settings
used when the preset is selected via `audioPreset`.

| Name | Description | Format | Default |
| :--- | :--- | :--- | :--- |
| autoGainControl | Enable audio auto gain control. | `boolean` | `true` |
| channelCount | Audio channel count. | `number` | `1` |
| echoCancellation | Enable echo cancellation. | `boolean` | `true` |
| noiseSuppression | Enable noise suppression. | `boolean` | `true` |
| sampleRate | Audio sample rate (Hz). | `number` | `48000` |
| sampleSize | Audio sample size (bits). | `number` | `16` |
| opusStereo | Enable OPUS stereo. | `boolean` | `false` |
| opusDtx | Enable OPUS DTX. | `boolean` | `false` |
| opusFec | Enable OPUS FEC. | `boolean` | `true` |
| opusPtime | OPUS packet time (ms). | `number` | `20` |
| opusMaxPlaybackRate | OPUS maximum playback rate (Hz). | `number` | `48000` |

Example:

```js
audioPresets: {
  conference: {
    autoGainControl: true,
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 48000,
    channelCount: 1,
    opusFec: true,
    opusDtx: false,
    opusStereo: false,
    opusPtime: 20
  }
}
```
