# Edumeet client

This is the client service for the Edumeet project.


![](img/edumeet-client.drawio.png)

## Usage
This is the client service for the Edumeet project.

### Running the service in development

This will start the service using https with a self-signed certificate. It's exposed on port `4443`.
Https is needed for things such as `navigator.mediaService.getUserMedia()`. 

```bash
$ yarn install
$ yarn start
```

To debug in browser console you can read the store like so:  
`document.getElementById('edumeet')._reactRootContainer.current.memoizedState.element.props.children[1].props.store.getState()`  

You can read the mediaservice like so:  
`const mediaService = document.getElementById('edumeet')._reactRootContainer.current.memoizedState.element.props.children[1].props.children.props.children.props.children.props.children.props.value.mediaService`

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
	developmentPort: 8443,
	productionPort: 443
};
```
An example configuration file with all properties set to default values
can be found here: [config.example.js](public/config/config.example.js).

### Configuration properties

| Name | Description | Format | Default value |
| :--- | :---------- | :----- | :------------ |
| loginEnabled | If the login is enabled. | `"boolean"` | ``true`` |
| managementUrl | URL to management service | `"string"` | ``"http://localhost:3030"`` |
| developmentPort | The development room server service listening port. | `"port"` | ``8443`` |
| productionPort | The production room server service listening port. | `"port"` | ``443`` |
| serverHostname | If the room server service runs on a different host than the client service you can specify the host name. | `"string"` | ``""`` |
| resolution | The default video camera capture resolution. | `[  "low",  "medium",  "high",  "veryhigh",  "ultra"]` | ``"medium"`` |
| frameRate | The default video camera capture framerate. | `"nat"` | ``15`` |
| screenResolution | The default screen sharing resolution. | `[  "low",  "medium",  "high",  "veryhigh",  "ultra"]` | ``"veryhigh"`` |
| screenSharingFrameRate | The default screen sharing framerate. | `"nat"` | ``5`` |
| simulcast | Enable or disable simulcast for webcam video. | `"boolean"` | ``true`` |
| simulcastSharing | Enable or disable simulcast for screen sharing video. | `"boolean"` | ``false`` |
| autoGainControl | Auto gain control enabled. | `"boolean"` | ``true`` |
| echoCancellation | Echo cancellation enabled. | `"boolean"` | ``true`` |
| noiseSuppression | Noise suppression enabled. | `"boolean"` | ``true`` |
| sampleRate | The audio sample rate. | `[  8000,  16000,  24000,  44100,  48000]` | ``48000`` |
| channelCount | The audio channels count. | `[  1,  2]` | ``1`` |
| sampleSize | The audio sample size count. | `[  8,  16,  24,  32]` | ``16`` |
| opusStereo | If OPUS FEC stereo be enabled. | `"boolean"` | ``false`` |
| opusDtx | If OPUS DTX should be enabled. | `"boolean"` | ``true`` |
| opusFec | If OPUS FEC should be enabled. | `"boolean"` | ``true`` |
| opusPtime | The OPUS packet time. | `[  3,  5,  10,  20,  30,  40,  50,  60]` | ``20`` |
| opusMaxPlaybackRate | The OPUS playback rate. | `[  8000,  16000,  24000,  44100,  48000]` | ``48000`` |
| audioPreset | The audio preset | `"string"` | ``"conference"`` |
| audioPresets | The audio presets. | `"object"` | ``{  "conference": {    "name": "Conference audio",    "autoGainControl": true,    "echoCancellation": true,    "noiseSuppression": true,    "sampleRate": 48000,    "channelCount": 1,    "sampleSize": 16,    "opusStereo": false,    "opusDtx": true,    "opusFec": true,    "opusPtime": 20,    "opusMaxPlaybackRate": 48000  },  "hifi": {    "name": "HiFi streaming",    "autoGainControl": false,    "echoCancellation": false,    "noiseSuppression": false,    "sampleRate": 48000,    "channelCount": 2,    "sampleSize": 16,    "opusStereo": true,    "opusDtx": false,    "opusFec": true,    "opusPtime": 60,    "opusMaxPlaybackRate": 48000  }}`` |
| background | The page background image URL | `"string"` | ``"images/background.jpg"`` |
| buttonControlBar | If true, the media control buttons will be shown in separate control bar, not in the ME container. | `"boolean"` | ``false`` |
| logo | If not null, it shows the logo loaded from the specified URL, otherwise it shows the title. | `"url"` | ``"images/logo.edumeet.svg"`` |
| title | The title to show if the logo is not specified. | `"string"` | ``"edumeet"`` |

---
