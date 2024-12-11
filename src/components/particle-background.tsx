// 'use client';

// import Particles, { initParticlesEngine } from "@tsparticles/react";
// import { useEffect, useState } from "react";
// import { loadFull } from "tsparticles";
// export default function ParticleBackground() {
//     const [init, setInit] = useState(false);

//     useEffect(() => {
//         initParticlesEngine(async (engine) => {
//             await loadFull(engine);
//         }).then(() => {
//             setInit(true);
//         });
//     }, []);

//     return (
//         <>
//             {
//                 init && (

//                     <Particles
//                         id="tsparticles"
//                         options={{
//                             background: {
//                                 color: {
//                                     value: "transparent",
//                                 },
//                             },
//                             fpsLimit: 120,
//                             interactivity: {
//                                 events: {
//                                     onClick: {
//                                         enable: true,
//                                         mode: "push",
//                                     },
//                                     onHover: {
//                                         enable: true,
//                                         mode: "repulse",
//                                     },
//                                 },
//                                 modes: {
//                                     push: {
//                                         quantity: 4,
//                                     },
//                                     repulse: {
//                                         distance: 200,
//                                         duration: 0.4,
//                                     },
//                                 },
//                             },
//                             particles: {
//                                 color: {
//                                     value: "#ffffff",
//                                 },
//                                 links: {
//                                     color: "#ffffff",
//                                     distance: 150,
//                                     enable: true,
//                                     opacity: 0.5,
//                                     width: 1,
//                                 },
//                                 move: {
//                                     direction: "none",
//                                     enable: true,
//                                     outModes: {
//                                         default: "bounce",
//                                     },
//                                     random: false,
//                                     speed: 1,
//                                     straight: false,
//                                 },
//                                 number: {
//                                     density: {
//                                         enable: true,
//                                     },
//                                     value: 80,
//                                 },
//                                 opacity: {
//                                     value: 0.5,
//                                 },
//                                 shape: {
//                                     type: "circle",
//                                 },
//                                 size: {
//                                     value: { min: 1, max: 5 },
//                                 },
//                             },
//                             detectRetina: true,
//                         }}
//                     />
//                 )
//             }
//         </>
//     );

// }


"use client";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useState } from "react";
import { loadFull } from "tsparticles";


const ParticleBackground = () => {
    const [init, setInit] = useState(false);

    // this should be run only once per application lifetime
    useEffect(() => {
        initParticlesEngine(async (engine) => {
            // you can initiate the tsParticles instance (engine) here, adding custom shapes or presets
            // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
            // starting from v2 you can add only the features you need reducing the bundle size
            //await loadAll(engine);
            //await loadFull(engine);
            await loadFull(engine);
            //await loadBasic(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    return (
        <div>
            {init && (
                <Particles
                    id="tsparticles"
                    className="absolute top-0 left-0 w-full h-full"
                    options={{
                        fullScreen: {
                            enable: false,
                        },
                        background: {
                            color: {
                                value: "#000",
                            },
                        },
                        fpsLimit: 60,
                        interactivity: {
                            events: {
                                onClick: {
                                    enable: false,
                                    mode: "push",
                                },
                                onHover: {
                                    enable: true,
                                    mode: "repulse",
                                },
                            },
                            modes: {
                                push: {
                                    quantity: 4,
                                },
                                repulse: {
                                    distance: 200,
                                    duration: 0.4,
                                },
                            },
                        },
                        particles: {
                            color: {
                                value: "#c505f5",
                            },
                            links: {
                                color: "#333333",
                                distance: 150,
                                enable: true,
                                opacity: 0.5,
                                width: 1,
                            },
                            move: {
                                direction: "none",
                                enable: true,
                                outModes: {
                                    default: "bounce",
                                },
                                random: false,
                                speed: 1,
                                straight: false,
                            },
                            number: {
                                density: {
                                    enable: true,
                                },
                                value: 100,
                            },
                            opacity: {
                                value: 0.5,
                            },
                            shape: {
                                type: "circle",
                            },
                            size: {
                                value: { min: 1, max: 5 },
                            },
                        },
                        detectRetina: true,
                    }}
                />
            )}
        </div>
    );
};

export default ParticleBackground;