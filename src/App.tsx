export default function App() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-4)",
      }}
    >
      <h1
        style={{
          fontWeight: "var(--font-weight-light)" as unknown as number,
          letterSpacing: "var(--letter-spacing-wide)",
          textShadow: "var(--shadow-glow)",
        }}
      >
        Kokoro
      </h1>
    </main>
  );
}
