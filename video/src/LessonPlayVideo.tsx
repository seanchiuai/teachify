import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
  random,
} from "remotion";
import { colors, fonts, cardStyle, buttonStyle } from "./styles";

// Grid background pattern
const GridBackground: React.FC<{ opacity?: number }> = ({ opacity = 0.1 }) => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(${colors.paper300}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px),
          linear-gradient(90deg, ${colors.paper300}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
};

// Floating shapes background
const FloatingShapes: React.FC<{ seed?: string }> = ({ seed = "shapes" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const shapes = Array.from({ length: 12 }, (_, i) => {
    const x = random(`${seed}-x-${i}`) * width;
    const y = random(`${seed}-y-${i}`) * height;
    const size = 40 + random(`${seed}-size-${i}`) * 80;
    const speed = 0.01 + random(`${seed}-speed-${i}`) * 0.02;
    const rotationSpeed = 0.5 + random(`${seed}-rot-${i}`) * 1;
    const shapeType = Math.floor(random(`${seed}-type-${i}`) * 3);
    const color = [colors.yellow, colors.purple, colors.green, colors.blue, colors.pink][i % 5];

    const floatY = Math.sin(frame * speed + i) * 20;
    const rotation = frame * rotationSpeed;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y + floatY,
          width: size,
          height: size,
          backgroundColor: "transparent",
          border: `3px solid ${color}20`,
          borderRadius: shapeType === 0 ? "50%" : shapeType === 1 ? 8 : 0,
          transform: `rotate(${rotation}deg)`,
          opacity: 0.3,
        }}
      />
    );
  });

  return <>{shapes}</>;
};

// Confetti component
const Confetti: React.FC<{ count?: number; seed?: string; intensity?: number }> = ({
  count = 30,
  seed = "confetti",
  intensity = 1
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const confettiColors = [colors.yellow, colors.green, colors.pink, colors.blue, colors.purple, colors.orange];

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const startX = random(`${seed}-x-${i}`) * width;
        const speed = 6 + random(`${seed}-speed-${i}`) * 8;
        const wobbleSpeed = 0.08 + random(`${seed}-wobble-${i}`) * 0.1;
        const wobbleAmount = 20 + random(`${seed}-wobbleAmt-${i}`) * 40;
        const rotation = frame * (random(`${seed}-rot-${i}`) > 0.5 ? 5 : -5);
        const size = 8 + random(`${seed}-size-${i}`) * 14;
        const delay = random(`${seed}-delay-${i}`) * 40;

        const y = ((frame - delay) * speed * intensity) % (height + 400) - 200;
        const x = startX + Math.sin((frame - delay) * wobbleSpeed) * wobbleAmount;

        const isRect = random(`${seed}-shape-${i}`) > 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: isRect ? size * 0.5 : size,
              height: isRect ? size * 1.4 : size,
              backgroundColor: confettiColors[i % confettiColors.length],
              borderRadius: isRect ? 2 : size / 2,
              transform: `rotate(${rotation}deg)`,
              opacity: 0.85,
            }}
          />
        );
      })}
    </>
  );
};

// Animated counter component
const AnimatedCounter: React.FC<{ value: number; duration?: number; prefix?: string; suffix?: string }> = ({
  value,
  duration = 30,
  prefix = "",
  suffix = ""
}) => {
  const frame = useCurrentFrame();
  const progress = Math.min(frame / duration, 1);
  const eased = 1 - Math.pow(1 - progress, 3);
  const currentValue = Math.round(value * eased);

  return (
    <span style={{ fontFamily: fonts.mono, fontWeight: 700 }}>
      {prefix}{currentValue.toLocaleString()}{suffix}
    </span>
  );
};

