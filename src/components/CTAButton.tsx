"use client";

import React from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracking";

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
    // Push event to dataLayer only if it matches approved events
    if (
      trackEventName &&
      [
        "phone_click",
        "line_click",
        "line_quote_copy",
        "line_open_attempt",
        "form_start",
        "form_error",
        "sticky_cta_scroll"
      ].includes(trackEventName)
    ) {
      trackEvent(trackEventName, trackParams);
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
