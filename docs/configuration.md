# Client configuration

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
A fuller example showing common options is here:
[config.example.js](../public/config/config.example.js). Any setting it omits
uses the built-in default.

For browser integrations, see the [browser automation reference](browser-automation.md).

### Configuration properties

The client merges your `window.config` with built-in defaults (see `src/utils/types.tsx`).
Most top-level values are shallow-merged. `theme` and `clientMonitor` also merge
their immediate fields, but maps such as `audioPresets` and `notificationSounds`
replace the built-in map. Include every preset or sound you want to keep when
overriding either map.

#### Top-level settings

| Name | Description | Format | Default value |
| :--- | :---------- | :----- | :------------ |
| loginEnabled | If login is enabled. | `boolean` | `false` |
| managementUrl | URL to management service (optional). | `string` | *(unset)* |
| loginImageURL | Image shown on the login button; blank uses the default icon. | `string` | `''` |
| developmentPort | Development room-server websocket port. | `number` | `8443` |
| productionPort | Production room-server websocket port. | `number` | `443` |
| serverHostname | Room-server hostname if different from client host (optional). | `string` | *(unset)* |
| p2penabled | Allow peer-to-peer mode when the deployment supports it. | `boolean` | `false` |
| askForMediaOnJoin | Start with microphone and camera on; `false` starts muted. | `boolean` | `true` |
| largeRoomThreshold | A participant who joins a room that already has at least this many participants (bots not counted) starts with microphone and camera off and is told why, even if both were on in the join screen. Every microphone or camera that is on, muted ones included, costs the server one stream per participant. A participant back after a disconnect keeps the media they had. `-1` means no limit. | `number` | `50` |
| resolution | Default webcam capture resolution. | `low \| medium \| high \| veryhigh \| ultra` | `medium` |
| frameRate | Default webcam capture framerate (fps). | `number` | `30` |
| screenSharingResolution | Default screen sharing resolution. | `low \| medium \| high \| veryhigh \| ultra` | `veryhigh` |
| screenSharingFrameRate | Default screen sharing framerate (fps). | `number` | `5` |
| aspectRatio | Default video aspect ratio used for layout and capture constraints. | `number` | `1.7778` |
| simulcast | Enable simulcast for webcam video. | `boolean` | `true` |
| simulcastSharing | Enable simulcast for screen sharing video. | `boolean` | `false` |
| autoGainControl | Audio auto gain control. | `boolean` | `true` |
| echoCancellation | Audio echo cancellation. | `boolean` | `true` |
| noiseSuppression | Audio noise suppression. | `boolean` | `true` |
| noiseThreshold | Microphone voice/noise threshold in dB. | `number` | `-60` |
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
| notificationSounds | Map notification names to audio paths and optional debounce times; omit it to use built-in sounds. | `object` | built-in sounds |
| buttonControlBar | Show media control buttons in separate control bar. | `boolean` | `true` |
| title | Application title. | `string` | `edumeet` |
| showRoomNameInTitle | Add the current room name to the browser tab title. | `boolean` | `true` |
| qrCodeEnabled | Show the room QR-code option. | `boolean` | `false` |
| myRoomsTabEnabled | Show the My rooms tab when the user is logged in and has rooms. | `boolean` | `true` |
| myMeetingsTabEnabled | Allow the My meetings tab when calendar invites are available. | `boolean` | `true` |
| countdownTimerEnabled | Show the countdown timer controls. | `boolean` | `false` |
| infoTooltipEnabled | Show the configured information link and text in dialogs. | `boolean` | `false` |
| infoTooltipText | Text or link label for the information tooltip. | `string` | `''` |
| infoTooltipDesc | Description shown with the information tooltip. | `string` | `''` |
| infoTooltipLink | Optional URL for the information tooltip. | `string` | `''` |
| randomizeOnBlank | Randomize room name when blank. | `boolean` | `true` |
| keepRoomNameOnLeave | (4.2+) Keep the room name in the URL when leaving the room. | `boolean` | `true` |
| transcriptionEnabled | Enable browser speech recognition where `webkitSpeechRecognition` is supported. The browser or operating system may process audio through an external recognition service; the provider and data location depend on the platform. End-to-end encryption does not protect audio sent to recognition, though transcript text sent to other participants is encrypted. Off by default; enable it only if the privacy notice covers this processing. Transcripts are not currently displayed in the room. | `boolean` | `false` |
| reactionsSoundEnabled | Play sounds for reactions. | `boolean` | `false` |
| reactionsTimeout | How long a reaction stays visible, in milliseconds. | `number` | `10000` |
| imprintUrl | Show an imprint link (blank to hide). | `string` | `''` |
| privacyUrl | Show a privacy notice link (blank to hide). | `string` | `''` |
| obfuscateDisplayName | Mask display names in the client monitoring samples sent to the media node (`Jane Doe` becomes `J••• D••`). The UI is unaffected. | `boolean` | `false` |
| reduxLoggingEnabled | Log Redux actions for debugging. | `boolean` | `false` |
| connectivityCheckEnabled | Show the connectivity indicator and connection-check dialog; requires `clientMonitor`. | `boolean` | `true` |
| clientMonitor | Configure local WebRTC statistics and optional sample sending; see below. | `object \| undefined` | see below |
| browserWarnings | Browser-specific warning messages shown after joining. | `array` | `[]` |
| knownRegions | Region codes offered in the management UI's tenant editor for the per-tenant "limit media nodes to specific regions" picker. Values must match region labels in the room-server's `countryToRegion` config. Leave empty to hide the limit toggle. | `string[]` | `[]` |
| groupAudioOnly | Initial value of the "Group participants without video" switch (see below). Replaces `showAudioOnly`, which had the opposite meaning. | `boolean` | `true` |
| hideNonVideo | Initial value of the "Hide participants with no video" switch (see below). | `boolean` | `false` |
| hideSelfView | Initial value of the "Hide self view" switch (see below). | `boolean` | `false` |

