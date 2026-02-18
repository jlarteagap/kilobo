import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function CashflowSectionSkeleton() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        {/* Simula el gráfico Sankey */}
        <div className="h-[300px] w-full flex items-end gap-3 px-4">
          {[40, 70, 50, 90, 60, 45, 80].map((height, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-md"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}