Setting LTE bands for selected modems.

Supported devices:
- BroadMobi BM806U
- Huawei E3272/E3276/E3372 in serial mode
- Quectel EC20
- Quectel EC25
- Quectel EG06-E
- Quectel EP06-E
- ZTE MF286
- ZTE MF286D

```
root@MiFi:~# modemband.sh

Modem: Quectel EC25
Supported LTE bands: 1 3 5 7 8 20 38 40 41
LTE bands: 1 3 5 7 8 20 38 40 41 

root@MiFi:~# modemband.sh getinfo
Quectel EC25

root@MiFi:~# modemband.sh getsupportedbands
1 3 5 7 8 20 38 40 41

root@MiFi:~# modemband.sh getbands
1 3 5 7 8 20 38 40 41 

root@MiFi:~# modemband.sh setbands "1 3 5 40"
at+qcfg="band",0,8000000015,0,1

root@MiFi:~# modemband.sh getbands
1 3 5 40 

root@MiFi:~# modemband.sh setbands default
at+qcfg="band",0,1a0000800d5,0,1

root@MiFi:~# modemband.sh getbands
1 3 5 7 8 20 38 40 41 
```

See also [description in Polish](https://eko.one.pl/?p=openwrt-modemband).