// Progress bar component
const ProgressBar: React.FC<{ progress: number; color?: string; height?: number }> = ({
  progress,
  color = colors.green,
  height = 8
}) => {
  return (
    <div
      style={{
        width: "100%",
        height,
        backgroundColor: colors.paper200,
        borderRadius: height / 2,
        overflow: "hidden",
        border: `2px solid ${colors.paper300}`,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(100, Math.max(0, progress))}%`,
          backgroundColor: color,
          borderRadius: height / 2,
        }}
      />
    </div>
  );
};

// Pill badge component
const PillBadge: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = colors.purple }) => {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 16,
        padding: "20px 40px",
        backgroundColor: `${color}20`,
        border: `4px solid ${color}`,
        borderRadius: 100,
        fontFamily: fonts.display,
        fontSize: 44,
        fontWeight: 600,
        color: colors.paper900,
      }}
    >
      {children}
    </span>
  );
};

// Scene 1: Hook
const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const boringScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 150 } });
  const crossScale = spring({ frame: frame - 50, fps, config: { damping: 10, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.08} />
      <FloatingShapes seed="hook" />

      <div style={{ position: "relative", textAlign: "center" }}>
        {/* Decorative elements */}
        <div style={{
          position: "absolute",
          top: -80,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 20,
        }}>
          <PillBadge color={colors.pink}>😴 Bored students?</PillBadge>
          <PillBadge color={colors.orange}>📉 Low engagement?</PillBadge>
        </div>

        <h1
          style={{
            fontFamily: fonts.display,
            fontSize: 140,
            fontWeight: 700,
            color: colors.paper900,
            transform: `scale(${textScale})`,
            lineHeight: 1.1,
          }}
        >
          Tired of{" "}
          <span style={{
            color: colors.pink,
            position: "relative",
            display: "inline-block",
            transform: `scale(${boringScale})`,
          }}>
            boring
            <svg
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: `translate(-50%, -50%) scale(${crossScale}) rotate(-3deg)`,
              }}
              width="320"
              height="100"
              viewBox="0 0 320 100"
            >
              <line x1="0" y1="50" x2="320" y2="50" stroke={colors.pink} strokeWidth="14" strokeLinecap="round" />
            </svg>
          </span>
          <br />
          <span style={{
            display: "inline-block",
            transform: `scale(${spring({ frame: frame - 8, fps, config: { damping: 15, stiffness: 120 } })})`,
          }}>
            lectures?
          </span>
        </h1>

        {frame > 60 && (
          <div style={{
            marginTop: 40,
            fontSize: 70,
            transform: `scale(${spring({ frame: frame - 60, fps, config: { damping: 12, stiffness: 150 } })})`,
            display: "flex",
            justifyContent: "center",
            gap: 20,
          }}>
            <span>😴</span>
            <span>💤</span>
            <span>📱</span>
          </div>
        )}

        {/* Bottom stat */}
        <div style={{
          position: "absolute",
          bottom: -180,
          left: "50%",
          transform: "translateX(-50%)",
          ...cardStyle("pink"),
          padding: "24px 48px",
          opacity: frame > 40 ? 1 : 0,
        }}>
          <span style={{ fontFamily: fonts.display, fontSize: 44 }}>
            67% of students feel disengaged in class
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: Solution intro
const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const textScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.06} />
      <Confetti count={25} seed="solution" intensity={0.4} />

      <div style={{ textAlign: "center" }}>
        {/* NEW badge */}
        <div style={{
          marginBottom: 20,
          transform: `scale(${spring({ frame: frame - 5, fps, config: { damping: 14 } })})`,
        }}>
          <PillBadge color={colors.green}>✨ Introducing</PillBadge>
        </div>

        {/* Logo */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 36,
            transform: `scale(${logoScale})`,
            marginBottom: 50,
          }}
        >
          <div
            style={{
              width: 160,
              height: 160,
              backgroundColor: colors.yellow,
              borderRadius: 32,
              border: `6px solid ${colors.paper900}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `8px 8px 0px ${colors.paper900}`,
            }}
          >
            <span style={{ fontSize: 100 }}>🎓</span>
          </div>
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: 130,
              fontWeight: 700,
              color: colors.paper900,
            }}
          >
            LessonPlay
          </span>
        </div>

        <p
          style={{
            fontFamily: fonts.display,
            fontSize: 72,
            color: colors.paper600,
            transform: `scale(${textScale})`,
            marginBottom: 50,
          }}
        >
          Transform lessons into{" "}
          <span style={{ color: colors.purple, fontWeight: 700 }}>epic games</span>
          {" "}✨🎮
        </p>

        {/* Feature pills */}
        <div style={{
          display: "flex",
          gap: 28,
          justifyContent: "center",
          transform: `translateY(${(1 - spring({ frame: frame - 35, fps, config: { damping: 14 } })) * 30}px)`,
          opacity: spring({ frame: frame - 35, fps, config: { damping: 14 } }),
        }}>
          <div style={{ ...cardStyle("yellow"), padding: "24px 40px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>⚡ 60 second setup</span>
          </div>
          <div style={{ ...cardStyle("green"), padding: "24px 40px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>🤖 AI-powered</span>
          </div>
          <div style={{ ...cardStyle("blue"), padding: "24px 40px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>📊 Real-time analytics</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: Upload UI
const UploadScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardPop = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const fileDrop = spring({ frame: frame - 20, fps, config: { damping: 10, stiffness: 160 } });
  const progressWidth = interpolate(frame, [35, 75], [0, 100], { extrapolateRight: "clamp" });
  const checkPop = spring({ frame: frame - 80, fps, config: { damping: 10, stiffness: 180 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.06} />
      <FloatingShapes seed="upload" />

      {/* Step indicator */}
      <div style={{
        position: "absolute",
        top: 100,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 24,
        alignItems: "center",
      }}>
        <div style={{ ...cardStyle("yellow"), padding: "18px 36px" }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 40, fontWeight: 700 }}>Step 1</span>
        </div>
        <div style={{ width: 60, height: 6, backgroundColor: colors.paper300, borderRadius: 3 }} />
        <div style={{ ...cardStyle("default"), padding: "18px 36px", opacity: 0.5 }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 40 }}>Step 2</span>
        </div>
        <div style={{ width: 60, height: 6, backgroundColor: colors.paper300, borderRadius: 3 }} />
        <div style={{ ...cardStyle("default"), padding: "18px 36px", opacity: 0.5 }}>
          <span style={{ fontFamily: fonts.mono, fontSize: 40 }}>Step 3</span>
        </div>
      </div>

      <div
        style={{
          ...cardStyle("default"),
          padding: 70,
          width: 950,
          transform: `scale(${cardPop})`,
        }}
      >
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 72,
            fontWeight: 700,
            color: colors.paper900,
            marginBottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <span>📤</span>
          Upload Your Lesson
        </h2>

        {/* Supported formats */}
        <div style={{ display: "flex", gap: 18, marginBottom: 32 }}>
          {["PDF", "PPTX", "DOCX", "Pages"].map((format, i) => (
            <span
              key={format}
              style={{
                padding: "14px 24px",
                backgroundColor: colors.paper200,
                borderRadius: 10,
                fontFamily: fonts.mono,
                fontSize: 32,
                color: colors.paper600,
              }}
            >
              .{format.toLowerCase()}
            </span>
          ))}
        </div>

        <div
          style={{
            border: `5px dashed ${colors.blue}`,
            borderRadius: 24,
            padding: 50,
            textAlign: "center",
            backgroundColor: colors.paper50,
          }}
        >
          <div
            style={{
              transform: `scale(${fileDrop}) translateY(${(1 - fileDrop) * -40}px)`,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 24,
                ...cardStyle("blue"),
                padding: "28px 48px",
              }}
            >
              <span style={{ fontSize: 72 }}>📄</span>
              <div style={{ textAlign: "left" }}>
                <span style={{ fontFamily: fonts.mono, fontSize: 44, color: colors.paper900, display: "block" }}>
                  photosynthesis-lesson.pdf
                </span>
                <span style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.paper500 }}>
                  2.4 MB
                </span>
              </div>
            </div>
          </div>

          <ProgressBar progress={progressWidth} color={colors.green} height={24} />

          <div style={{ marginTop: 24, fontFamily: fonts.mono, fontSize: 38, color: colors.paper500 }}>
            {progressWidth < 100 ? `Parsing content... ${Math.round(progressWidth)}%` : ""}
          </div>

          {frame > 80 && (
            <div style={{
              marginTop: 28,
              transform: `scale(${checkPop})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}>
              <span style={{ fontSize: 60 }}>✅</span>
              <span style={{ fontFamily: fonts.display, fontSize: 48, fontWeight: 600, color: colors.green }}>
                Ready to generate!
              </span>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: AI Magic Generation
const AIGenerationScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pulseScale = 1 + Math.sin(frame * 0.25) * 0.06;
  const rotation = frame * 1.2;
  const progressDots = Math.floor(frame / 12) % 4;

  // Orbiting particles - smoother
  const orbitParticles = Array.from({ length: 12 }, (_, i) => {
    const orbitSpeed = 0.05 + (i % 3) * 0.015;
    const angle = (i / 12) * Math.PI * 2 + frame * orbitSpeed;
    const radius = 120 + (i % 3) * 40;
    const particleScale = spring({ frame: frame - i * 3, fps, config: { damping: 14, stiffness: 100 } });

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      scale: particleScale,
      color: [colors.yellow, colors.purple, colors.green, colors.blue, colors.pink][i % 5],
      size: 14 + (i % 3) * 8,
    };
  });

  const emojis = ["🧠", "💡", "⚡", "🎯", "✨", "🚀"];
  const currentEmoji = emojis[Math.floor(frame / 25) % emojis.length];

  // Generation steps
  const steps = [
    { text: "Analyzing content", done: frame > 30 },
    { text: "Identifying key concepts", done: frame > 60 },
    { text: "Generating questions", done: frame > 90 },
    { text: "Building game", done: frame > 120 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper900, justifyContent: "center", alignItems: "center" }}>
      {/* Background glow */}
      <div style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${colors.purple}30 0%, transparent 70%)`,
        transform: `scale(${pulseScale * 1.3})`,
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(${colors.purple}10 1px, transparent 1px),
          linear-gradient(90deg, ${colors.purple}10 1px, transparent 1px)
        `,
        backgroundSize: "80px 80px",
      }} />

      {/* Orbit particles */}
      {orbitParticles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            transform: `translate(${p.x - p.size/2}px, ${p.y - p.size/2}px) scale(${p.scale})`,
            boxShadow: `0 0 30px ${p.color}80`,
          }}
        />
      ))}

      {/* Central icon */}
      <div
        style={{
          ...cardStyle("purple"),
          width: 160,
          height: 160,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${pulseScale}) rotate(${rotation}deg)`,
          boxShadow: `0 0 100px ${colors.purple}80`,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 80, transform: `rotate(-${rotation}deg)` }}>{currentEmoji}</span>
      </div>

      {/* Progress steps - left side */}
      <div style={{
        position: "absolute",
        left: 150,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              opacity: frame > i * 30 ? 1 : 0.3,
              transform: `translateX(${frame > i * 30 ? 0 : -20}px)`,
              transition: "all 0.3s",
            }}
          >
            <div style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              backgroundColor: step.done ? colors.green : colors.paper600,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 36,
              fontWeight: 700,
              color: step.done ? colors.paper900 : colors.paper400,
            }}>
              {step.done ? "✓" : i + 1}
            </div>
            <span style={{
              fontFamily: fonts.display,
              fontSize: 44,
              color: step.done ? colors.green : colors.paper400,
            }}>
              {step.text}
            </span>
          </div>
        ))}
      </div>

      {/* Stats - right side */}
      <div style={{
        position: "absolute",
        right: 150,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 36,
      }}>
        <div style={{ ...cardStyle("yellow"), padding: "32px 48px" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.paper600 }}>Questions</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 80, fontWeight: 700, color: colors.paper900 }}>
            <AnimatedCounter value={10} duration={90} />
          </div>
        </div>
        <div style={{ ...cardStyle("green"), padding: "32px 48px" }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 36, color: colors.paper600 }}>Topics</div>
          <div style={{ fontFamily: fonts.mono, fontSize: 80, fontWeight: 700, color: colors.paper900 }}>
            <AnimatedCounter value={4} duration={60} />
          </div>
        </div>
      </div>

      {/* Text */}
      <div style={{ position: "absolute", bottom: 140, textAlign: "center", zIndex: 10 }}>
        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 100,
            fontWeight: 700,
            color: colors.paper50,
            marginBottom: 20,
            textShadow: `0 0 50px ${colors.purple}`,
          }}
        >
          AI Magic{".".repeat(progressDots)}
        </h2>
        <p style={{ fontFamily: fonts.mono, fontSize: 48, color: colors.purple }}>
          Creating pedagogically-grounded questions 🎮
        </p>
      </div>

      <Confetti count={12} seed="ai-magic" intensity={0.5} />
    </AbsoluteFill>
  );
};

