# Edumeet client

This is the client service for the Edumeet project.


![](img/edumeet-client.drawio.png)

## Usage
This service is the frontend of an edumeet installation and consist of static content. It's a React app but we do not use `yarn run serve` to deploy it. We are not doing SSL configuration here. In the Dockerfile we expose the service on port 80 using Nginx image. We expect a reverse proxy to sit in front and do SSL termination.

### Running the service in development

This will start the service using https with a self-signed certificate. It's exposed on port `443`.

```bash
$ yarn install
$ yarn start
```

To run the service you need to have Node.js version 18 or higher installed.

### Running the service in production

We run the service as a docker container. 
You would in most cases want to replace the `config/` and `images/` directories with your own content. See below for an example using docker as container runtime.

```bash
$ docker build . -t user/edumeet-client
$ docker run -v $(pwd)/config:/usr/share/nginx/html/config -v $(pwd)/images:/usr/share/nginx/html/images -p 80:80 -d user/edumeet-client
```




## Configuration
The app configuration file should be a valid javascript file defining a single
`config` object containing the properties that you need to modify. Below we have configured the ports of our room-server service in development and production. They are used when a participant tries to join a room and a websocket connection to the room-server service is established.

Example `public/config/config.js`:
```javascript
var config = {
	developmentPort: 8443,
	productionPort: 443
};
```
An example configuration file with all properties set to default values
can be found here: [config.example.js](public/config/config.example.js).

### Configuration properties

| Name | Description | Format | Default value |
| :--- | :---------- | :----- | :------------ |
| loginEnabled | If the login is enabled. | `"boolean"` | ``false`` |
| developmentPort | The development room server service listening port. | `"port"` | ``8443`` |
| productionPort | The production room server service listening port. | `"port"` | ``443`` |
| serverHostname | If the room server service runs on a different host than the client service you can specify the host name. | `"string"` | ``""`` |
| resolution | The default video camera capture resolution. | `[  "low",  "medium",  "high",  "veryhigh",  "ultra"]` | ``"medium"`` |
| frameRate | The default video camera capture framerate. | `"nat"` | ``15`` |
| screenResolution | The default screen sharing resolution. | `[  "low",  "medium",  "high",  "veryhigh",  "ultra"]` | ``"veryhigh"`` |
| screenSharingFrameRate | The default screen sharing framerate. | `"nat"` | ``5`` |
| simulcast | Enable or disable simulcast for webcam video. | `"boolean"` | ``true`` |
| simulcastSharing | Enable or disable simulcast for screen sharing video. | `"boolean"` | ``false`` |
| localRecordingEnabled | If set to true Local Recording feature will be enabled. | `"boolean"` | ``false`` |
| requestTimeout | The Socket.io request timeout. | `"nat"` | ``20000`` |
| requestRetries | The Socket.io request maximum retries. | `"nat"` | ``3`` |
| autoGainControl | Auto gain control enabled. | `"boolean"` | ``true`` |
| echoCancellation | Echo cancellation enabled. | `"boolean"` | ``true`` |
| noiseSuppression | Noise suppression enabled. | `"boolean"` | ``true`` |
| voiceActivatedUnmute | Automatically unmute speaking above noiseThreshold. | `"boolean"` | ``false`` |
| noiseThreshold | This is only for voiceActivatedUnmute and audio-indicator. | `"int"` | ``-60`` |
| sampleRate | The audio sample rate. | `[  8000,  16000,  24000,  44100,  48000]` | ``48000`` |
| channelCount | The audio channels count. | `[  1,  2]` | ``1`` |
| sampleSize | The audio sample size count. | `[  8,  16,  24,  32]` | ``16`` |
| opusStereo | If OPUS FEC stereo be enabled. | `"boolean"` | ``false`` |
| opusDtx | If OPUS DTX should be enabled. | `"boolean"` | ``true`` |
| opusFec | If OPUS FEC should be enabled. | `"boolean"` | ``true`` |
| opusPtime | The OPUS packet time. | `[  3,  5,  10,  20,  30,  40,  50,  60]` | ``20`` |
| opusMaxPlaybackRate | The OPUS playback rate. | `[  8000,  16000,  24000,  44100,  48000]` | ``48000`` |
| audioPreset | The audio preset | `"string"` | ``"conference"`` |
| audioPresets | The audio presets. | `"object"` | ``{  "conference": {    "name": "Conference audio",    "autoGainControl": true,    "echoCancellation": true,    "noiseSuppression": true,    "voiceActivatedUnmute": false,    "noiseThreshold": -60,    "sampleRate": 48000,    "channelCount": 1,    "sampleSize": 16,    "opusStereo": false,    "opusDtx": true,    "opusFec": true,    "opusPtime": 20,    "opusMaxPlaybackRate": 48000  },  "hifi": {    "name": "HiFi streaming",    "autoGainControl": false,    "echoCancellation": false,    "noiseSuppression": false,    "voiceActivatedUnmute": false,    "noiseThreshold": -60,    "sampleRate": 48000,    "channelCount": 2,    "sampleSize": 16,    "opusStereo": true,    "opusDtx": false,    "opusFec": true,    "opusPtime": 60,    "opusMaxPlaybackRate": 48000  }}`` |
| autoMuteThreshold | It sets the maximum number of participants in one room that can join unmuted. The next participant will join automatically muted. Set it to 0 to auto mute all. Set it to negative (-1) to never automatically auto mute but use it with caution,  full mesh audio strongly decrease room capacity! | `"nat"` | ``4`` |
| background | The page background image URL | `"string"` | ``"images/background.jpg"`` |
| defaultLayout | The default layout. | `[  "democratic",  "filmstrip"]` | ``"democratic"`` |
| buttonControlBar | If true, the media control buttons will be shown in separate control bar, not in the ME container. | `"boolean"` | ``false`` |
| notificationPosition | The position of the notifications. | `[  "left",  "right"]` | ``"right"`` |
| logo | If not null, it shows the logo loaded from the specified URL, otherwise it shows the title. | `"url"` | ``"images/logo.edumeet.svg"`` |
| title | The title to show if the logo is not specified. | `"string"` | ``"edumeet"`` |
| supportUrl | The service & Support URL; if `null`, it will be not displayed on the about dialogs. | `"url"` | ``"https://support.example.com"`` |
| privacyUrl | The privacy and data protection external URL or local HTML path. | `"string"` | ``"privacy/privacy.html"`` |

---
