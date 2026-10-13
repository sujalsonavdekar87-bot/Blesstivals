import { useState, type FormEvent } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import {
  useCreatePublicInquiry,
  type ServiceItem,
} from "@workspace/api-client-react";

type InquiryValues = {
  name: string;
  phone: string;
  email: string;
  eventType: string;
  eventDate: string;
  location: string;
  message: string;
  website: string;
};

const initialValues: InquiryValues = {
  name: "",
  phone: "",
  email: "",
  eventType: "",
  eventDate: "",
  location: "",
  message: "",
  website: "",
};

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#d8cfc3] bg-[#fffaf3] px-4 py-3 text-sm text-[#342a26] outline-none transition focus:border-[#a54e5b] focus:ring-2 focus:ring-[#a54e5b]/15";

export function InquiryForm({ services }: { services: ServiceItem[] }) {
  const mutation = useCreatePublicInquiry();
  const [values, setValues] = useState(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  function update(
    field: keyof InquiryValues,
    value: string,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);
    setSubmitError("");

    try {
      await mutation.mutateAsync({
        data: {
          name: values.name.trim(),
          phone: values.phone.trim(),
          ...(values.email.trim() ? { email: values.email.trim() } : {}),
          eventType: values.eventType,
          ...(values.eventDate ? { eventDate: values.eventDate } : {}),
          ...(values.location.trim()
            ? { location: values.location.trim() }
            : {}),
          message: values.message.trim(),
          website: values.website,
        },
      });
      setValues(initialValues);
      setSubmitted(true);
    } catch {
      setSubmitError(
        "We couldn’t send that just now. Please call us or message us on Instagram instead.",
      );
    }
  }

  return (
    <div className="rounded-[1.5rem] border border-[#d8cfc3] bg-[#fbf8f2] p-5 md:p-8">
      <div className="mb-7">
        <p className="eyebrow text-[#a54e5b]">Share a few details</p>
        <h3 className="serif mt-3 text-3xl">Start an enquiry.</h3>
        <p className="mt-3 text-sm leading-6 text-[#71635b]">
          Tell us a little about the occasion. The BlessTivals team will follow
          up with you directly.
        </p>
      </div>

      {submitted && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-[#a5b49a] bg-[#eef2e8] p-4 text-sm leading-6 text-[#344831]"
        >
          <Check size={18} className="mt-1 shrink-0" />
          Your enquiry has been received. We’ll be in touch.
        </div>
      )}
      {submitError && (
        <p
          role="alert"
          className="mb-6 rounded-xl border border-[#c27e7e] bg-[#fbefed] p-4 text-sm leading-6 text-[#7b3037]"
        >
          {submitError}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] h-px w-px overflow-hidden"
        >
          <label htmlFor="website">Leave this field blank</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#51443c]">
            Your name
            <input
              className={fieldClass}
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[#51443c]">
            Phone number
            <input
              className={fieldClass}
              name="phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              pattern="[0-9+() -]{7,32}"
              required
              minLength={7}
              maxLength={32}
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[#51443c]">
            Email <span className="font-normal text-[#897b70]">optional</span>
            <input
              className={fieldClass}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[#51443c]">
            Event type
            <select
              className={fieldClass}
              name="eventType"
              required
              value={values.eventType}
              onChange={(event) => update("eventType", event.target.value)}
            >
              <option value="">Select an occasion</option>
              {services.map((service) => (
                <option key={service.id} value={service.title}>
                  {service.title}
                </option>
              ))}
              <option value="Other event">Another kind of event</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#51443c]">
            Event date <span className="font-normal text-[#897b70]">optional</span>
            <input
              className={fieldClass}
              name="eventDate"
              type="date"
              value={values.eventDate}
              onChange={(event) => update("eventDate", event.target.value)}
            />
          </label>
          <label className="block text-xs font-semibold text-[#51443c]">
            Event location{" "}
            <span className="font-normal text-[#897b70]">optional</span>
            <input
              className={fieldClass}
              name="location"
              maxLength={180}
              placeholder="City or venue area"
              value={values.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </label>
        </div>

        <label className="block text-xs font-semibold text-[#51443c]">
          What would you like help with?
          <textarea
            className={`${fieldClass} min-h-32 resize-y`}
            name="message"
            required
            minLength={10}
            maxLength={3000}
            value={values.message}
            onChange={(event) => update("message", event.target.value)}
          />
        </label>
        <div className="flex flex-col items-start justify-between gap-4 pt-1 sm:flex-row sm:items-center">
          <p className="max-w-sm text-[11px] leading-5 text-[#897b70]">
            Your details will be used to respond to this enquiry.
          </p>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#a54e5b] px-6 py-3 text-[11px] font-bold tracking-[.1em] text-white transition hover:bg-[#8e3f4b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                SENDING…
              </>
            ) : (
              <>
                SEND ENQUIRY <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
