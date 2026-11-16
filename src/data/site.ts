import { withBase } from "../lib/url";

export type PageId = "home" | "work" | "studio" | "news" | "contact";

export const pages: { id: PageId; href: string; index: string; name: string }[] = [
  { id: "home", href: withBase("/"), index: "01", name: "Home" },
  { id: "work", href: withBase("/work"), index: "02", name: "Work" },
  { id: "studio", href: withBase("/studio"), index: "03", name: "Studio" },
  { id: "news", href: withBase("/news"), index: "04", name: "News" },
  { id: "contact", href: withBase("/contact"), index: "05", name: "Contact" },
];

export const navLinks: { id: string; href: string; label: string }[] = [
  { id: "home", href: withBase("/"), label: "Home" },
  { id: "services", href: withBase("/#services"), label: "Services" },
  { id: "studio", href: withBase("/studio"), label: "About" },
  { id: "foresight", href: withBase("/#foresight"), label: "Foresight Lab" },
  { id: "contact", href: withBase("/contact"), label: "Contact" },
];

export const projects = [
  { title: "Northline", category: "Website", wash: "wash-a" },
  { title: "Fieldwork", category: "Identity", wash: "wash-b" },
  { title: "Harbor", category: "Campaign", wash: "wash-c" },
  { title: "Atelier", category: "Website", wash: "wash-d" },
  { title: "Kindred", category: "Editorial", wash: "wash-e" },
];

export const clients = Array.from({ length: 12 }, () => ({
  src: withBase("/images/client-tmh.jpg"),
  alt: "Take Me Home",
}));
