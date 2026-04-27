import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig, staticFile } from "remotion";

export const ScreenSlide: React.FC<{
  title: string;
  description: string;
  imagePath: string;
  originalWidth: number;
  originalHeight: number;
  scrollStartPercent?: number;
  scrollEndPercent?: number;
  index: number;
  total: number;
}> = ({ title, description, imagePath, originalWidth, originalHeight, scrollStartPercent = 0, scrollEndPercent = 10, index, total }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animation values
  const textOpacity = interpolate(frame, [0, 15], [0, 1]);
  const textY = interpolate(frame, [0, 15], [20, 0]);

  const scale = spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 20 },
  });

  const zoomScale = interpolate(scale, [0, 1], [0.95, 1]);
  
  // Calculate pixel offsets based on the target percentages
  const startPx = -(originalHeight * (scrollStartPercent / 100));
  const endPx = -(originalHeight * (scrollEndPercent / 100));
  
  // Smoothly pan from start to end over the duration of the slide
  const beamY = interpolate(frame % (fps * 3), [0, fps * 1.5], [-10, 110], { extrapolateRight: "clamp" });
  const beamOpacity = interpolate(frame % (fps * 3), [0, 10, fps * 1.4, fps * 1.5], [0, 0.6, 0.6, 0], { extrapolateRight: "clamp" });

  const flashlightX = interpolate(frame, [0, fps * 4], [20, 80]);
  const flashlightY = interpolate(frame, [0, fps * 4], [30, 70]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#031427" }}>
      {/* Background/Image */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "80%",
          height: "80%",
          overflow: "hidden",
          borderRadius: "20px",
          transform: `scale(${zoomScale})`,
          boxShadow: "0 0 40px rgba(0, 229, 255, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative"
        }}>
          <div style={{ transform: `translateY(${scrollY}px)` }}>
            <Img 
              src={staticFile(imagePath.replace("/public/", "/").replace("/assets/", "assets/"))} 
              style={{ 
                width: "100%", 
                height: "auto",
                objectFit: "cover"
              }} 
            />
          </div>

          {/* Flashlight Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `radial-gradient(400px circle at ${flashlightX}% ${flashlightY}%, rgba(0, 229, 255, 0.15), transparent 70%)`,
            zIndex: 2
          }} />

          {/* Scanning Beam */}
          <div style={{
            position: "absolute",
            top: `${beamY}%`,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, transparent, #00E5FF, transparent)",
            boxShadow: "0 0 15px #00E5FF, 0 0 30px #00E5FF",
            opacity: beamOpacity,
            zIndex: 3
          }} />
        </div>
      </AbsoluteFill>

      {/* Overlays */}
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "60px" }}>
        <div style={{ 
          opacity: textOpacity, 
          transform: `translateY(${textY}px)`,
          backgroundColor: "rgba(3, 20, 39, 0.8)",
          backdropFilter: "blur(20px)",
          padding: "30px",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "400px"
        }}>
          <div style={{ 
            color: "#00E5FF", 
            fontFamily: "Inter, sans-serif", 
            fontSize: "14px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "10px",
            fontWeight: "bold"
          }}>
            Step {index + 1} of {total}
          </div>
          <h2 style={{ 
            margin: "0 0 10px 0", 
            fontFamily: "Noto Serif, serif", 
            color: "#d3e4fe",
            fontSize: "36px"
          }}>
            {title}
          </h2>
          <p style={{ 
            margin: 0, 
            fontFamily: "Inter, sans-serif", 
            color: "#c6c6cd",
            fontSize: "18px",
            lineHeight: "1.5"
          }}>
            {description}
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
