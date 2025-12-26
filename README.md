# Metrónomo

Metrónomo web sencillo y preciso, escrito en vanilla JavaScript. Funciona directamente en el navegador sin necesidad de instalar nada.

![Vercel](https://img.shields.io/bercel-vercel-000000?style=flat&logo=vercel&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

## Características

- BPM ajustable entre 40 y 220
- Indicador visual que parpadea con cada beat
- Interfaz moderna con diseño glassmorphism
- Compatible con móvil, tablet y ordenador
- Wake Lock API para evitar que la pantalla se apague
- Funciona con barra espaciadora

## Tecnologías

- Vanilla JavaScript (sin frameworks)
- Web Audio API para precisión en el timing
- CSS3 con glassmorphism
- HTML5

## Uso

1. Ajusta los BPM usando el deslizador o introduce un valor directamente
2. Pulsa **Iniciar** o la barra espaciadora para comenzar
3. El punto azul parpadea con cada beat

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

## Licencia

&copy; 2025 [Mindbreaker81](https://github.com/Mindbreaker81/metronomo)
