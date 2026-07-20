import { Mail, Phone, Clock, MapPin } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Card, CardContent } from "@/components/ui/card";

interface ContactMethod {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

/**
 * Only renders methods with real values - siteConfig.contactPhone and
 * businessHours are currently undefined (see src/config/site.ts), so this
 * omits those rows rather than showing a fabricated phone number or hours.
 * Same "omit, don't fabricate" discipline already established for Home's
 * Trust Band.
 */
function ContactMethods() {
  const methods: ContactMethod[] = [
    {
      icon: Mail,
      label: "Email",
      value: siteConfig.contactEmail,
      href: `mailto:${siteConfig.contactEmail}`,
    },
    ...(siteConfig.contactPhone
      ? [
          {
            icon: Phone as LucideIcon,
            label: "Phone",
            value: siteConfig.contactPhone,
            href: `tel:${siteConfig.contactPhone}`,
          },
        ]
      : []),
    ...(siteConfig.businessHours
      ? [{ icon: Clock as LucideIcon, label: "Business hours", value: siteConfig.businessHours }]
      : []),
    ...(siteConfig.officeLocation
      ? [{ icon: MapPin as LucideIcon, label: "Location", value: siteConfig.officeLocation }]
      : []),
  ];

  return (
    <Section background="muted">
      <Container>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {methods.map((method) => (
            <Card key={method.label}>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
                  <method.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {method.label}
                </span>
                {method.href ? (
                  <a
                    href={method.href}
                    className="text-foreground hover:text-primary text-sm font-medium"
                  >
                    {method.value}
                  </a>
                ) : (
                  <span className="text-foreground text-sm font-medium">{method.value}</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { ContactMethods };
