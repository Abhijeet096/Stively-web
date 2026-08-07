import "server-only";

import * as React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

import { documentColors, PAGE, typeScale } from "../lib/theme";
import { siteConfig } from "@/config/site";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: documentColors.ink,
    paddingVertical: 12,
    paddingHorizontal: PAGE.margin,
  },
  text: {
    fontSize: typeScale.sm,
    color: documentColors.inkMutedForeground,
    textAlign: "center",
  },
});

/**
 * The quiet contact-line bar every document closes with, matching the
 * founder's reference invoice. Reuses `siteConfig`/`WHATSAPP_NUMBER` rather
 * than hardcoding contact details a second time - if either ever changes,
 * this updates with it instead of drifting. Deliberately shows
 * `officeLocation`'s real current value ("Remote-first — India") rather
 * than the reference PDF's literal "Jaipur, India" text, since siteConfig
 * is the authoritative source, not a Canva template designed at a different
 * point in time.
 */
export function DocumentFooter() {
  const phone = `+91 ${WHATSAPP_NUMBER.slice(2)}`;

  return (
    <View style={styles.bar} fixed>
      <Text style={styles.text}>
        {siteConfig.officeLocation} · {phone} · {siteConfig.contactEmail}
      </Text>
    </View>
  );
}
