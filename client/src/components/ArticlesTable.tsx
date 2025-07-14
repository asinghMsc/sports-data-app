import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { columns, type Article } from "./articles-columns"
import { Table } from "./ui/table"

export function ArticlesTable() {
  const [data, setData] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from("articles").select("*").order("published_at", { ascending: false })
      .then(({ data, error }) => {
        console.log("[ArticlesTable] Supabase select data:", data, "error:", error);
        setData(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mx-auto py-10">
      {loading ? (
        <div>Loading articles...</div>
      ) : (
        
        <Table>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.accessorKey as string}>{col.header as string}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(article => (
              <tr key={article.id}>
                {columns.map(col => (
                  <td key={col.accessorKey as string}>
                    {// @ts-ignore
                    article[col.accessorKey as keyof Article]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  )
}