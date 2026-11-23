import { featuredWork } from "./site";
import { withBase } from "../lib/url";

export type Publication = {
  slug: string;
  title: string;
  tags: string[];
  author: string;
  image: string;
  imageAlt: string;
  excerpt: string;
};

const [northlineShot, fieldworkShot, harborShot] = featuredWork;

export const publications: Publication[] = [
  {
    slug: "project-new-zealand",
    title: "Project New Zealand | Building a home on the other side of the world",
    tags: ["Sustainability", "Outdoors"],
    author: "Format",
    image: northlineShot.image,
    imageAlt: northlineShot.imageAlt,
    excerpt:
      "A look at building with intention across continents — material choices, local craft, and the pace of making a home far from the studio.",
  },
  {
    slug: "floor-on-sustainability-at-format",
    title: "Floor on sustainability at Format",
    tags: ["News"],
    author: "Floor",
    image: fieldworkShot.image,
    imageAlt: fieldworkShot.imageAlt,
    excerpt:
      "Notes from a conversation on circular materials, honest storytelling, and what sustainability means for contemporary furniture brands.",
  },
  {
    slug: "we-are-just-getting-started",
    title: "We are just getting started",
    tags: ["Insight"],
    author: "Format",
    image: harborShot.image,
    imageAlt: harborShot.imageAlt,
    excerpt:
      "Early reflections on direction, practice, and the work ahead — a short editorial from the studio.",
  },
];

export function getPublication(slug: string): Publication | undefined {
  return publications.find((item) => item.slug === slug);
}