### Client monitoring

The built-in `clientMonitor` collects WebRTC statistics every 5 seconds for the
quality window and badges. Its default `samplingPeriodInMs` is `0`, so it sends
no samples to the media node. Set it to a positive multiple of
`collectingPeriodInMs` to send samples; the media node must also be configured
to store them. Set `clientMonitor: undefined` to disable monitoring entirely.

`browserWarnings` is a list of `{ browser, message, variant? }` objects. A
matching browser sees the message after joining; `variant` defaults to
`warning`.

#### Video tiles and the participants without video

The room shows at most as many tiles as the "Number of visible videos" slider allows (the value the room-server sends is the initial one). Your own tile is one of them. Screen shares, extra videos and the drawing board are shown in their own area and do not count.

The candidates for the remaining tiles are ordered: participants sharing a screen or an extra video first, then participants you pinned in the participant list, then everyone else with the most recent speaker first. A participant who starts speaking while already on screen leaves the layout as it is; only a speaker from outside the visible set takes a tile, from the participant who spoke least recently.

Three appearance switches decide what happens to participants who have no video on screen (camera off, camera not received, or camera left out by the slider):

| Switch | Config key | Behaviour |
| :--- | :--- | :--- |
| Group participants without video (default on) | `groupAudioOnly: true` | Cameras are shown first. One tile is reserved for a box that lists everyone without video and lights up when one of them speaks. |
| Group participants without video off | `groupAudioOnly: false` | Everyone without video gets a tile of their own, counted against the slider like a camera. In a room with more participants than tiles this shows the most recent speakers, whether they have a camera or not; a silent camera can be off screen while a recent speaker without one is on. Turning a camera on or off never moves a tile, it only changes what the tile shows. |
| Hide participants with no video | `hideNonVideo: true` | Nobody without video is shown, not even the speaker, and the group switch is disabled. Your own tile stays. |
| Hide self view | `hideSelfView: true` | Your own tile is removed and its slot goes to another participant. Your own screen share is hidden as well. |

#### Status attributes on the document

Every client writes three attributes on the `<html>` element for debugging and for recorders. They only ever hold codes from the lists below, never names, ids or tokens.

| Attribute | Values |
| :--- | :--- |
| `data-edumeet-state` | `new`, `lobby`, `joined`, `left`, `mgmt-admin` |
| `data-edumeet-connection` | `new`, `connecting`, `connected`, `reconnecting`, `disconnected` |
| `data-edumeet-reason` | Absent until a reason is recorded, then holds the first reason: `meetingTokenRequired`, `meetingTokenInvalid`, `e2eeUnsupported`, `e2eeFailed`, `kicked`, `meetingEnded`, `connectionClosed`, `joinErrorPending` (a headless page did not auto-join because an earlier join error is still stored), `roomNotOpen` (a bot arrived before any participant), `botsNotAllowed` (the tenant admits no bots, or none without a token), `botTokenRejected` (the token, its state or the bot's address did not pass; the room-server log has the detail), `sessionNotOpen` (a bot named a breakout session that does not exist), `sessionClosed` (the breakout session a bot was recording was closed), `jobNotActive` (a bot that runs jobs has none left, or its `botId` is already live in another browser), `left` (the user left) |

The upcoming release also uses `meetingTokenEarly` and `meetingTokenOver` for
headless pages refused because a valid meeting token is outside its meeting window.

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
| theme.backgroundImage | Optional background image URL. | `string` | *(unset)* |
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
used when the preset is selected via `audioPreset`. The values below are from the example
`conference` preset; other presets can differ.

| Name | Description | Format | Example `conference` value |
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
