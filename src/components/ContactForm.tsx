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
// THE HANDOFF IS NAMED FOR WHAT IT IS (production audit of 2026-10-15, F01,
// implemented 2026-10-18). Until then the mailto path set the state to "sent"
// and showed "Your message is on its way", so a visitor whose mail client never
// opened, or who closed the draft, believed an enquiry had been delivered. Now:
//   - the button says "Open email draft", not "Send message";
//   - after the click the form STAYS, filled in, under a "drafted" notice that
//     says the draft opened in the visitor's email app and has to be sent from
//     there, shows the address, and offers the whole message to copy, so the
//     text is recoverable with or without a mail handler;
//   - "sent" is reached ONLY on the POST path, where a 2xx is a real
//     acknowledgement of delivery. Nothing claims delivery without one.
//
// This keeps the form working today AND ready for the service layer later: when
// an endpoint is configured (e.g. from the admin panel), the same form starts
// POSTing with no code change here.
//
// Fields: name, email, topic (select), message. Light client-side validation,
// a drafted state (mailto) and a success state (POST). No external form
// library, no tracking.
// ============================================================================

import { useState, useEffect, useRef, type FormEvent } from "react";
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
  /** The drafted notice (F01, 2026-10-18): title, body with the address in {email}, the copy button's three states and the
   *  label of the message box that holds the recoverable text. */
  draftedTitle: string;
  draftedBody: string;
  copyMessage: string;
  copied: string;
  copyFailed: string;
  draftedMessageLabel: string;
  /** The message template prefilled when a reader arrives from the speaking route (G8, 2026-10-05):
   *  event, audience, date, outcome, each on its own line, for the reader to fill in. */
  speakingTemplate?: string;
  /** The same for the advisory route: the decision and the deadline. */
  advisoryTemplate?: string;
  /** The course route (2026-10-06, from an open material's "taught live" call to action): the course, the group,
   *  where and when, the outcome. Carries a literal "{course}" that the form fills from the link's course parameter. */
  courseTemplate?: string;
}

// "drafted" is the mailto path's end state: the draft was handed to the visitor's mail client, nothing was delivered yet.
type Status = "idle" | "sending" | "sent" | "drafted" | "error";
// The copy button's own state: idle, copied, or the clipboard refused (then the box is selected for a manual copy).
type CopyState = "idle" | "copied" | "failed";

export default function ContactForm({ copy }: { copy: ContactFormCopy }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(copy.topicTraining);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [touched, setTouched] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  // The message box in the drafted notice, for the manual-select fallback when the clipboard API is unavailable.
  const draftRef = useRef<HTMLTextAreaElement>(null);

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
    // The visitor's mail app opens with the draft; whether it is sent is their act, so the state is "drafted", never
    // "sent", and the form stays filled in under the notice (F01, 2026-10-18).
    const subject = encodeURIComponent(`[${topic}] ${name}`);
    const body = encodeURIComponent(draftText());
    window.location.href = `mailto:${contactEmail()}?subject=${subject}&body=${body}`;
    setCopyState("idle");
    setStatus("drafted");
  }

  /** The plain text of the draft, as the mail client receives it: the message, then who it is from and about. */
  function draftText(): string {
    return `${message}\n\n---\nFrom: ${name}\nReply to: ${email}\nTopic: ${topic}`;
  }

  /** Copy the draft to the clipboard; when the API is unavailable or refuses, select the box so the visitor can copy. */
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draftText());
      setCopyState("copied");
    } catch {
      draftRef.current?.focus();
      draftRef.current?.select();
      setCopyState("failed");
    }
  }

  // Success state replaces the form: reached only when a configured endpoint acknowledged the message (2xx).
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

      {/* The drafted notice (F01): the draft opened in the visitor's email app and must be sent from there; the text is
          here to copy, and the address is named, so a visitor with no mail handler loses nothing. role="status" so a
          screen reader announces it; the form below keeps every field. */}
      {status === "drafted" && (
        <div className="contact-success contact-drafted" role="status">
          <p className="contact-success-title">{copy.draftedTitle}</p>
          <p className="contact-success-body">{copy.draftedBody.replace("{email}", contactEmail())}</p>
          <label htmlFor="cf-draft" className="contact-label">
            {copy.draftedMessageLabel}
          </label>
          <textarea id="cf-draft" ref={draftRef} className="contact-input contact-textarea" value={draftText()} readOnly rows={6} />
          <button type="button" className="btn btn-secondary contact-copy" onClick={copyDraft}>
            {copyState === "copied" ? copy.copied : copyState === "failed" ? copy.copyFailed : copy.copyMessage}
          </button>
        </div>
      )}

      <button type="submit" className="btn btn-primary contact-submit" disabled={status === "sending"}>
        {status === "sending" ? copy.sending : copy.send}
      </button>
    </form>
  );
}
