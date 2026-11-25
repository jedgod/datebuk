# Physical-device test matrix

Test at least two iPhones and two Android devices on separate networks.

| ID | Caller | Callee | State | Network | Expected |
|---|---|---|---|---|---|
| 1 | Android | Android | foreground | Wi-Fi/Wi-Fi | rings, answer, media |
| 2 | Android | Android | locked | LTE/Wi-Fi | full-screen call UI |
| 3 | iPhone | iPhone | background | Wi-Fi/LTE | PushKit wakes, CallKit rings |
| 4 | iPhone | iPhone | terminated | LTE/LTE | PushKit launches call handling |
| 5 | Android | iPhone | locked | Wi-Fi/LTE | cross-platform answer |
| 6 | iPhone | Android | battery saver | LTE/Wi-Fi | timely high-priority delivery |
| 7 | Any | Any | caller cancels | mixed | ringing stops on all devices |
| 8 | Any | Any | no answer 30s | mixed | call marked MISSED |
| 9 | Any | Any | weak network | throttled | TURN relay connects |
| 10 | Any | Any | token revoked | mixed | invalid token removed |
| 11 | Any | Any | user blocked | mixed | call rejected server-side |
| 12 | Any | Any | airplane mode | offline | caller sees unavailable/timeout |
