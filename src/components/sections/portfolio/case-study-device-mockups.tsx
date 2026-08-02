import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { DeviceFrame } from "@/components/sections/portfolio/device-frame";

/** Device-mockup grid - only rendered by the caller when `mockupImages` is non-empty. */
function CaseStudyDeviceMockups({ mockupImages, title }: { mockupImages: string[]; title: string }) {
  return (
    <Container className="flex flex-col gap-8">
      <Eyebrow>Responsive Mockups</Eyebrow>
      <div className="grid gap-6 sm:grid-cols-2">
        {mockupImages.map((url, index) => (
          <DeviceFrame key={url} imageUrl={url} alt={`${title} mockup ${index + 1}`} />
        ))}
      </div>
    </Container>
  );
}

export { CaseStudyDeviceMockups };
