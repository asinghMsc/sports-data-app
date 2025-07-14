import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { columns as baseColumns, type Article } from "./articles-columns";
import { DataTable } from "./ui/data-table";

const CATEGORY_OPTIONS = [
  "news",
  "opinion",
  "banter"
];

export function ArticlesTable() {
  const [data, setData] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  // Store suggestions per row ID
  const [suggestedCategories, setSuggestedCategories] = useState<{
    [id: string]: string;
  }>({});

  useEffect(() => {
    supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false })
      .then(({ data }) => {
        setData(data ?? []);
        setLoading(false);
      });
  }, []);

  // augment columns to have custom category.
  const columns = baseColumns.map((col) => {
    if (col.accessorKey === "category") {
      return {
        ...col,
        cell: ({ row }) => {
          const article = row.original as Article;
          const userSuggestion = suggestedCategories[article.id] || "";

          const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            setSuggestedCategories({
              ...suggestedCategories,
              [article.id]: e.target.value,
            });
          };

          return (
            <div>
              <div className="text-xs text-gray-500">
                AI category: <strong>{article.category || "—"}</strong>
              </div>
              <select
                className="border rounded px-2 py-1 mt-1"
                value={userSuggestion}
                onChange={handleCategoryChange}
              >
                <option value="">Suggest other…</option>
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {userSuggestion && (
                <div className="text-xs text-blue-600 mt-1">
                  User suggestion: {userSuggestion}
                </div>
              )}
            </div>
          );
        },
      };
    }
    return col;
  });

  return (
    <div className="container mx-auto py-10">
      <h2 className="text-xl font-semibold mb-4">Articles</h2>
      {loading ? (
        <div>Loading articles...</div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}