import "server-only";

import path from "node:path";
import * as React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

import { documentColors, typeScale } from "../lib/theme";

/** Real signature asset, provided by the founder - see DE7 in the build's task list. */
export const SIGNATURE_IMAGE_PATH = path.join(
  process.cwd(),
  "src/features/documents/assets/signature-abhijit.png"
);

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-end",
  },
  signature: {
    height: 40,
    marginBottom: 2,
  },
  name: {
    fontSize: typeScale.md,
    fontWeight: 700,
    color: documentColors.foreground,
  },
  title: {
    fontSize: typeScale.sm,
    color: documentColors.mutedForeground,
  },
});

export interface SignatureBlockProps {
  name: string;
  title: string;
}

/** The signature + name/title block every document that needs sign-off ends with. */
export function SignatureBlock({ name, title }: SignatureBlockProps) {
  return (
    <View style={styles.container}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's <Image>, not the HTML element; no alt prop exists in its API */}
      <Image src={SIGNATURE_IMAGE_PATH} style={styles.signature} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
