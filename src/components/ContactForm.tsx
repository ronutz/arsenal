"use client";

// ============================================================================
// src/components/ContactForm.tsx
// ----------------------------------------------------------------------------
// CONTACT FORM — a client component for reaching Rodolfo.
//
// HOW IT SUBMITS (config-driven, see config/contact.ts):
//   - If `contactFormEndpoint()` returns a URL  -> POST the form as JSON there.
//   - If it returns null (the static-site case) -> compose a mailto: in the
//     visitor's own mail client (their email app opens pre-filled). Nothing is
//     sent to any third party; the visitor sends it themselves. Privacy-first.
//
// This keeps the form working today AND ready for the service layer later: when
// an endpoint is configured (e.g. from the admin panel), the same form starts
// POSTing with no code change here.
//
// Fields: name, email, topic (select), message. Light client-side validation
// and a success state. No external form library, no tracking.
// ============================================================================

import { useState, type FormEvent } from "react";
import { contactEmail, contactFormEndpoint } from "@/config/contact";

interface ContactFormCopy {
  name: string;
  email: string;
  topic: string;
  topicTraining: string;
  topicCustom: string;
  topicAdvisory: string;
  topicOther: string;
  message: string;
  send: string;
  sending: string;
  successTitle: string;
  successBody: string;
  errorBody: string;
  required: string;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm({ copy }: { copy: ContactFormCopy }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(copy.topicTraining);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [touched, setTouched] = useState(false);

  const valid = name.trim() && email.trim() && message.trim();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;

    const endpoint = contactFormEndpoint();

    // Path 1: a real endpoint is configured -> POST there.
    if (endpoint) {
      setStatus("sending");
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, topic, message }),
        });
        setStatus(res.ok ? "sent" : "error");
      } catch {
        setStatus("error");
      }
      return;
    }

    // Path 2: no backend (static site) -> compose a mailto in the user's client.
    const subject = encodeURIComponent(`[${topic}] ${name}`);
    const body = encodeURIComponent(
      `${message}\n\n---\nFrom: ${name}\nReply to: ${email}\nTopic: ${topic}`
    );
    window.location.href = `mailto:${contactEmail()}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  // Success state replaces the form.
  if (status === "sent") {
    return (
      <div className="contact-success" role="status">
        <p className="contact-success-title">{copy.successTitle}</p>
        <p className="contact-success-body">{copy.successBody}</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-field">
        <label htmlFor="cf-name" className="contact-label">
          {copy.name}
        </label>
        <input
          id="cf-name"
          type="text"
          className="contact-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className="contact-field">
        <label htmlFor="cf-email" className="contact-label">
          {copy.email}
        </label>
        <input
          id="cf-email"
          type="email"
          className="contact-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="contact-field">
        <label htmlFor="cf-topic" className="contact-label">
          {copy.topic}
        </label>
        <select
          id="cf-topic"
          className="contact-input contact-select"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        >
          <option>{copy.topicTraining}</option>
          <option>{copy.topicCustom}</option>
          <option>{copy.topicAdvisory}</option>
          <option>{copy.topicOther}</option>
        </select>
      </div>

      <div className="contact-field">
        <label htmlFor="cf-message" className="contact-label">
          {copy.message}
        </label>
        <textarea
          id="cf-message"
          className="contact-input contact-textarea"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
      </div>

      {touched && !valid && <p className="contact-error">{copy.required}</p>}
      {status === "error" && <p className="contact-error">{copy.errorBody}</p>}

      <button type="submit" className="btn btn-primary contact-submit" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.send}
      </button>
    </form>
  );
}
