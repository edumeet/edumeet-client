# Headless browser and bot behavior

A page opened with `?headless=1` (or `headless=true`) is meant for a headless browser that records, streams or transcribes the room. Whoever builds such a bot should read [BOTS.md](https://github.com/edumeet/edumeet/blob/main/BOTS.md), which describes the page from the bot's side; this section is how the client does it. It joins on its own and shows nothing but the room:

- No join dialog, no lobby dialog, no device preview, so the browser is never asked for a camera or microphone. The microphone and camera stay muted; the bot never sends media.
- The top bar keeps the logo and meeting timer, plus the countdown timer when it is enabled. Its buttons and status icons are not shown, the bot icon included; neither are the control bar, the help button, the lobby dialog and the drawing toolbar. Names stay on every tile, the buttons on the tiles do not.
- Pop-up notifications are dropped and notification sounds are off, so they never end up in the capture.
- The layout follows the appearance settings above with this preset, saved like any other change:
  self view hidden, participants without video ungrouped, nothing intentionally hidden, sounds off.
  The room's `maxActiveVideos` setting still limits how many participant tiles appear at once.
  Opening a link with `?headless=0` (or `headless=false`) in the same browser puts those four
  settings back to their defaults.
- Outside the room (connecting, waiting in the lobby, refused, kicked, meeting ended) the page shows only the background and does not reload or rejoin. The [client status attributes](configuration.md#status-attributes-on-the-document) tell the recorder what happened.
- `?displayName=` names the bot; without one it is called "Bot" rather than taking a name stored in the browser. `?meetingToken=` works as for anyone else.

When client monitoring samples are collected (`clientMonitor.samplingPeriodInMs`), a headless page sends them like any client, marked with `headless: true`, its `botType` and, for a bot that runs jobs, its `botId` in the sample attachments; they describe what the page received, since it sends no media.

The room-server treats a headless peer as a bot rather than a participant: it is not shown in the participant list or counted, it cannot chat, share, draw, raise a hand or vote to end the meeting, it never becomes the first-participant admin of a room, and it does not keep a room open once the last participant has left. Everyone in the room sees a bot icon with the count in the top bar; its tooltip lists the bots' names. It counts the bots in the session the viewer is in, so a participant in a breakout room sees the bots of that breakout room. A moderator can click it to see the list and remove a single bot or all of them, after a confirmation. The browser running the page needs its autoplay policy relaxed, since there is no click-to-play fallback for remote audio.

A bot never opens a room: it is refused (`roomNotOpen`, see the status attributes) until at least one participant is in the room, and the recorder has to try again later.

## Bot access tokens

In a tenant, whether bots may join is a tenant setting in the management UI ("Who may join as a bot"): disabled (the default), only bots with an access token, or all bots. Tokens are created per tenant in the same place, each with a label and the IP addresses or ranges the bot may connect from; the token is shown once and only its hash is stored. A bot presents its token in the URL fragment, which browsers never send to any server, and the client passes it to the room-server in the socket handshake body, so it appears in no access log:

```
https://rooms.example.edu/<room>?headless=1&botType=recorder&displayName=Recorder#botToken=<token>
```

A bot records one session. Without `session` it is in the main room; with `?session=<breakout session id>` the room-server places it in that breakout room at join (the id is the `roomSessionId` the client receives with each breakout room). The breakout room may still be empty. A bot is refused with `sessionNotOpen` when no such breakout room exists, and it is ended with `sessionClosed` when the breakout room is removed or ejected, rather than following the participants back to the main room. Run one page per session to record the main room and breakout rooms at the same time. The bot icon in the top bar counts the bots in the session the viewer is in.

A bot with a valid token from an allowed address is verified: it skips the lobby of a locked room and needs no meeting token in a meetings-only room. A bot with a token that does not verify is refused rather than admitted as a plain bot. `botType` (`recorder`, `transcriber` or `streamer`) is passed on to the other participants for information. Outside a tenant (a deployment without a management server) bots need no token.

## Starting jobs from the room

When a tenant has configured a **bot provider** (an outside service that records, streams or
transcribes, see
[BOT-PROVIDER-API.md](https://github.com/edumeet/edumeet/blob/main/BOT-PROVIDER-API.md)), moderators
get an entry per kind in the More menu: "Start server recording", "Start live stream", "Start server
transcription". They appear only for a kind a provider of the tenant offers (the tenant editor ticks
the kinds per provider), only for moderators, and only in a room claimed in the management: in an
unclaimed room the first participant is a moderator, so the room-server offers no providers there.
While a job of that kind runs in the moderator's session, the entry offers to stop it instead ("Stop
server recording", "Stop live stream", "Stop server transcription"), as **Stop** in the bot menu
does. A tenant without providers sees nothing new anywhere. Where login is enabled, a moderator who is not signed in sees the entry
disabled with "Log in to record" (a deployment without login has no such entries): the recording or transcript is sent by email to the owners of the room and to
the moderator who started it, resolved from their accounts, so somebody signed in has to start it.
The confirmation says so; for a live stream it says the stream goes to its configured destination. Stopping a job needs the same; a moderator who is not signed in can still remove
the bot from the bot menu, which ends every job it runs.

Starting one is confirmed in a dialog that names the provider, and in an end-to-end encrypted room
says that the provider will be able to see and hear the meeting. Where a tenant has more than one
provider of the same kind, the dialog also asks which one.

While a job captures, everyone in the room sees it in the top bar: a blinking red dot for a
recording, and the icon of the kind for a live stream or a transcription, one icon per kind however
many jobs of it run. The icon dims while the job's browser is away and expected back. The bot icon
next to it opens, for a moderator, a row per job with the provider's name, what the job is doing and
a **Stop** button; stopping asks the provider to finish properly rather than cutting the browser off.
Bots that belong to no job are removed with **Kick** as before, as is a job whose browser does not
leave. A job that fails tells the moderators, by the provider's name and reason.

A provider sends one bot per session, which does every job of that provider there; the bot menu shows
a row per job, named by its kind and the provider, and **Stop** on one of them leaves the bot running
for the others. **Kick** is offered once per bot, since removing it ends all of its jobs, and the
confirmation for a kind whose provider's bot is already in the room says so. Only the bot of a
provider that offers transcription alone is sent with `botType=transcriber`: such a page declares no
video capability, so it receives audio only and no video is decoded or decrypted on it. A bot that
may be asked to record as well is sent without a `botType` and receives everything.

A room with a bot in it stays on the media node: a meeting small enough for peer-to-peer media
goes through the media node while a bot is there, so what the bot receives does not change when
the next participant arrives.

A page that runs jobs carries `botId` in its URL. Once the room-server has taken its join, it
reports itself as running every 20 seconds (`src/utils/botHeartbeat.ts`) and gets
`window.edumeetBot.status(state, reason, type)` (`src/utils/botStatusHook.ts`); the provider's own
`running` takes the heartbeat over for good. Refused with `roomNotOpen`, such a page tries again
quietly every 3 seconds for 30 seconds, writing nothing to the status attributes until it gives up,
because after a room-server restart the recorder may be back before the first participant is. What
a bot can do with these is in [BOTS.md](https://github.com/edumeet/edumeet/blob/main/BOTS.md).
