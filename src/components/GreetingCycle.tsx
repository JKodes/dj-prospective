import { useEffect, useState } from "react";

const greetings = [
  "Hello",
  "Hola",
  "Bonjour",
  "こんにちは",
  "Hallo",
  "Ciao",
  "Olá",
  "Hallo",
  "Hej",
  "Hei",
  "Halló",
  "Γεια σου",
  "Привет",
  "Привіт",
  "Cześć",
  "Ahoj",
  "مرحبا",
  "你好",
  "Kumusta",
  "Përshëndetje",
  "Dia dhuit",
  "Oi",
];

interface GreetingCycleProps {
  displayName: string;
}

export default function GreetingCycle({ displayName }: GreetingCycleProps) {
  const [greetingIndex, setGreetingIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGreetingIndex((current) => (current + 1) % greetings.length);
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <h2 className="cf-greeting">
      {greetings[greetingIndex]}, {displayName}
    </h2>
  );
}
