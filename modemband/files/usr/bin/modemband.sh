#!/bin/sh

#
# (c) 2022 Cezary Jackiewicz <cezary@eko.one.pl>
# (c) 2022 modified by Rafał Wabik - IceG - From eko.one.pl forum
#

hextobands() {
	HEX="$1"
	LEN=${#HEX}
	if [ $LEN -gt 18 ]; then
		CNT=$((LEN - 16))
		HHEX=${HEX:0:CNT}
		HEX="0x"${HEX:CNT}
	fi

	for B in $(seq 0 63); do
		POW=$((2 ** $B))
		T=$((HEX&$POW))
		[ "x$T" = "x$POW" ] && BANDS="${BANDS}$((B + 1)) "
	done
	if [ -n "$HHEX" ]; then
		for B in $(seq 0 63); do
			POW=$((2 ** $B))
			T=$((HHEX&$POW))
			[ "x$T" = "x$POW" ] && BANDS="${BANDS}$((B + 1 + 64)) "
		done
	fi
	echo "$BANDS"
}

numtobands() {
	NUMB="$1"
	BANDS=${NUMB}
	echo "$BANDS"
}

bandstonum() {
	BNUM="$1"
	BNA=${BNUM}
	BN=$(echo $BNA | tr ' ' ':')
	echo "$BN"
}

bandstohex() {
	BANDS="$1"
	SUM=0
	HSUM=0
	for BAND in $BANDS; do
		case $BAND in
			''|*[!0-9]*) continue ;;
		esac
		if [ $BAND -gt 64 ]; then
			B=$((BAND - 1 - 64))
			POW=$((2 ** $B))
			HSUM=$((HSUM + POW))
		else
			B=$((BAND - 1))
			POW=$((2 ** $B))
			SUM=$((SUM + POW))
		fi
	done
	if [ $HSUM -eq 0 ]; then
		HEX=$(printf '%x' $SUM)
	else
		HEX=$(printf '%x%016x' $HSUM $SUM)
	fi
	echo "$HEX"
}

_DEVICE=""
_DEFAULT_LTE_BANDS=""

# default templates

# modem name/type
getinfo() {
	echo "Unsupported"
}

# get supported band
getsupportedbands() {
	echo "Unsupported"
}

# get current configured bands
getbands() {
	echo "Unsupported"
}

# set bands
setbands() {
	echo "Unsupported"
}

RES="/usr/share/modemband"

_DEVS=$(awk '{gsub("="," ");
if ($0 ~ /Bus.*Lev.*Prnt.*Port.*/) {T=$0}
if ($0 ~ /Vendor.*ProdID/) {idvendor[T]=$3; idproduct[T]=$5}
if ($0 ~ /Product/) {product[T]=$3}}
END {for (idx in idvendor) {printf "%s%s\n%s%s%s\n", idvendor[idx], idproduct[idx], idvendor[idx], idproduct[idx], product[idx]}}' /sys/kernel/debug/usb/devices)
for _DEV in $_DEVS; do
	if [ -e "$RES/$_DEV" ]; then
		. "$RES/$_DEV"
		break
	fi
done

if [ -z "$_DEVICE" ]; then
	echo "No supported modem was found, quitting..."
	exit 0
fi
if [ ! -e "$_DEVICE" ]; then
	echo "Port not found, quitting..."
	exit 0
fi

case $1 in
	"getinfo")
		getinfo
		;;
	"getsupportedbands")
		getsupportedbands
		;;
	"getbands")
		getbands
		;;
	"setbands")
		setbands "$2"
		;;
	*)
		echo -n "Modem: "
		getinfo
		echo -n "Supported LTE bands: "
		getsupportedbands
		echo -n "LTE bands: "
		getbands
		;;
esac

exit 0
