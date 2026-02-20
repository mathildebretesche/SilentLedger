"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

function Padlock({ scrollY }: { scrollY: number }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Smoothly interpolate the rotation and position based on scroll
        const targetY = scrollY * 0.001;
        const targetX = scrollY * 0.0005;

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY + 0.5, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX + 0.2, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, Math.sin(state.clock.elapsedTime) * 0.1, 0.05);
    });

    return (
        <group ref={groupRef} position={[2.5, 0, 0]}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {/* Shackle (Torus) */}
                <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
                    <torusGeometry args={[0.5, 0.15, 32, 64, Math.PI]} />
                    <meshStandardMaterial
                        color="#cbd5e1"
                        metalness={0.9}
                        roughness={0.1}
                    />
                </mesh>

                {/* Main Body */}
                <RoundedBox args={[1.6, 1.4, 0.6]} radius={0.12} smoothness={8} castShadow receiveShadow position={[0, -0.2, 0]}>
                    <meshStandardMaterial
                        color="#20349F"
                        metalness={0.3}
                        roughness={0.4}
                        envMapIntensity={1}
                    />
                </RoundedBox>

                {/* Keyhole Circle */}
                <mesh castShadow position={[0, -0.1, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.1, 32]} />
                    <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
                </mesh>

                {/* Keyhole Base */}
                <RoundedBox args={[0.2, 0.4, 0.1]} radius={0.03} smoothness={4} castShadow position={[0, -0.4, 0.31]}>
                    <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
                </RoundedBox>
            </Float>
        </group>
    );
}

function Certificate({ scrollY }: { scrollY: number }) {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Smoothly interpolate the rotation and position based on scroll
        const targetY = scrollY * 0.0008;
        const targetX = scrollY * 0.0004;

        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY - 0.4, 0.05);
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX - 0.1, 0.05);
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, Math.sin(state.clock.elapsedTime + 2) * 0.15, 0.05);
    });

    return (
        <group ref={groupRef} position={[-2.5, 0, -1]}>
            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
                {/* Paper Document */}
                <RoundedBox args={[2.2, 3, 0.05]} radius={0.05} smoothness={8} castShadow receiveShadow position={[0, 0, 0]}>
                    <meshStandardMaterial color="#f8fafc" roughness={0.9} />
                </RoundedBox>

                {/* Text lines placeholders */}
                <mesh position={[0, 0.8, 0.03]} castShadow>
                    <planeGeometry args={[1.4, 0.1]} />
                    <meshBasicMaterial color="#cbd5e1" />
                </mesh>
                <mesh position={[0, 0.5, 0.03]} castShadow>
                    <planeGeometry args={[1.4, 0.05]} />
                    <meshBasicMaterial color="#e2e8f0" />
                </mesh>
                <mesh position={[0, 0.3, 0.03]} castShadow>
                    <planeGeometry args={[1.4, 0.05]} />
                    <meshBasicMaterial color="#e2e8f0" />
                </mesh>

                {/* Seal Base */}
                <mesh position={[0.6, -0.9, 0.04]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                    <cylinderGeometry args={[0.3, 0.3, 0.02, 32]} />
                    <meshStandardMaterial color="#dc2626" metalness={0.3} roughness={0.4} />
                </mesh>

                {/* Seal Inner Circle */}
                <mesh position={[0.6, -0.9, 0.055]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.2, 0.2, 0.01, 32]} />
                    <meshStandardMaterial color="#b91c1c" metalness={0.2} roughness={0.6} />
                </mesh>

                {/* Ribbon Left */}
                <mesh position={[0.45, -1.3, 0.03]} rotation={[0, 0, -0.4]} castShadow>
                    <planeGeometry args={[0.15, 0.6]} />
                    <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.5} />
                </mesh>

                {/* Ribbon Right */}
                <mesh position={[0.75, -1.3, 0.03]} rotation={[0, 0, 0.4]} castShadow>
                    <planeGeometry args={[0.15, 0.6]} />
                    <meshStandardMaterial color="#dc2626" metalness={0.2} roughness={0.5} />
                </mesh>
            </Float>
        </group>
    );
}

function Scene({ scrollY }: { scrollY: number }) {
    return (
        <>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#20349F" />
            <pointLight position={[0, 0, 5]} intensity={0.5} color="#d3daff" />

            <Padlock scrollY={scrollY} />
            <Certificate scrollY={scrollY} />

            <Environment preset="city" />
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} color="#20349F" />
        </>
    );
}

export function Background3D({ scrollY }: { scrollY: number }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div
            className="fixed inset-0 z-0 pointer-events-none blur-[6px] transition-opacity duration-1000 ease-in-out"
            style={{ opacity: loaded ? 0.7 : 0 }}
        >
            <Canvas
                camera={{ position: [0, 0, 6], fov: 45 }}
                shadows
                dpr={[1, 2]}
                onCreated={() => setLoaded(true)}
            >
                <Scene scrollY={scrollY} />
            </Canvas>
        </div>
    );
}
