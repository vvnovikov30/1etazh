"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Textarea } from "@/components/Textarea";
import { PhoneInput } from "@/components/PhoneInput";
import { isValidRuPhoneDigits } from "@/lib/phone";

type FormStatus = "idle" | "success" | "error";

export function LeadForm() {
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [phoneFormatted, setPhoneFormatted] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setError("");

    // Валидация телефона
    if (phoneDigits && !isValidRuPhoneDigits(phoneDigits)) {
      setError("Введите номер в формате +7(XXX) XXX-XX-XX");
      setStatus("error");
      return;
    }

    // Проверка наличия контакта
    if (!phoneDigits && !email) {
      setError("Укажите телефон или email.");
      setStatus("error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/telegram/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone: phoneDigits ? `+7${phoneDigits}` : "",
          phoneFormatted,
          email,
          comment,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Не удалось отправить заявку.");
      }

      setStatus("success");
      setName("");
      setPhoneDigits("");
      setPhoneFormatted("");
      setEmail("");
      setComment("");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Ошибка отправки.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-4 grid gap-4" onSubmit={onSubmit}>
      <Input placeholder="Имя" value={name} onChange={(event) => setName(event.target.value)} />
      <PhoneInput
        value={phoneDigits}
        onChange={(digits, formatted) => {
          setPhoneDigits(digits);
          setPhoneFormatted(formatted);
        }}
        error={status === "error" && error.includes("телефон") ? error : undefined}
      />
      <Input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="email"
      />
      <Textarea
        placeholder="Комментарий"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      <Button
        as="button"
        type="submit"
        disabled={isSubmitting || (!!phoneDigits && !isValidRuPhoneDigits(phoneDigits))}
      >
        {isSubmitting ? "Отправляем..." : "Отправить"}
      </Button>
      {status === "success" && (
        <p className="text-sm text-[var(--color-text)]/80">Заявка отправлена. Скоро свяжемся с вами.</p>
      )}
      {status === "error" && !error.includes("телефон") && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
