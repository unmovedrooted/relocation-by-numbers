// app/api/fire-email/route.ts
import { NextResponse } from "next/server";

// Swap this section for your email provider:
//   Resend:     import { Resend } from "resend"
//   Mailchimp:  fetch("https://us1.api.mailchimp.com/3.0/lists/{id}/members", ...)
//   Loops:      fetch("https://app.loops.so/api/v1/contacts/create", ...)
//   Convertkit: fetch("https://api.convertkit.com/v3/forms/{id}/subscribe", ...)

const PROVIDER = process.env.EMAIL_PROVIDER ?? "log"; // "resend" | "loops" | "log"
const EMAIL_API_KEY = process.env.EMAIL_API_KEY ?? "";
const EMAIL_LIST_ID = process.env.EMAIL_LIST_ID ?? "";

type Body = {
  email: string;
  fireAge?: number | null;
  location?: string;
};

async function addToList(body: Body): Promise<void> {
  const { email, fireAge, location } = body;

  if (PROVIDER === "resend") {
    // Resend audiences
    await fetch(`https://api.resend.com/audiences/${EMAIL_LIST_ID}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        data: { fire_age: fireAge, location },
      }),
    });
    return;
  }

  if (PROVIDER === "loops") {
    await fetch("https://app.loops.so/api/v1/contacts/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        fireAge,
        location,
        source: "fire-calculator",
        userGroup: "fire-saver",
      }),
    });
    return;
  }

  // Default: log to console (dev / no provider set)
  console.log("[fire-email] captured:", { email, fireAge, location });
}

export async function POST(request: Request) {
  try {
    const body: Body = await request.json();
    const email = body.email?.trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await addToList({ email, fireAge: body.fireAge, location: body.location });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[fire-email] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}