import { categoryOrder, categorySlug } from "@/lib/resource-helpers";
import { CategoryPage } from "@/components/category-page";

interface EnglishCategoryPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return categoryOrder.map((category) => ({
    slug: categorySlug(category),
  }));
}

export default function EnglishCategoryPage({ params }: EnglishCategoryPageProps) {
  return <CategoryPage language="en" slug={params.slug} />;
}
