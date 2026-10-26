export type PageId = "home" | "work" | "studio" | "news" | "contact";

export const pages: { id: PageId; href: string; index: string; name: string }[] = [
  { id: "home", href: "/", index: "01", name: "Home" },
  { id: "work", href: "/work", index: "02", name: "Work" },
  { id: "studio", href: "/studio", index: "03", name: "Studio" },
  { id: "news", href: "/news", index: "04", name: "News" },
  { id: "contact", href: "/contact", index: "05", name: "Contact" },
];

export const projects = [
  { title: "Northline", category: "Website", wash: "wash-a" },
  { title: "Fieldwork", category: "Identity", wash: "wash-b" },
  { title: "Harbor", category: "Campaign", wash: "wash-c" },
  { title: "Atelier", category: "Website", wash: "wash-d" },
  { title: "Kindred", category: "Editorial", wash: "wash-e" },
];

export const clients = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
