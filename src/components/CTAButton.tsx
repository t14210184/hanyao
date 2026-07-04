"use client";

import React from "react";
import Link from "next/link";
import { trackEvent, trackLineContactAttempt, trackPhoneClickAttempt } from "@/lib/tracking";

interface CTAButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  children: React.ReactNode;
  trackEventName?: string;
  trackParams?: Record<string, unknown>;
  external?: boolean;
}

export default function CTAButton({
  href,
  onClick,
  className = "",
  children,
  trackEventName,
  trackParams = {},
  external = false
}: CTAButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const resolveSource = (pos?: unknown): "header_cta" | "sticky_cta" | "hero_cta" | "service_page" | "footer_cta" | "contact_page" | "contact_form" | "unknown" => {
      if (!pos || typeof pos !== "string") return "unknown";
      const p = pos.toLowerCase();
      if (p.includes("header")) return "header_cta";
      if (p.includes("sticky") || p.includes("bar")) return "sticky_cta";
      if (p.includes("hero")) return "hero_cta";
      if (p.includes("form") || p.includes("quote")) return "contact_form";
      if (p.includes("footer")) return "footer_cta";
      if (p.includes("contact")) return "contact_page";
      if (
        p.includes("service") ||
        p.includes("guide") ||
        p.includes("area") ||
        p.includes("cases") ||
        p.includes("faq")
      ) {
        return "service_page";
      }
      return "unknown";
    };

    const isTel = href?.startsWith("tel:");

    if (trackEventName) {
      if (trackEventName === "line_click") {
        const source = resolveSource(trackParams?.cta_position || trackParams?.cta_location);
        trackLineContactAttempt({
          contact_method: "line_link_open",
          event_source: source,
        });
      } else if (trackEventName === "phone_click") {
        if (isTel) {
          const source = resolveSource(trackParams?.cta_position || trackParams?.cta_location);
          trackPhoneClickAttempt({
            event_source: source,
          });
        }
      } else {
        trackEvent(trackEventName, trackParams);
      }
    }

    if (onClick) {
      onClick(e);
    }
  };

  const isTel = href?.startsWith("tel:");
  const isMail = href?.startsWith("mailto:");

  if (href) {
    if (external || isTel || isMail) {
      return (
        <a
          href={href}
          onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
          className={className}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        href={href}
        onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={className}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
      className={className}
    >
      {children}
    </button>
  );
}
