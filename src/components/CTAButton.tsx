"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent, trackLineContactAttempt, trackPhoneClickAttempt } from "@/lib/tracking";
import { siteConfig } from "@/data/site";
import LineDesktopQrDialog from "@/components/LineDesktopQrDialog";
import {
  buildDesktopLineQrHandoff,
  buildGenericLineMessage,
  buildLineOaMessageUrl,
  createLinePrepareRequestId,
  isMobileLineClient,
  isOfficialLineProfileUrl,
  prepareLineLead,
} from "@/lib/line-contact";

interface CTAButtonProps {
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  children: React.ReactNode;
  trackEventName?: string;
  trackParams?: Record<string, unknown>;
  external?: boolean;
  dataLineStage?: string;
}

export default function CTAButton({
  href,
  onClick,
  className = "",
  children,
  trackEventName,
  trackParams = {},
  external = false,
  dataLineStage,
}: CTAButtonProps) {
  const lineAttemptInFlight = useRef(false);
  const lineHandoffStarted = useRef(false);
  const [desktopLineQrHandoff, setDesktopLineQrHandoff] = useState<ReturnType<
    typeof buildDesktopLineQrHandoff
  >>(null);

  useEffect(() => {
    const resetAfterLineReturn = () => {
      if (!lineHandoffStarted.current) return;
      lineHandoffStarted.current = false;
      lineAttemptInFlight.current = false;
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetAfterLineReturn();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") resetAfterLineReturn();
    };
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  const handleClick = async (e: React.MouseEvent<HTMLElement>) => {
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
    const isLineCta =
      trackEventName === "line_click" || isOfficialLineProfileUrl(href);

    if (isLineCta && isMobileLineClient()) {
      e.preventDefault();
      if (lineAttemptInFlight.current) return;
      lineAttemptInFlight.current = true;

      if (onClick) onClick(e);

      const eventSource = resolveSource(
        trackParams?.cta_position || trackParams?.cta_location
      );
      const prepared = await prepareLineLead({
        requestId: createLinePrepareRequestId(),
      });
      const message = buildGenericLineMessage(prepared?.lead_token);

      trackLineContactAttempt({
        contact_method: "line_link_open",
        event_source: eventSource,
        service_type:
          typeof trackParams?.service_type === "string"
            ? trackParams.service_type
            : undefined,
        prepare_status: prepared?.lead_token ? "success" : "fail",
        handoff_type: message ? "oa_message" : "profile_fallback",
      });

      const destination = message
        ? buildLineOaMessageUrl(message)
        : siteConfig.lineUrl;
      if (typeof window !== "undefined") {
        lineHandoffStarted.current = true;
        window.location.assign(destination);
      }
      return;
    }

    if (isLineCta) {
      e.preventDefault();
      if (lineAttemptInFlight.current) return;
      lineAttemptInFlight.current = true;

      if (onClick) onClick(e);

      const eventSource = resolveSource(
        trackParams?.cta_position || trackParams?.cta_location
      );
      const prepared = await prepareLineLead({
        requestId: createLinePrepareRequestId(),
      });
      const handoff = buildDesktopLineQrHandoff(prepared?.lead_token);

      trackLineContactAttempt({
        contact_method: "line_link_open",
        event_source: eventSource,
        service_type:
          typeof trackParams?.service_type === "string"
            ? trackParams.service_type
            : undefined,
        prepare_status: prepared?.lead_token ? "success" : "fail",
        handoff_type: handoff ? "desktop_qr" : "profile_fallback",
      });

      if (handoff) {
        setDesktopLineQrHandoff(handoff);
        return;
      }

      lineAttemptInFlight.current = false;
      if (typeof window !== "undefined") {
        lineHandoffStarted.current = true;
        window.location.assign(siteConfig.lineUrl);
      }
      return;
    }

    if (trackEventName) {
      if (trackEventName === "line_click") {
        const source = resolveSource(trackParams?.cta_position || trackParams?.cta_location);
        trackLineContactAttempt({
          contact_method: "line_link_open",
          event_source: source,
          service_type:
            typeof trackParams?.service_type === "string"
              ? trackParams.service_type
              : undefined,
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

  const desktopQrDialog = desktopLineQrHandoff ? (
    <LineDesktopQrDialog
      handoff={desktopLineQrHandoff}
      onClose={() => {
        setDesktopLineQrHandoff(null);
        lineAttemptInFlight.current = false;
        lineHandoffStarted.current = false;
      }}
    />
  ) : null;

  if (href) {
    if (external || isTel || isMail) {
      return (
        <>
          <a
            href={href}
            onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
            className={className}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            data-line-stage={dataLineStage}
          >
            {children}
          </a>
          {desktopQrDialog}
        </>
      );
    }

    return (
      <>
        <Link
          href={href}
          onClick={handleClick as React.MouseEventHandler<HTMLAnchorElement>}
          className={className}
          data-line-stage={dataLineStage}
        >
          {children}
        </Link>
        {desktopQrDialog}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleClick as React.MouseEventHandler<HTMLButtonElement>}
        className={className}
        data-line-stage={dataLineStage}
      >
        {children}
      </button>
      {desktopQrDialog}
    </>
  );
}
