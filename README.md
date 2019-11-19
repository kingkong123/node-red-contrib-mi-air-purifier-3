# Node Red Mi Air Purifier 3 Node

Based on a custom Miio package (https://github.com/kingkong123/miio)

## Only supported Mi Air Purifier 3

### Installation

`npm install node-red-contrib-mi-air-purifier3`

### Usage

Trigger the node with these `payload`

**Turn On/Off**

On: `{"control":"power","value":true}`

Off: `{"control":"power","value":false}`

**Change Mode**

Auto: `{"control":"mode","value":"auto"}`

Sleep: `{"control":"mode","value":"sleep"}`

Favorite: `{"control":"mode","value":"favorite"}`

None: `{"control":"mode","value":"none"}`

**Fan Speed**

`{"control":"fan","value":1}`

`{"control":"fan","value":2}`

`{"control":"fan","value":3}`

**Buzzer**

On: `{"control":"buzzer","value":true}`

Off: `{"control":"buzzer","value":false}`

**Child Lock**

On: `{"control":"childLock","value":true}`

Off: `{"control":"childLock","value":false}`

**LED Brightness**

Bright: `{"control":"ledBrightness","value":"bright"}`

Dim: `{"control":"ledBrightness","value":"dim"}`

Off: `{"control":"ledBrightness","value":"off"}`
