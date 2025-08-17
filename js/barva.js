// use a script tag or an external JS file
document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(MorphSVGPlugin)

  const wavePathStart = "M0,1080 L0,800 Q960,900 1920,800 L1920,1080 Z";

  const wavePathmed = "M0,1080 L0,100 Q960,0 1920,100 L1920,1080 Z";

  const wavePathEnd = "M0,1080 L0,-500 Q960,-300 1920,-500 L1920,1080 Z"; // fuera de pantalla

  barba.init({
    transitions: [{
      async leave(data) {
        const done = this.async();

        gsap.set("#transition", {
          pointerEvents: "auto"
        });

        await gsap.timeline()
          .to("#wave", {
            duration: 0.5,
            morphSVG: wavePathStart,
            ease: "none"
          })
          .to("#wave", {
            duration: 0.5,
            morphSVG: wavePathmed,
            ease: "none"
          })
          .to("#wave", {
            duration: 0.4,
            morphSVG: wavePathEnd,
            ease: "power1.in"
          })
          // 👉 Aquí mostramos el GIF justo al final de la ola
          .set("#gif-overlay", {
            display: "block",
            opacity: 0
          })
          .to("#gif-overlay", {
            opacity: 1,
            duration: 0.5
          }) // fade in rápido
          .to("#gif-overlay", {
            delay: 1.5,
            opacity: 0,
            duration: 0.5
          }) // lo dejamos 3s y fade out
          .set("#gif-overlay", {
            display: "none"
          });

        done();
      },
      async enter(data) {
        const done = this.async();

        // Ola baja (entrada)
        await gsap.timeline()
          .set("#wave", {
            morphSVG: wavePathEnd
          })
          .to("#wave", {
            delay: 0,
            duration: 1,
            morphSVG: wavePathStart,
            ease: "power4.out"
          });

        gsap.set("#transition", {
          pointerEvents: "none"
        });
        done();
      }
    }]
  });
});