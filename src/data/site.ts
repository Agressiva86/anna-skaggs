import { withBase } from "../lib/url";

export type PageId = "home" | "work" | "studio" | "news" | "contact";

export const pages: { id: PageId; href: string; index: string; name: string }[] = [
  { id: "home", href: withBase("/"), index: "01", name: "Home" },
  { id: "work", href: withBase("/work"), index: "02", name: "Work" },
  { id: "studio", href: withBase("/studio"), index: "03", name: "Studio" },
  { id: "news", href: withBase("/news"), index: "04", name: "News" },
  { id: "contact", href: withBase("/contact"), index: "05", name: "Contact" },
];

export const navLinks: {
  id: string;
  href: string;
  label: string;
  pl: string;
  children?: { href: string; label: string; pl: string }[];
}[] = [
  { id: "home", href: withBase("/"), label: "Home", pl: "Start" },
  {
    id: "services",
    href: withBase("/#services"),
    label: "Services",
    pl: "Usługi",
    children: [
      { href: "#", label: "Services for Furniture Brands", pl: "Usługi dla marek meblowych" },
      { href: "#", label: "Services for Design Studio", pl: "Usługi dla studiów projektowych" },
    ],
  },
  { id: "studio", href: withBase("/studio"), label: "About", pl: "O nas" },
  { id: "foresight", href: withBase("/#foresight"), label: "Foresight Lab", pl: "Foresight Lab" },
];

export const featuredWork = [
  {
    title: "Northline",
    text: "A website that turns a furniture collection into a clearer path from first look to purchase.",
    image: withBase("/images/portfolio-northline.webp"),
    imageAlt: "Living room with artwork and modular sofa",
  },
  {
    title: "Fieldwork",
    text: "An identity that keeps the product story consistent, from the showroom floor to the screen.",
    image: withBase("/images/portfolio-fieldwork.webp"),
    imageAlt: "Minimal bedroom with wooden platform bed",
  },
  {
    title: "Harbor",
    text: "A campaign that aligns the assortment, the story, and the way customers decide.",
    image: withBase("/images/portfolio-harbor.webp"),
    imageAlt: "Compact studio with built-in wardrobe and daybed",
  },
] as const;

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
