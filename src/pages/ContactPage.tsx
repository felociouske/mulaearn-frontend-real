import { useState, type FormEvent } from "react";
import { MailIcon, ChatBubbleIcon, ClockIcon } from "@/components/icons/Icons";

// Static support info + a form for now. Wiring this to actually send
// somewhere (email, a support-ticket model, Slack webhook, etc.) is a
// backend decision — flag which one you want and it's a quick follow-up.
export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // No backend endpoint yet — this just simulates submission so the UI
    // is ready to wire up.
    setSent(true);
    setMessage("");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dash-text">Contact & Support</h1>
      <p className="mt-1 text-sm text-dash-text/50">
        Reach out about payments, activation, or anything not working as expected.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-dash-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-dash-text/40">Send a message</p>
          {sent && (
            <p className="mt-3 rounded-md bg-dash-accent-500/10 px-3 py-2 text-sm text-dash-accent-500">
              Thanks — we'll get back to you shortly.
            </p>
          )}
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue…"
              className="w-full rounded-md border border-dash-border bg-dash-overlay px-3 py-2 text-sm text-dash-text focus:border-dash-accent-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-dash-accent-500 px-4 py-2 text-sm font-semibold text-dash-bg transition-colors hover:bg-dash-accent-600"
            >
              Send message
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-dash-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-dash-text/40">Other ways to reach us</p>
          <ul className="mt-3 space-y-3 text-sm text-dash-text/70">
            <li className="flex items-center gap-3">
              <span className="text-dash-text/50"><MailIcon size={18} /></span>
              <a href="mailto:support@mulaearn.com" className="hover:text-dash-accent-500">
                support@mulaearn.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-dash-text/50"><ChatBubbleIcon size={18} /></span>
              <span>WhatsApp support: 07XX XXX XXX</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-dash-text/50"><ClockIcon size={18} /></span>
              <span>Typical response time: within 24 hours</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
