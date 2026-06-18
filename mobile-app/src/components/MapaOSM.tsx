import React, { useMemo, useRef, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { colors } from '../lib/theme';

export interface Marcador {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  titulo?: string;
}

interface Props {
  centro: { lat: number; lng: number };
  zoom?: number;
  marcadores?: Marcador[];
  onTocarMapa?: (lat: number, lng: number) => void;
  style?: any;
}

export function MapaOSM({ centro, zoom = 13, marcadores = [], onTocarMapa, style }: Props) {
  const ref = useRef<WebView>(null);
  const listo = useRef(false);

  const enviar = useCallback((cmd: object) => {
    if (!ref.current || !listo.current) return;
    ref.current.injectJavaScript(`try{window.handle(${JSON.stringify(cmd)})}catch(e){}; true;`);
  }, []);

  useEffect(() => {
    enviar({ tipo: 'marcadores', marcadores });
  }, [marcadores, enviar]);

  const html = useMemo(
    () => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{margin:0;height:100%;width:100%;background:${colors.bg}}
.pin{width:22px;height:22px;border-radius:11px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map, capa;
function send(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
function init(){
  map = L.map('m',{zoomControl:true,attributionControl:false}).setView([${centro.lat},${centro.lng}],${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  capa = L.layerGroup().addTo(map);
  map.on('click',function(e){ send({tipo:'tap',lat:e.latlng.lat,lng:e.latlng.lng}); });
  setTimeout(function(){map.invalidateSize()},250);
  send({tipo:'listo'});
}
window.handle=function(cmd){
  if(!map||!cmd) return;
  if(cmd.tipo==='marcadores'){
    capa.clearLayers();
    (cmd.marcadores||[]).forEach(function(m){
      var icon=L.divIcon({className:'',html:'<div class="pin" style="background:'+(m.color||'${colors.primary}')+'"></div>',iconSize:[22,22],iconAnchor:[11,11]});
      var mk=L.marker([m.lat,m.lng],{icon:icon});
      if(m.titulo) mk.bindPopup(m.titulo);
      mk.addTo(capa);
    });
  }
};
document.addEventListener('DOMContentLoaded',init);
if(document.readyState!=='loading') init();
</script></body></html>`,
    [centro.lat, centro.lng, zoom]
  );

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (d.tipo === 'listo') { listo.current = true; enviar({ tipo: 'marcadores', marcadores }); }
      else if (d.tipo === 'tap' && onTocarMapa) onTocarMapa(d.lat, d.lng);
    } catch {}
  };

  return (
    <View style={[styles.root, style]}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.load}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadTxt}>Cargando mapa…</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  load: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 8 },
  loadTxt: { color: colors.textSecondary, fontSize: 13 },
});
