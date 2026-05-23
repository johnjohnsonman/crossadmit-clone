import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, logRateLimit } from "@/lib/rate-limit";
import {
  extractIpHash,
  submitAnonymousPost,
} from "@/lib/posts/submit-anonymous";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    const password = String(body.password ?? "").trim();
    const category = String(body.category ?? "").trim();
    const language = body.language === "ko" ? "ko" : "en";

    if (title.length < 5) {
      return NextResponse.json(
        { success: false, reason: "Title must be at least 5 characters." },
        { status: 400 }
      );
    }
    if (content.length < 30) {
      return NextResponse.json(
        { success: false, reason: "Content must be at least 30 characters." },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, reason: "Password must be exactly 4 digits." },
        { status: 400 }
      );
    }
    if (!category) {
      return NextResponse.json(
        { success: false, reason: "Category is required." },
        { status: 400 }
      );
    }

    const ipHash = extractIpHash(request);
    const rate = await checkRateLimit(ipHash, "post", 300);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          reason: `Please wait ${rate.retryAfter ?? 300} seconds before posting again.`,
        },
        { status: 429 }
      );
    }

    const turnstileOk = await verifyTurnstile(
      String(body.turnstile_token ?? "")
    );
    if (!turnstileOk) {
      return NextResponse.json(
        { success: false, reason: "Captcha verification failed." },
        { status: 400 }
      );
    }

    const result = await submitAnonymousPost(
      {
        category,
        university: body.university,
        university_id: body.university_id ?? null,
        nickname: body.nickname,
        password,
        title,
        content,
        language,
        autoTranslate: body.auto_translate !== false,
      },
      ipHash
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, reason: result.reason },
        { status: result.status }
      );
    }

    await logRateLimit(ipHash, "post");

    return NextResponse.json({
      success: true,
      redirect: result.redirect,
      slug: result.slug,
      category: result.category,
    });
  } catch (e) {
    console.error("[api/posts/submit]", e);
    return NextResponse.json(
      {
        success: false,
        reason: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
