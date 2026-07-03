import { CategoryPage as CategoryPageView } from "@/components/category-page";
import { categoryOrder, categorySlug } from "@/lib/resource-helpers";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return categoryOrder.map((category) => ({
    slug: categorySlug(category),
  }));
}

export default function CategoryPage({ params }: CategoryPageProps) {
  return <CategoryPageView language="zh" slug={params.slug} />;
}
