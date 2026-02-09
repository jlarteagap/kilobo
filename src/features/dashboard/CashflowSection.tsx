"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, Sankey, Tooltip } from "recharts"

const data = {
  nodes: [
    { name: "Salario" }, // 0
    { name: "Freelance" }, // 1
    { name: "Ingresos Totales" }, // 2
    { name: "Vivienda" }, // 3
    { name: "Comida" }, // 4
    { name: "Transporte" }, // 5
    { name: "Ahorro/Excedente" }, // 6
  ],
  links: [
    { source: 0, target: 2, value: 5000 },
    { source: 1, target: 2, value: 2000 },
    { source: 2, target: 3, value: 2500 },
    { source: 2, target: 4, value: 800 },
    { source: 2, target: 5, value: 400 },
    { source: 2, target: 6, value: 3300 },
  ],
}

type NodeProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
    payload: { name: string; value: number };
    containerWidth: number;
};
  
const MyCustomNode = ({ x, y, width, height, index, payload, containerWidth }: NodeProps) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#10B981" // emerald-500
        fillOpacity="1"
        data-index={index}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize="12"
        fill="#fff"
        className="font-medium pointer-events-none"
      >
        {/* Shorten name if needed or show on hover */}
      </text>
       <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        alignmentBaseline="middle"
        fill="#374151"
        fontSize="12"
        fontWeight="500"
      >
        {payload.name}
      </text>
    </g>
  );
};

export function CashflowSection() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="text-gray-800">Flujo de Caja Mensual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                data={data}
                nodeWidth={12}
                nodePadding={50}
                margin={{
                    left: 20,
                    right: 80, // Space for labels
                    top: 20,
                    bottom: 20,
                }}
                link={{ stroke: '#10B981', strokeOpacity: 0.2 }}
                node={<MyCustomNode x={0} y={0} width={0} height={0} index={0} payload={{
                    name: "",
                    value: 0
                }} containerWidth={0} />}
                >
                    <Tooltip />
                </Sankey>
            </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
