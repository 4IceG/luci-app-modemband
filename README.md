# luci-app-modemband

![GitHub release (latest by date)](https://img.shields.io/github/v/release/4IceG/luci-app-modemband?style=flat-square)
![GitHub stars](https://img.shields.io/github/stars/4IceG/luci-app-modemband?style=flat-square)
![GitHub forks](https://img.shields.io/github/forks/4IceG/luci-app-modemband?style=flat-square)
![GitHub All Releases](https://img.shields.io/github/downloads/4IceG/luci-app-modemband/total)

Luci-app-modemband is a My GUI for https://eko.one.pl/?p=openwrt-modemband. A program to set LTE bands for selected 4G modems.

``` bash
Supported devices:
- BroadMobi BM806U
- Dell DW5821e Snapdragon X20 LTE (Foxconn T77W968)
- Fibocom L850-GL
- Fibocom L850-GL in mbim mode
- Fibocom L860-GL
- HP lt4112 (Huawei ME906E)
- HP lt4220 (Foxconn T77W676)
- HP lt4220 (Foxconn T77W676) in mbim mode
- Huawei (various models) in serial mode
  - Huawei E3272/E3372/E3276
  - Huawei ME906E
  - Huawei ME906s
  - Huawei ME909s-120
  - Huawei ME909s-821
  - Huawei ME909s-821a
  - Huawei ME909u-521
- Quectel EC20
- Quectel EC25
- Quectel EG06-E
- Quectel EM12-G
- Quectel EM160R-GL
- Quectel EP06-E
- Quectel RG502Q-EA
- Telit LN940 (Foxconn T77W676)
- Telit LN940 (Foxconn T77W676) in mbim mode
- Telit LN960 (Foxconn T77W968)
- Telit LN960
- ZTE MF286 (router)
- ZTE MF286A (router)
- ZTE MF286D (router)
- ZTE MF286R (router)
- ZTE MF289F (router)

```

Do you have another type of modem? Would you like to add support for it?
Send PR/mail with description:
- exact name of modem and ew version number
- VID and PID identifier on the USB bus
- serial port used for communication with the modem ("diagnostic")
- AT command to read the set bands together with an example result
- an AT command to set specific bands
- a list of all bands that can be set on the modem

``` bash
#Modem drivers are required for proper operation.
kmod-usb-serial kmod-usb-serial-option

#+DEPENDS:
sms-tool_2021-12-03-d38898f4-1 modemband_20220404

#The sms-tool package is not available in the OpenWrt core repository. 
#Sms-tool is only available in the eko.one.pl forum repository. 
#If you do not have an image from forum eko.one.pl you have to compile the package manually.

#For images from the eko.one.pl forum we proceed:
opkg update
opkg install sms-tool

#Package installation example
Latest version ➜ https://github.com/4IceG/luci-app-modemband/releases/latest

wget https://github.com/4IceG/luci-app-modemband/releases/download/1.0.13-20220701/luci-app-modemband_1.0.13-20220701_all.ipk -O /tmp/luci-app-modemband_1.0.13-20220701_all.ipk
opkg install /tmp/luci-app-modemband_1.0.13-20220701_all.ipk


```

### <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="32"> Preview / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="32"> Podgląd

![](https://github.com/4IceG/Personal_data/blob/master/modemband20220306.gif?raw=true)


## <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_United_Kingdom.png" height="32"> Thanks to / <img src="https://raw.githubusercontent.com/4IceG/Personal_data/master/dooffy_design_icons_EU_flags_Poland.png" height="32"> Podziękowania dla
- [obsy (Cezary Jackiewicz)](https://github.com/obsy)
