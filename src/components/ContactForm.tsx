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

import { useState, useEffect, type FormEvent } from "react";
import { contactEmail, contactFormEndpoint } from "@/config/contact";

interface ContactFormCopy {
  name: string;
  email: string;
  topic: string;
  topicTraining: string;
  topicCustom: string;
  topicAdvisory: string;
  /** "Speaking engagement" (PRIME 2026-10-07 04:48): the topic ?intent=speaking selects. */
  topicSpeaking: string;
  topicOther: string;
  message: string;
  send: string;
  sending: string;
  successTitle: string;
  successBody: string;
  errorBody: string;
  required: string;
  /** The message template prefilled when a reader arrives from the speaking route (G8, 2026-10-05):
   *  event, audience, date, outcome, each on its own line, for the reader to fill in. */
  speakingTemplate?: string;
  /** The same for the advisory route: the decision and the deadline. */
  advisoryTemplate?: string;
  /** The course route (2026-10-06, from an open material's "taught live" call to action): the course, the group,
   *  where and when, the outcome. Carries a literal "{course}" that the form fills from the link's course parameter. */
  courseTemplate?: string;
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

  // ROUTED BY INTENT (G8, SCOUT, adopted 2026-10-05). The cards above the form
  // link here as /contact?intent=<x>#contact-form; the intent preselects the
  // topic and, for advisory and speaking, prefills the message with the
  // questions those conversations start from. Read after mount, so the server
  // render and the first client render agree (the static page cannot see the
  // query string). An unknown or absent intent changes nothing.
  useEffect(() => {
    const intent = new URLSearchParams(window.location.search).get("intent");
    if (intent === "training") setTopic(copy.topicTraining);
    else if (intent === "advisory") {
      setTopic(copy.topicAdvisory);
      if (copy.advisoryTemplate) setMessage((m) => m || copy.advisoryTemplate || "");
    } else if (intent === "speaking") {
      // Speaking has its own topic since 2026-10-07 (PRIME 04:48); the event questions still open the message.
      setTopic(copy.topicSpeaking);
      if (copy.speakingTemplate) setMessage((m) => m || copy.speakingTemplate || "");
    } else if (intent === "other") {
      // Anything else: the catch-all topic and an empty message.
      setTopic(copy.topicOther);
    } else if (intent === "course") {
      // A class of an open material, taught live (2026-10-06): the "custom program for a team" topic, and the message
      // opened with the course's name, taken from the link and cut at 120 characters (it lands in an editable field
      // the reader sees and can change; nothing else reads it).
      setTopic(copy.topicCustom);
      const course = (new URLSearchParams(window.location.search).get("course") ?? "").slice(0, 120);
      if (copy.courseTemplate) setMessage((m) => m || (copy.courseTemplate ?? "").replace("{course}", course));
    }
  }, [copy.topicTraining, copy.topicCustom, copy.topicAdvisory, copy.topicSpeaking, copy.topicOther, copy.advisoryTemplate, copy.speakingTemplate, copy.courseTemplate]);

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
    <form className="contact-form" id="contact-form" onSubmit={handleSubmit} noValidate>
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
          {/* Speaking engagement (PRIME 2026-10-07 04:48), after advisory and before the catch-all. */}
          <option>{copy.topicSpeaking}</option>
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
