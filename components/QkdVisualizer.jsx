"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Html, Line, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Extend the THREE namespace with necessary geometries
extend({ BoxGeometry: THREE.BoxGeometry });

const QKDScene = ({ aliceState, aliceBasis, bobBasis, bobResult, simulate, setSimulate }) => {
  const photonRef = useRef();

  const positions = [
    [-5, 0, 0],
    [-2.5, 0, 0],
    [2.5, 0, 0],
    [5, 0, 0],
  ];

  const speed = 0.02;
  useFrame(() => {
    if (photonRef.current && simulate) {
      if (photonRef.current.position.x >= 2.5 && photonRef.current.position.x <= 5 && aliceBasis !== bobBasis) {
        photonRef.current.position.x = 2.5;
        setSimulate(false);
        return;
      }
      photonRef.current.position.x += speed;
      if (photonRef.current.position.x > 5) {
        photonRef.current.position.x = -5;
        setSimulate(false);
      }
    }
  });

  useEffect(() => {
    if (simulate && photonRef.current) {
      photonRef.current.position.x = -5;
    }
  }, [simulate]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />

      {/* Alice's Qubit State */}
      <mesh position={positions[0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={aliceState === 1 ? 'blue' : 'red'} />
      </mesh>
      <Html position={[-5, -1.5, 0]} center>
        <div className="text-black text-center">{`Alice's State: ${aliceState} (${aliceState === 1 ? '|↑⟩' : '|→⟩'})`}</div>
      </Html>

      {/* Alice's Polarization Filter */}
      <mesh
        position={positions[1]}
        rotation={aliceBasis === 1 ? [0, 0, Math.PI / 4] : [0, 0, 0]}
      >
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial color={aliceBasis === 1 ? 'green' : 'orange'} transparent opacity={0.5} />
      </mesh>
      <Html position={[-2.5, -1.5, 0]} center>
        <div className="text-black text-center">{`Alice's Basis: ${aliceBasis === 1 ? 'Diagonal' : 'Rectilinear'}`}</div>
      </Html>

      {/* Bob's Polarization Filter */}
      <mesh
        position={positions[2]}
        rotation={bobBasis === 1 ? [0, 0, Math.PI / 4] : [0, 0, 0]}
      >
        <boxGeometry args={[2, 2, 0.1]} />
        <meshStandardMaterial color={bobBasis === 1 ? 'green' : 'orange'} transparent opacity={0.5} />
      </mesh>
      <Html position={[2.5, -1.5, 0]} center>
        <div className="text-black text-center">{`Bob's Basis: ${bobBasis === 1 ? 'Diagonal' : 'Rectilinear'}`}</div>
      </Html>

      {/* Bob's Result */}
      <mesh position={positions[3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={bobResult === 1 ? 'blue' : 'red'} />
      </mesh>
      <Html position={[5, -1.5, 0]} center>
        <div className="text-black text-center">{`Bob's Result: ${bobResult}`}</div>
      </Html>

      {/* Photon Path */}
      <Line points={[positions[0], positions[1]]} color="black" lineWidth={1} />
      <Line points={[positions[1], positions[2]]} color="black" lineWidth={1} />
      <Line points={[positions[2], positions[3]]} color="black" lineWidth={1} />
      <Sphere ref={photonRef} position={[-5, 0, 0]} args={[0.2, 16, 16]}>
        <meshStandardMaterial color="yellow" />
      </Sphere>
    </>
  );
};

const QkdVisualizer = () => {
  const [aliceState, setAliceState] = useState(0);
  const [aliceBasis, setAliceBasis] = useState(0);
  const [bobBasis, setBobBasis] = useState(0);
  const [bobResult, setBobResult] = useState(null);
  const [simulate, setSimulate] = useState(false);

  const handleFilterChange = () => {
    const result = aliceBasis === bobBasis ? aliceState : Math.round(Math.random());
    setBobResult(result);
    setSimulate(true);
  };

  return (
    <div className="flex flex-col items-center h-screen bg-black p-4">
      <h1 className="text-2xl  text-white font-bold mb-4 ">Quantum Key Distribution (QKD) Visualization</h1>
      <p className="text-center text-xl mb-2 text-white">This visualization demonstrates the quantum key distribution process between Alice and Bob.</p>
      <p className="text-center text-xl mb-4 text-white">Use the controls below to manually set Alice's qubit state and the polarization filters for Alice and Bob:</p>
      <div className="mb-4 flex items-center justify-center">
        <label htmlFor="aliceState" className="block text-lg mb-1 text-white mr-8">Alice's Qubit State:</label>
        <select id="aliceState" value={aliceState} onChange={(e) => setAliceState(parseInt(e.target.value))} className="mb-2 px-8 text-center border border-white rounded text-black">
          <option value={0}>0 (|→⟩)</option>
          <option value={1}>1 (|↑⟩)</option>
        </select>
      </div>
      <div className="mb-4 flex items-center justify-center">
        <label htmlFor="aliceBasis" className="block mb-1 text-lg text-white text-center mr-2">Alice's Polarization Filter:</label>
        <select id="aliceBasis" value={aliceBasis} onChange={(e) => setAliceBasis(parseInt(e.target.value))} className="mb-2 px-8 border border-white text-black rounded">
          <option value={0}>Rectilinear (Horizontal/Vertical)</option>
          <option value={1}>Diagonal (Diagonal/Anti-diagonal)</option>
        </select>
      </div>
      <div className="mb-4 flex items-center justify-center">
        <label htmlFor="bobBasis" className="block mb-1 text-white text-center mr-2 text-lg">Bob's Polarization Filter:</label>
        <select id="bobBasis" value={bobBasis} onChange={(e) => setBobBasis(parseInt(e.target.value))} className="mb-2 px-8 border border-white text-black rounded">
          <option value={0}>Rectilinear (Horizontal/Vertical)</option>
          <option value={1}>Diagonal (Diagonal/Anti-diagonal)</option>
        </select>
      </div>
      <button onClick={handleFilterChange} className="mb-4 p-4 bg-red-500 text-white font-bold text-sm tracking-wider rounded">Simulate</button>
      <div className="w-full h-full bg-white rounded-3xl shadow-lg">
      {bobResult !== null && (<div className='flex items-center justify-center'><p className="mt-4 text-lg text-black">Bob's Result: {bobResult}</p></div>)}
        <Canvas>
          <QKDScene
            aliceState={aliceState}
            aliceBasis={aliceBasis}
            bobBasis={bobBasis}
            bobResult={bobResult}
            simulate={simulate}
            setSimulate={setSimulate}
          />
        </Canvas>
      </div>
     
    </div>
  );
};

export default QkdVisualizer;
