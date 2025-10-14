"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "../lib/utils";

/**
 * @typedef {Object} AnimatedBubbleParticlesProps
 * @property {string} [className]
 * @property {string} [backgroundColor]
 * @property {string} [particleColor]
 * @property {number} [particleSize]
 * @property {number} [spawnInterval]
 * @property {string} [height]
 * @property {string} [width]
 * @property {boolean} [enableGooEffect]
 * @property {number} [blurStrength]
 * @property {boolean} [pauseOnBlur]
 * @property {number} [zIndex]
 * @property {{min:number,max:number}} [friction]
 * @property {{min:number,max:number}} [scaleRange]
 * @property {React.ReactNode} [children]
 */

/**
 * Animated Bubble Particles Background
 * @param {AnimatedBubbleParticlesProps} props
 */
const AnimatedBubbleParticles = ({
  className,
  backgroundColor = "rgba(0, 0, 0, 0)",
  particleColor = "#ffffff",
  particleSize = 30,
  spawnInterval = 180,
  height = "100%",
  width = "100%",
  enableGooEffect = true,
  blurStrength = 12,
  pauseOnBlur = true,
  zIndex = 0,
  friction = { min: 1, max: 2 },
  scaleRange = { min: 0.4, max: 2.4 },
  children,
}) => {
  const containerRef = useRef(null);
  const particlesRef = useRef(null);
  const animationRef = useRef();
  const intervalRef = useRef();
  const particlesArrayRef = useRef([]);
  const isPausedRef = useRef(false);
  const gooIdRef = useRef("goo-" + Math.random().toString(36).substring(2, 11));

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const createParticleElement = useCallback(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.cssText = `
      display: block;
      width: ${particleSize}px;
      height: ${particleSize}px;
      position: absolute;
      transform: translateZ(0px);
      opacity: 0.4;
      filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
    `;
    svg.setAttribute("viewBox", "0 0 67.4 67.4");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", "33.7");
    circle.setAttribute("cy", "33.7");
    circle.setAttribute("r", "33.7");
    circle.setAttribute("fill", particleColor);

    svg.appendChild(circle);
    return svg;
  }, [particleSize, particleColor]);

  const createParticle = useCallback(() => {
    const element = createParticleElement();
    if (particlesRef.current) {
      particlesRef.current.appendChild(element);
    }

    const x = Math.random() * dimensions.width;
    const y = dimensions.height + 100;
    const steps = dimensions.height / 2;
    const frictionValue = friction.min + Math.random() * (friction.max - friction.min);
    const scale = scaleRange.min + Math.random() * (scaleRange.max - scaleRange.min);
    const siner = (dimensions.width / 2.5) * Math.random();
    const rotationDirection = Math.random() > 0.5 ? "+" : "-";

    element.style.transform = `translateX(${x}px) translateY(${y}px)`;

    return {
      x,
      y,
      vx: 0,
      vy: 0,
      scale,
      rotation: 0,
      rotationDirection,
      siner,
      steps,
      friction: frictionValue,
      element,
    };
  }, [createParticleElement, dimensions, friction, scaleRange]);

  const updateParticle = (particle) => {
    particle.y -= particle.friction;

    const left = particle.x + Math.sin((particle.y * Math.PI) / particle.steps) * particle.siner;
    const top = particle.y;
    const rotation = particle.rotationDirection + (particle.y + particleSize);

    if (particle.element) {
      particle.element.style.transform = `translateX(${left}px) translateY(${top}px) scale(${particle.scale}) rotate(${rotation}deg)`;
    }

    if (particle.y < -particleSize) {
      if (particle.element && particle.element.parentNode) {
        particle.element.parentNode.removeChild(particle.element);
      }
      return false;
    }

    return true;
  };

  const animate = useCallback(() => {
    if (isPausedRef.current) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    particlesArrayRef.current = particlesArrayRef.current.filter(updateParticle);
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  const spawnParticle = useCallback(() => {
    if (!isPausedRef.current && dimensions.width > 0 && dimensions.height > 0) {
      // Randomize initial position for more natural appearance
      const particle = createParticle();
      if (particle) {
        particle.y = Math.random() * dimensions.height;
        particlesArrayRef.current.push(particle);
      }
    }
  }, [dimensions, createParticle]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    if (!pauseOnBlur) return;
    const handleBlur = () => (isPausedRef.current = true);
    const handleFocus = () => (isPausedRef.current = false);

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [pauseOnBlur]);

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      // Start animation immediately
      animationRef.current = requestAnimationFrame(animate);
      
      // Spawn initial particles immediately
      for (let i = 0; i < 10; i++) {
        spawnParticle();
      }
      
      // Then continue with interval
      intervalRef.current = window.setInterval(spawnParticle, spawnInterval);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      particlesArrayRef.current.forEach((p) => {
        if (p.element && p.element.parentNode) {
          p.element.parentNode.removeChild(p.element);
        }
      });
      particlesArrayRef.current = [];
    };
  }, [dimensions, spawnInterval, animate, spawnParticle]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        className
      )}
      style={{ zIndex, width, height }}
    >
      <div
        ref={particlesRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ filter: enableGooEffect ? `url(#${gooIdRef.current})` : undefined }}
      />

      {enableGooEffect && (
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id={gooIdRef.current}>
              <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={blurStrength} />
              <feColorMatrix
                in="blur"
                result="colormatrix"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -9"
              />
              <feBlend in="SourceGraphic" in2="colormatrix" />
            </filter>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default AnimatedBubbleParticles;
