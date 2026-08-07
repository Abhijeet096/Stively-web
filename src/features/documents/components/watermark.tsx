import "server-only";

import path from "node:path";
import * as React from "react";
import { View, Image, StyleSheet } from "@react-pdf/renderer";

const WATERMARK_PATH = path.join(process.cwd(), "public/brand/watermark.png");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: "35%",
    left: "15%",
    width: "70%",
    opacity: 0.06,
  },
});

/**
 * Optional faint background mark - reuses the existing public/brand/
 * watermark.png asset rather than reconstructing a diagonal text effect by
 * hand. Off by default; a template opts in by rendering this once, anywhere
 * in its tree (it's absolutely positioned, so placement in the JSX doesn't
 * matter). Not used by Invoice/Receipt in this pass - available for
 * document types that want a "DRAFT"-style backdrop later.
 */
export function Watermark() {
  return (
    <View style={styles.container} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's <Image>, not the HTML element; no alt prop exists in its API */}
      <Image src={WATERMARK_PATH} />
    </View>
  );
}
