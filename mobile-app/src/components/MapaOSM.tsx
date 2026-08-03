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
  icono?: string; // emoji opcional (🚛, 📍, 🏠…)
  pulso?: boolean; // punto rojo pulsante (camión acercándose en vivo)
}

export interface Polilinea {
  id: string;
  puntos: { lat: number; lng: number }[];
  color?: string;
  discontinua?: boolean;
}

export interface PuntoCalor {
  lat: number;
  lng: number;
  peso?: number; // 0-1 (intensidad)
}

interface Props {
  centro: { lat: number; lng: number };
  zoom?: number;
  marcadores?: Marcador[];
  polilineas?: Polilinea[];
  calor?: PuntoCalor[]; // mapa de calor (zonas críticas)
  ajustar?: boolean; // encuadrar el mapa a los elementos
  onTocarMapa?: (lat: number, lng: number) => void;
  style?: any;
}

export function MapaOSM({ centro, zoom = 13, marcadores = [], polilineas = [], calor = [], ajustar = false, onTocarMapa, style }: Props) {
  const ref = useRef<WebView>(null);
  const listo = useRef(false);

  const enviar = useCallback((cmd: object) => {
    if (!ref.current || !listo.current) return;
    ref.current.injectJavaScript(`try{window.handle(${JSON.stringify(cmd)})}catch(e){}; true;`);
  }, []);

  useEffect(() => {
    enviar({ tipo: 'datos', marcadores, polilineas, calor, ajustar });
  }, [marcadores, polilineas, calor, ajustar, enviar]);

  const html = useMemo(
    () => `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#m{margin:0;height:100%;width:100%;background:${colors.bg}}
.pin{width:22px;height:22px;border-radius:11px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)}
.emo{font-size:26px;line-height:30px;text-shadow:0 1px 3px rgba(0,0,0,.6);position:relative;z-index:2}
.pulsoWrap{position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center}
.pulsoDot{position:absolute;width:16px;height:16px;border-radius:50%;background:#f85149;box-shadow:0 0 0 rgba(248,81,73,.7);animation:pulso 1.4s infinite}
@keyframes pulso{0%{box-shadow:0 0 0 0 rgba(248,81,73,.7)}70%{box-shadow:0 0 0 22px rgba(248,81,73,0)}100%{box-shadow:0 0 0 0 rgba(248,81,73,0)}}</style>
</head><body><div id="m"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
<script>
var map, capa, capaL, capaCalor=null, ajustado=false;
function send(o){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
function init(){
  map = L.map('m',{zoomControl:true,attributionControl:false}).setView([${centro.lat},${centro.lng}],${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
  capaL = L.layerGroup().addTo(map);
  capa = L.layerGroup().addTo(map);
  map.on('click',function(e){ send({tipo:'tap',lat:e.latlng.lat,lng:e.latlng.lng}); });
  setTimeout(function(){map.invalidateSize()},250);
  send({tipo:'listo'});
}
window.handle=function(cmd){
  if(!map||!cmd) return;
  if(cmd.tipo==='datos'){
    capa.clearLayers(); capaL.clearLayers();
    var pts=[];
    (cmd.polilineas||[]).forEach(function(p){
      if(!p.puntos||p.puntos.length<2) return;
      var ll=p.puntos.map(function(q){return [q.lat,q.lng]});
      L.polyline(ll,{color:p.color||'${colors.primary}',weight:4,opacity:.85,dashArray:p.discontinua?'8 8':null}).addTo(capaL);
      pts=pts.concat(ll);
    });
    (cmd.marcadores||[]).forEach(function(m){
      var html;
      if(m.pulso){
        html='<div class="pulsoWrap"><div class="pulsoDot"></div>'+(m.icono?'<div class="emo">'+m.icono+'</div>':'')+'</div>';
      } else if(m.icono){
        html='<div class="emo">'+m.icono+'</div>';
      } else {
        html='<div class="pin" style="background:'+(m.color||'${colors.primary}')+'"></div>';
      }
      var icon=L.divIcon({className:'',html:html,iconSize:m.pulso?[34,34]:(m.icono?[30,30]:[22,22]),iconAnchor:m.pulso?[17,17]:(m.icono?[15,15]:[11,11])});
      var mk=L.marker([m.lat,m.lng],{icon:icon});
      if(m.titulo) mk.bindPopup(m.titulo);
      mk.addTo(capa);
      pts.push([m.lat,m.lng]);
    });
    if(capaCalor){ map.removeLayer(capaCalor); capaCalor=null; }
    if(cmd.calor && cmd.calor.length && window.L.heatLayer){
      capaCalor=L.heatLayer(cmd.calor.map(function(p){return [p.lat,p.lng,(p.peso||0.6)]}),
        {radius:38,blur:26,maxZoom:17,gradient:{0.2:'#58a6ff',0.5:'#d29922',0.8:'#f85149'}}).addTo(map);
    }
    if(cmd.ajustar && pts.length && !ajustado){
      try{ map.fitBounds(pts,{padding:[40,40],maxZoom:16}); ajustado=true; }catch(e){}
    }
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
      if (d.tipo === 'listo') { listo.current = true; enviar({ tipo: 'datos', marcadores, polilineas, calor, ajustar }); }
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