// Scene 5: Game Ready with Code
const GameReadyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeChars = "ABC123".split("");
  const titlePop = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.06} />
      <Confetti count={40} seed="game-ready" intensity={0.8} />

      <div style={{ textAlign: "center", zIndex: 10 }}>
        {/* Success badge */}
        <div style={{
          marginBottom: 20,
          transform: `scale(${spring({ frame, fps, config: { damping: 14 } })})`,
        }}>
          <PillBadge color={colors.green}>✅ Generation Complete!</PillBadge>
        </div>

        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 100,
            fontWeight: 700,
            color: colors.paper900,
            marginBottom: 48,
            transform: `scale(${titlePop})`,
          }}
        >
          🎉 Your Game is Ready! 🎉
        </h2>

        {/* Game code display */}
        <div style={{
          marginBottom: 40,
        }}>
          <p style={{ fontFamily: fonts.display, fontSize: 48, color: colors.paper500, marginBottom: 28 }}>
            Share this code with your students:
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
            {codeChars.map((char, i) => {
              const charScale = spring({
                frame: frame - i * 5,
                fps,
                config: { damping: 10, stiffness: 180 },
              });

              return (
                <div
                  key={i}
                  style={{
                    ...cardStyle("yellow"),
                    width: 140,
                    height: 170,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    transform: `scale(${charScale})`,
                    boxShadow: `8px 8px 0px ${colors.paper900}`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: 90,
                      fontWeight: 700,
                      color: colors.paper900,
                    }}
                  >
                    {char}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game info cards */}
        <div style={{
          display: "flex",
          gap: 28,
          justifyContent: "center",
          transform: `translateY(${(1 - spring({ frame: frame - 40, fps, config: { damping: 14 } })) * 30}px)`,
          opacity: spring({ frame: frame - 40, fps, config: { damping: 14 } }),
        }}>
          <div style={{ ...cardStyle("purple"), padding: "26px 48px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>🎯 10 Questions</span>
          </div>
          <div style={{ ...cardStyle("blue"), padding: "26px 48px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>⏱️ ~5 minutes</span>
          </div>
          <div style={{ ...cardStyle("green"), padding: "26px 48px" }}>
            <span style={{ fontFamily: fonts.display, fontSize: 44 }}>🌱 Photosynthesis</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Students Joining
const StudentsJoiningScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const students = [
    { name: "Emma", emoji: "👧", score: 0 },
    { name: "Liam", emoji: "👦", score: 0 },
    { name: "Sophia", emoji: "👩", score: 0 },
    { name: "Noah", emoji: "🧑", score: 0 },
    { name: "Olivia", emoji: "👱‍♀️", score: 0 },
    { name: "Aiden", emoji: "👨", score: 0 },
  ];

  const visibleCount = students.filter((_, i) => frame > i * 10 + 8).length;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.06} />
      <FloatingShapes seed="joining" />

      {/* Live indicator */}
      <div style={{
        position: "absolute",
        top: 100,
        right: 120,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: colors.green,
          boxShadow: `0 0 20px ${colors.green}`,
        }} />
        <span style={{ fontFamily: fonts.mono, fontSize: 44, color: colors.green, fontWeight: 600 }}>
          LIVE
        </span>
      </div>

      <div style={{ display: "flex", gap: 100, alignItems: "flex-start" }}>
        {/* Game code reminder */}
        <div style={{
          ...cardStyle("yellow"),
          padding: 50,
          textAlign: "center",
        }}>
          <p style={{ fontFamily: fonts.display, fontSize: 40, color: colors.paper600, marginBottom: 24 }}>
            Join at lessonplay.io
          </p>
          <div style={{ fontFamily: fonts.mono, fontSize: 90, fontWeight: 700, color: colors.paper900 }}>
            ABC123
          </div>
        </div>

        {/* Player list */}
        <div
          style={{
            ...cardStyle("default"),
            padding: 50,
            width: 620,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: fonts.display, fontSize: 56, fontWeight: 700, color: colors.paper900 }}>
              🎮 Lobby
            </h2>
            <div style={{ ...cardStyle("green"), padding: "18px 32px" }}>
              <span style={{ fontFamily: fonts.mono, fontSize: 44, fontWeight: 700 }}>
                {visibleCount}/{students.length}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {students.map((student, i) => {
              const delay = i * 10;
              const isVisible = frame > delay;
              const popScale = spring({
                frame: frame - delay,
                fps,
                config: { damping: 12, stiffness: 180 },
              });

              return (
                <div
                  key={i}
                  style={{
                    ...cardStyle(isVisible ? "green" : "default"),
                    padding: "22px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    transform: `scale(${isVisible ? popScale : 0})`,
                    opacity: isVisible ? 1 : 0,
                  }}
                >
                  <span style={{ fontSize: 56 }}>{student.emoji}</span>
                  <span style={{ fontFamily: fonts.display, fontSize: 44, fontWeight: 600, color: colors.paper900, flex: 1 }}>
                    {student.name}
                  </span>
                  {isVisible && <span style={{ fontSize: 46 }}>✅</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start button hint */}
      {visibleCount >= 4 && (
        <div style={{
          position: "absolute",
          bottom: 120,
          ...cardStyle("purple"),
          padding: "28px 56px",
          transform: `scale(${spring({ frame: frame - 50, fps, config: { damping: 14 } })})`,
        }}>
          <span style={{ fontFamily: fonts.display, fontSize: 50, fontWeight: 600 }}>
            Ready to start! 🚀
          </span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// Scene 7: Game in Action
const GameInActionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questionPop = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const selectedOption = frame > 50 ? 1 : -1;
  const correctReveal = frame > 80;
  const celebrateScale = spring({ frame: frame - 80, fps, config: { damping: 10, stiffness: 150 } });

  const options = ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"];
  const timerValue = Math.max(0, 15 - Math.floor(frame / 8));

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, padding: 50 }}>
      <GridBackground opacity={0.04} />
      {correctReveal && <Confetti count={30} seed="correct" intensity={0.7} />}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ ...cardStyle("purple"), padding: "22px 40px" }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 48, fontWeight: 700, color: colors.paper900 }}>
              Question 3 / 10
            </span>
          </div>
          <PillBadge color={colors.green}>🌱 Photosynthesis</PillBadge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{
            ...cardStyle(timerValue < 5 ? "pink" : "default"),
            padding: "22px 40px",
          }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 52, fontWeight: 700 }}>⏱️ {timerValue}s</span>
          </div>
          <div style={{ ...cardStyle("yellow"), padding: "22px 40px" }}>
            <span style={{ fontFamily: fonts.mono, fontSize: 48 }}>🏆 2,450 pts</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div
        style={{
          ...cardStyle("blue"),
          padding: 60,
          marginBottom: 44,
          transform: `scale(${questionPop})`,
        }}
      >
        <h2 style={{ fontFamily: fonts.display, fontSize: 72, fontWeight: 700, color: colors.paper900, textAlign: "center" }}>
          🌱 What gas do plants release during photosynthesis?
        </h2>
      </div>

      {/* Options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {options.map((option, i) => {
          const isSelected = selectedOption === i;
          const isCorrect = i === 1;
          const showCorrect = correctReveal && isCorrect;
          const optionScale = spring({ frame: frame - 12 - i * 5, fps, config: { damping: 12, stiffness: 140 } });

          let variant: "default" | "yellow" | "green" = "default";
          if (showCorrect) variant = "green";
          else if (isSelected) variant = "yellow";

          return (
            <div
              key={i}
              style={{
                ...cardStyle(variant),
                padding: 40,
                display: "flex",
                alignItems: "center",
                gap: 28,
                transform: `scale(${optionScale}) ${showCorrect ? `scale(${celebrateScale})` : ""}`,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 20,
                  backgroundColor: showCorrect ? colors.green : isSelected ? colors.yellow : colors.paper200,
                  border: `5px solid ${colors.paper900}`,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: fonts.mono,
                  fontSize: 50,
                  fontWeight: 700,
                }}
              >
                {showCorrect ? "✓" : String.fromCharCode(65 + i)}
              </div>
              <span style={{ fontFamily: fonts.display, fontSize: 50, fontWeight: 600, color: colors.paper900 }}>
                {option}
              </span>
              {showCorrect && <span style={{ marginLeft: "auto", fontSize: 60 }}>🎉</span>}
            </div>
          );
        })}
      </div>

      {/* Response counter */}
      <div style={{
        position: "absolute",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        ...cardStyle("default"),
        padding: "20px 48px",
      }}>
        <span style={{ fontFamily: fonts.mono, fontSize: 40, color: colors.paper600 }}>
          Responses: {frame > 50 ? "6/6" : `${Math.min(6, Math.floor(frame / 10))}/6`}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// Scene 8: Leaderboard
const LeaderboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const players = [
    { name: "Emma", score: 4850, emoji: "👧" },
    { name: "Noah", score: 4200, emoji: "🧑" },
    { name: "Sophia", score: 3950, emoji: "👩" },
    { name: "Liam", score: 3400, emoji: "👦" },
    { name: "Olivia", score: 2900, emoji: "👱‍♀️" },
  ];

  const rankEmojis = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper100, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.06} />
      <Confetti count={35} seed="leaderboard" intensity={0.6} />

      <div style={{ display: "flex", gap: 100, alignItems: "center", zIndex: 10 }}>
        {/* Leaderboard */}
        <div style={{ textAlign: "center", width: 600 }}>
          <h2
            style={{
              fontFamily: fonts.display,
              fontSize: 120,
              fontWeight: 700,
              color: colors.paper900,
              marginBottom: 50,
              transform: `scale(${spring({ frame, fps, config: { damping: 12, stiffness: 130 } })})`,
            }}
          >
            🏆 Final Results 🏆
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {players.map((player, i) => {
              const slideScale = spring({
                frame: frame - i * 8,
                fps,
                config: { damping: 12, stiffness: 160 },
              });
              const isTop3 = i < 3;

              return (
                <div
                  key={i}
                  style={{
                    ...cardStyle(isTop3 ? "yellow" : "default"),
                    padding: "32px 48px",
                    display: "flex",
                    alignItems: "center",
                    transform: `scale(${slideScale})`,
                    boxShadow: isTop3 ? `6px 6px 0px ${colors.paper900}` : undefined,
                  }}
                >
                  <span style={{ fontSize: 72, marginRight: 32 }}>{rankEmojis[i]}</span>
                  <span style={{ fontSize: 60, marginRight: 28 }}>{player.emoji}</span>
                  <span style={{ fontFamily: fonts.display, fontSize: 52, fontWeight: 600, color: colors.paper900, flex: 1, textAlign: "left" }}>
                    {player.name}
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontSize: 56, fontWeight: 700, color: colors.purple }}>
                    {player.score.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats summary */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          transform: `translateX(${(1 - spring({ frame: frame - 20, fps, config: { damping: 14 } })) * 50}px)`,
          opacity: spring({ frame: frame - 20, fps, config: { damping: 14 } }),
        }}>
          <div style={{ ...cardStyle("green"), padding: "36px 56px" }}>
            <div style={{ fontFamily: fonts.display, fontSize: 40, color: colors.paper600 }}>Class Average</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 80, fontWeight: 700, color: colors.paper900 }}>78%</div>
          </div>
          <div style={{ ...cardStyle("blue"), padding: "36px 56px" }}>
            <div style={{ fontFamily: fonts.display, fontSize: 40, color: colors.paper600 }}>Engagement</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 80, fontWeight: 700, color: colors.paper900 }}>100%</div>
          </div>
          <div style={{ ...cardStyle("purple"), padding: "36px 56px" }}>
            <div style={{ fontFamily: fonts.display, fontSize: 40, color: colors.paper600 }}>Time</div>
            <div style={{ fontFamily: fonts.mono, fontSize: 80, fontWeight: 700, color: colors.paper900 }}>4:32</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scene 9: CTA
const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const textScale = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 120 } });
  const buttonScale = spring({ frame: frame - 35, fps, config: { damping: 10, stiffness: 160 } });

  return (
    <AbsoluteFill style={{ backgroundColor: colors.yellow, justifyContent: "center", alignItems: "center" }}>
      <GridBackground opacity={0.08} />
      <Confetti count={30} seed="cta" intensity={0.5} />
      <FloatingShapes seed="cta" />

      <div style={{ textAlign: "center", zIndex: 10 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            transform: `scale(${logoScale})`,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 180,
              height: 180,
              backgroundColor: colors.paper50,
              borderRadius: 36,
              border: `6px solid ${colors.paper900}`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: `10px 10px 0px ${colors.paper900}`,
            }}
          >
            <span style={{ fontSize: 110 }}>🎓</span>
          </div>
          <span style={{ fontFamily: fonts.display, fontSize: 140, fontWeight: 700, color: colors.paper900 }}>
            LessonPlay
          </span>
        </div>

        <h2
          style={{
            fontFamily: fonts.display,
            fontSize: 100,
            fontWeight: 700,
            color: colors.paper900,
            marginBottom: 36,
            transform: `scale(${textScale})`,
          }}
        >
          Make learning <span style={{ color: colors.purple }}>unforgettable</span> ✨
        </h2>

        {/* Social proof */}
        <div style={{
          display: "flex",
          gap: 28,
          justifyContent: "center",
          marginBottom: 48,
          transform: `translateY(${(1 - spring({ frame: frame - 25, fps, config: { damping: 14 } })) * 20}px)`,
          opacity: spring({ frame: frame - 25, fps, config: { damping: 14 } }),
        }}>
          <div style={{ ...cardStyle("default"), padding: "28px 44px", backgroundColor: colors.paper50 }}>
            <span style={{ fontFamily: fonts.display, fontSize: 48 }}>⭐ 4.9/5 rating</span>
          </div>
          <div style={{ ...cardStyle("default"), padding: "28px 44px", backgroundColor: colors.paper50 }}>
            <span style={{ fontFamily: fonts.display, fontSize: 48 }}>🎮 50K+ games created</span>
          </div>
          <div style={{ ...cardStyle("default"), padding: "28px 44px", backgroundColor: colors.paper50 }}>
            <span style={{ fontFamily: fonts.display, fontSize: 48 }}>👨‍🏫 10K+ teachers</span>
          </div>
        </div>

        <div style={{ transform: `scale(${buttonScale})` }}>
          <div
            style={{
              ...buttonStyle("purple"),
              display: "inline-block",
              fontSize: 72,
              padding: "36px 100px",
              boxShadow: `10px 10px 0px ${colors.paper900}`,
            }}
          >
            Try Free Today 🚀
          </div>
        </div>

        {/* URL */}
        <p style={{
          fontFamily: fonts.mono,
          fontSize: 56,
          color: colors.paper600,
          marginTop: 48,
          opacity: spring({ frame: frame - 50, fps, config: { damping: 14 } }),
        }}>
          lessonplay.io
        </p>
      </div>
    </AbsoluteFill>
  );
};

// Main Video Composition
export const LessonPlayVideo: React.FC = () => {
  // ~26 seconds total at 60fps = 1560 frames

  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>
      <Sequence from={150} durationInFrames={150}>
        <SolutionScene />
      </Sequence>
      <Sequence from={300} durationInFrames={140}>
        <UploadScene />
      </Sequence>
      <Sequence from={440} durationInFrames={220}>
        <AIGenerationScene />
      </Sequence>
      <Sequence from={660} durationInFrames={170}>
        <GameReadyScene />
      </Sequence>
      <Sequence from={830} durationInFrames={150}>
        <StudentsJoiningScene />
      </Sequence>
      <Sequence from={980} durationInFrames={200}>
        <GameInActionScene />
      </Sequence>
      <Sequence from={1180} durationInFrames={160}>
        <LeaderboardScene />
      </Sequence>
      <Sequence from={1340} durationInFrames={220}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
