# Metrónomo

Metrónomo web preciso y completo, escrito en vanilla JavaScript. Funciona directamente en el navegador sin necesidad de instalar nada.

![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## Características

### Funciones Principales
- BPM ajustable entre 40 y 220
- Indicador visual que parpadea con cada beat
- Contador de compases (se reinicia cada 4 beats)
- **Tap Tempo**: marca el ritmo manualmente pulsando el botón
- **Presets**: guarda hasta 8 BPMs frecuentes (se persisten en localStorage)
- Interfaz moderna con diseño glassmorphism
- Compatible con móvil, tablet y ordenador
- Wake Lock API para evitar que la pantalla se apague
- Funciona con barra espaciadora

### Sonidos
- 4 tipos de sonido diferentes:
  - **Click**: sonido suave tipo sine wave
  - **Beep**: sonido más agudo tipo square wave
  - **Woodblock**: sonido percusivo tipo triangle wave
  - **Digital**: sonido electrónico tipo sawtooth wave

### Feedback Visual y Táctil
- **Vibración**: activa la vibración del móvil en cada beat (con toggle)
- **Flash**: la pantalla parpadea sutilmente con cada beat (con toggle)

### Temas
- **Modo oscuro/claro**: toggle en la esquina superior derecha
- La preferencia se guarda en localStorage

## Tecnologías

- Vanilla JavaScript (sin frameworks)
- Web Audio API para precisión en el timing
- CSS3 con glassmorphism
- HTML5
- Font Awesome para iconos
- localStorage para persistencia

## Uso

1. Ajusta los BPM usando el deslizador, introduce un valor, o usa **Tap Tempo**
2. Pulsa **Iniciar** o la barra espaciadora para comenzar
3. El punto azul parpadea con cada beat
4. Activa **Vibrar** para feedback táctil en móviles
5. Activa **Flash** para que la pantalla parpadee con cada beat
6. Guarda tus BPMs frecuentes con el botón **Guardar**

### Tap Tempo
Pulsa el botón "Tap Tempo" al ritmo de la música que quieras medir. Después de 2 pulsaciones calculará el BPM automáticamente. Los taps se resetean después de 2 segundos de inactividad.

### Presets
- Haz clic en "Guardar" para guardar el BPM actual
- Haz clic en un preset para cargar ese BPM
- Haz clic en la × para eliminar un preset
- Máximo 8 presets (los más antiguos se eliminan automáticamente)

### Notas por dispositivo

- **Móvil (iPhone):** Desactiva el interruptor de silencio para escuchar el clic
- **Tablet (iPad/Android):** Asegúrate de que el volumen esté activado
- **Ordenador:** Verifica que el audio de tu sistema no esté silenciado

## Desarrollo

Este proyecto no requiere build process. Simplemente abre `index.html` en tu navegador.

```bash
# Para servidor local (opcional)
python3 -m http.server 8000
# o
npx serve
```

## Funcionalidades Futuras

Estas funcionalidades están planificadas para futuras versiones:

### 1. Acordeón (Time Signature)
Permitirá seleccionar el compás (2/4, 3/4, 4/4, 6/8) con el primer beat acentuado diferente. Por ejemplo, en 4/4 el primer beat de cada compás tendría un sonido más fuerte o distinto.

### 2. Subdivisiones
Opción para subdividir cada beat en:
- **Eighth notes** (corcheas): 2 sonidos por beat
- **Triplets** (tercinas): 3 sonidos por beat
- **Sixteenth notes** (semicorcheas): 4 sonidos por beat

Útil para practicar ritmos más complejos y mejorar la precisión.

### 3. Tap Tempo Mejorado
El Tap Tempo actual será mejorado con:
- Visualización de los últimos taps
- Promedio de los últimos N taps
- Botón para resetear el tap tempo manualmente

## Licencia

&copy; 2025 [Mindbreaker81](https://github.com/Mindbreaker81/metronomo)
