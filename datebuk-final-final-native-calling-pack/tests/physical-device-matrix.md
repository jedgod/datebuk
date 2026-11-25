# Physical-Device Test Matrix

| ID | Caller | Callee | App State | Network | Expected Result |
|---|---|---|---|---|---|
| 1 | Android | Android | foreground | Wi-Fi/Wi-Fi | rings and connects |
| 2 | Android | Android | locked | LTE/Wi-Fi | full-screen incoming UI |
| 3 | iPhone | iPhone | background | Wi-Fi/LTE | PushKit wakes app and CallKit rings |
| 4 | iPhone | iPhone | terminated | LTE/LTE | CallKit appears |
| 5 | Android | iPhone | locked | Wi-Fi/LTE | cross-platform connection |
| 6 | iPhone | Android | battery saver | LTE/Wi-Fi | FCM delivery and full-screen UI |
| 7 | Android | iPhone | caller cancels | mixed | ringing ends immediately |
| 8 | iPhone | Android | no answer | mixed | call becomes MISSED |
| 9 | Any | Any | separate NATs | mixed | TURN relay succeeds |
| 10 | Any | Any | invalid token | mixed | token disabled |
| 11 | Any | Any | blocked users | mixed | server rejects call |
| 12 | Any | Any | airplane mode | offline | timeout/unavailable state |
